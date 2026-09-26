const db = require("../../database");

async function syncStockAlerts() {
  // 1. Sync OUT_OF_STOCK
  await db.raw(`
    INSERT INTO inventory_alerts (
      product_id,
      warehouse_id,
      location_id,
      alert_type,
      severity,
      message,
      is_read
    )
    SELECT
      s.product_id,
      l.warehouse_id,
      s.location_id,
      'OUT_OF_STOCK',
      'critical',
      CONCAT('Product "', p.name, '" (SKU: ', p.sku, ') is OUT OF STOCK at location "', l.name, '". Available: ', (s.quantity - s.reserved_quantity)),
      FALSE
    FROM inventory_stock s
    JOIN products p ON p.id = s.product_id AND p.is_active = TRUE
    JOIN locations l ON l.id = s.location_id
    WHERE (s.quantity - s.reserved_quantity) <= 0
      AND NOT EXISTS (
        SELECT 1 FROM inventory_alerts a
        WHERE a.product_id = s.product_id
          AND a.location_id = s.location_id
          AND a.alert_type = 'OUT_OF_STOCK'
          AND a.is_read = FALSE
      )
  `);

  // 2. Sync LOW_STOCK
  await db.raw(`
    INSERT INTO inventory_alerts (
      product_id,
      warehouse_id,
      location_id,
      alert_type,
      severity,
      message,
      is_read
    )
    SELECT
      s.product_id,
      l.warehouse_id,
      s.location_id,
      'LOW_STOCK',
      'warning',
      CONCAT('Product "', p.name, '" (SKU: ', p.sku, ') is LOW ON STOCK at location "', l.name, '". Available: ', (s.quantity - s.reserved_quantity), ' (Min threshold: ', COALESCE(rr.minimum_quantity, 10), ')'),
      FALSE
    FROM inventory_stock s
    JOIN products p ON p.id = s.product_id AND p.is_active = TRUE
    JOIN locations l ON l.id = s.location_id
    LEFT JOIN reorder_rules rr
      ON rr.product_id = s.product_id
      AND (rr.location_id IS NULL OR rr.location_id = s.location_id)
      AND rr.is_active = TRUE
    WHERE (s.quantity - s.reserved_quantity) > 0
      AND (s.quantity - s.reserved_quantity) <= COALESCE(rr.minimum_quantity, 10)
      AND NOT EXISTS (
        SELECT 1 FROM inventory_alerts a
        WHERE a.product_id = s.product_id
          AND a.location_id = s.location_id
          AND a.alert_type = 'LOW_STOCK'
          AND a.is_read = FALSE
      )
  `);
}

async function list(filters = {}) {
  const values = [];
  const conditions = [];

  if (filters.isRead !== undefined && filters.isRead !== "") {
    const isRead = filters.isRead === "true" || filters.isRead === true;
    values.push(isRead);
    conditions.push(`a.is_read = $${values.length}`);
  }

  if (filters.alertType) {
    values.push(filters.alertType);
    conditions.push(`a.alert_type = $${values.length}`);
  }

  if (filters.warehouseId) {
    values.push(filters.warehouseId);
    conditions.push(`a.warehouse_id = $${values.length}`);
  }

  if (filters.locationId) {
    values.push(filters.locationId);
    conditions.push(`a.location_id = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const limit = Math.max(1, Math.min(100, Number(filters.limit) || 50));
  const offset = Math.max(0, Number(filters.offset) || 0);

  values.push(limit);
  const limitIndex = values.length;

  values.push(offset);
  const offsetIndex = values.length;

  const result = await db.raw(
    `
    SELECT
      a.*,
      p.name AS product_name,
      p.sku,
      w.name AS warehouse_name,
      l.name AS location_name
    FROM inventory_alerts a
    LEFT JOIN products p ON p.id = a.product_id
    LEFT JOIN warehouses w ON w.id = a.warehouse_id
    LEFT JOIN locations l ON l.id = a.location_id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT $${limitIndex}
    OFFSET $${offsetIndex}
    `,
    values,
  );

  return result.rows;
}

async function findById(id) {
  const result = await db.raw(
    `
    SELECT
      a.*,
      p.name AS product_name,
      p.sku,
      w.name AS warehouse_name,
      l.name AS location_name
    FROM inventory_alerts a
    LEFT JOIN products p ON p.id = a.product_id
    LEFT JOIN warehouses w ON w.id = a.warehouse_id
    LEFT JOIN locations l ON l.id = a.location_id
    WHERE a.id = $1
    `,
    [id],
  );

  return result.rows[0] || null;
}

async function markRead(id, isRead = true) {
  const result = await db.raw(
    `
    UPDATE inventory_alerts
    SET
      is_read = $1,
      updated_at = NOW()
    WHERE id = $2
    RETURNING *
    `,
    [isRead, id],
  );

  return result.rows[0] || null;
}

module.exports = {
  syncStockAlerts,
  list,
  findById,
  markRead,
};
