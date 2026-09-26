const db = require("../../database");

async function createDelivery(data) {
  const deliveryNumber = data.deliveryNumber || `DEL-${Date.now()}`;

  const result = await db.query(
    `
    INSERT INTO deliveries (
      delivery_number,
      customer_id,
      warehouse_id,
      location_id,
      status,
      reference_number,
      notes,
      created_by
    )
    VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7)
    RETURNING *
    `,
    [
      deliveryNumber,
      data.customerId,
      data.warehouseId,
      data.locationId,
      data.referenceNumber || null,
      data.notes || null,
      data.createdBy,
    ],
  );

  return result.rows[0];
}

async function findById(id) {
  const result = await db.query(
    `
    SELECT
      d.*,
      c.name AS customer_name,
      w.name AS warehouse_name,
      l.name AS location_name
    FROM deliveries d
    LEFT JOIN customers c ON c.id = d.customer_id
    LEFT JOIN warehouses w ON w.id = d.warehouse_id
    LEFT JOIN locations l ON l.id = d.location_id
    WHERE d.id = $1
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
    conditions.push(`d.status = $${values.length}`);
  }

  if (filters.customerId) {
    values.push(filters.customerId);
    conditions.push(`d.customer_id = $${values.length}`);
  }

  if (filters.warehouseId) {
    values.push(filters.warehouseId);
    conditions.push(`d.warehouse_id = $${values.length}`);
  }

  if (filters.locationId) {
    values.push(filters.locationId);
    conditions.push(`d.location_id = $${values.length}`);
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
      d.*,
      c.name AS customer_name,
      w.name AS warehouse_name,
      l.name AS location_name
    FROM deliveries d
    LEFT JOIN customers c ON c.id = d.customer_id
    LEFT JOIN warehouses w ON w.id = d.warehouse_id
    LEFT JOIN locations l ON l.id = d.location_id
    ${whereClause}
    ORDER BY d.created_at DESC
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
    INSERT INTO delivery_items (
      delivery_id,
      product_id,
      location_id,
      quantity
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [data.deliveryId, data.productId, data.locationId, data.quantity],
  );

  return result.rows[0];
}

async function findItems(deliveryId, client = db) {
  const result = await client.query(
    `
    SELECT
      di.*,
      p.name AS product_name,
      p.sku,
      p.uom_id
    FROM delivery_items di
    JOIN products p ON p.id = di.product_id
    WHERE di.delivery_id = $1
    ORDER BY di.created_at ASC
    `,
    [deliveryId],
  );

  return result.rows;
}

async function findItem(deliveryId, productId, client = db) {
  const result = await client.query(
    `
    SELECT *
    FROM delivery_items
    WHERE delivery_id = $1
      AND product_id = $2
    `,
    [deliveryId, productId],
  );

  return result.rows[0] || null;
}

async function lockDelivery(id, client) {
  const result = await client.query(
    `
    SELECT *
    FROM deliveries
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
    UPDATE deliveries
    SET
      status = $1::varchar,
      validated_by = CASE
        WHEN $1::varchar = 'done' THEN $2
        ELSE validated_by
      END,
      validated_at = CASE
        WHEN $1::varchar = 'done' THEN NOW()
        ELSE validated_at
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
  createDelivery,
  findById,
  list,
  addItem,
  findItems,
  findItem,
  lockDelivery,
  updateStatus,
};