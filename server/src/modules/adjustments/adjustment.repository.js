const db = require("../../database");

async function createAdjustment(data) {
  const adjustmentNumber = data.adjustmentNumber || `ADJ-${Date.now()}`;

  const result = await db.query(
    `
    INSERT INTO adjustments (
      adjustment_number,
      warehouse_id,
      status,
      reason,
      created_by
    )
    VALUES ($1, $2, 'draft', $3, $4)
    RETURNING *
    `,
    [
      adjustmentNumber,
      data.warehouseId,
      data.reason || null,
      data.createdBy,
    ],
  );

  return result.rows[0];
}

async function findById(id) {
  const result = await db.query(
    `
    SELECT
      a.*,
      w.name AS warehouse_name
    FROM adjustments a
    LEFT JOIN warehouses w ON w.id = a.warehouse_id
    WHERE a.id = $1
    `,
    [id],
  );

  return result.rows[0] || null;
}

async function list(filters = {}) {
  const values = [];
  const conditions = [];

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`a.status = $${values.length}`);
  }

  if (filters.warehouseId) {
    values.push(filters.warehouseId);
    conditions.push(`a.warehouse_id = $${values.length}`);
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

  const result = await db.query(
    `
    SELECT
      a.*,
      w.name AS warehouse_name
    FROM adjustments a
    LEFT JOIN warehouses w ON w.id = a.warehouse_id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT $${limitIndex}
    OFFSET $${offsetIndex}
    `,
    values,
  );

  return result.rows;
}

async function addItem(data, client = db) {
  const result = await client.query(
    `
    INSERT INTO adjustment_items (
      adjustment_id,
      product_id,
      location_id,
      system_quantity,
      counted_quantity
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [
      data.adjustmentId,
      data.productId,
      data.locationId,
      data.systemQuantity,
      data.countedQuantity,
    ],
  );

  return result.rows[0];
}

async function findItems(adjustmentId, client = db) {
  const result = await client.query(
    `
    SELECT
      ai.*,
      p.name AS product_name,
      p.sku,
      p.uom_id,
      l.name AS location_name
    FROM adjustment_items ai
    JOIN products p ON p.id = ai.product_id
    JOIN locations l ON l.id = ai.location_id
    WHERE ai.adjustment_id = $1
    ORDER BY ai.created_at ASC
    `,
    [adjustmentId],
  );

  return result.rows;
}

async function findItem(adjustmentId, productId, locationId, client = db) {
  const result = await client.query(
    `
    SELECT *
    FROM adjustment_items
    WHERE adjustment_id = $1
      AND product_id = $2
      AND location_id = $3
    `,
    [adjustmentId, productId, locationId],
  );

  return result.rows[0] || null;
}

async function lockAdjustment(id, client) {
  const result = await client.query(
    `
    SELECT *
    FROM adjustments
    WHERE id = $1
    FOR UPDATE
    `,
    [id],
  );

  return result.rows[0] || null;
}

async function updateStatus(id, status, userId, client = db) {
  const result = await client.query(
    `
    UPDATE adjustments
    SET
      status = $1::varchar,
      completed_by = CASE
        WHEN $1::varchar = 'done' THEN $2
        ELSE completed_by
      END,
      completed_at = CASE
        WHEN $1::varchar = 'done' THEN NOW()
        ELSE completed_at
      END,
      updated_at = NOW()
    WHERE id = $3
    RETURNING *
    `,
    [status, userId, id],
  );

  return result.rows[0];
}

module.exports = {
  createAdjustment,
  findById,
  list,
  addItem,
  findItems,
  findItem,
  lockAdjustment,
  updateStatus,
};
