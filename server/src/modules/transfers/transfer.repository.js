const db = require("../../database");

async function createTransfer(data) {
  const transferNumber = data.transferNumber || `TRF-${Date.now()}`;

  const result = await db.query(
    `
    INSERT INTO transfers (
      transfer_number,
      source_warehouse_id,
      destination_warehouse_id,
      source_location_id,
      destination_location_id,
      status,
      reference_number,
      notes,
      created_by
    )
    VALUES ($1, $2, $3, $4, $5, 'draft', $6, $7, $8)
    RETURNING *
    `,
    [
      transferNumber,
      data.sourceWarehouseId,
      data.destinationWarehouseId,
      data.sourceLocationId || null,
      data.destinationLocationId || null,
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
      t.*,
      t.destination_warehouse_id AS dest_warehouse_id,
      sw.name AS source_warehouse_name,
      dw.name AS destination_warehouse_name,
      dw.name AS dest_warehouse_name,
      sl.name AS source_location_name,
      dl.name AS destination_location_name
    FROM transfers t
    LEFT JOIN warehouses sw ON sw.id = t.source_warehouse_id
    LEFT JOIN warehouses dw ON dw.id = t.destination_warehouse_id
    LEFT JOIN locations sl ON sl.id = t.source_location_id
    LEFT JOIN locations dl ON dl.id = t.destination_location_id
    WHERE t.id = $1
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
    conditions.push(`t.status = $${values.length}`);
  }

  if (filters.sourceWarehouseId) {
    values.push(filters.sourceWarehouseId);
    conditions.push(`t.source_warehouse_id = $${values.length}`);
  }

  if (filters.destinationWarehouseId) {
    values.push(filters.destinationWarehouseId);
    conditions.push(`t.destination_warehouse_id = $${values.length}`);
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
      t.*,
      t.destination_warehouse_id AS dest_warehouse_id,
      sw.name AS source_warehouse_name,
      dw.name AS destination_warehouse_name,
      dw.name AS dest_warehouse_name,
      sl.name AS source_location_name,
      dl.name AS destination_location_name
    FROM transfers t
    LEFT JOIN warehouses sw ON sw.id = t.source_warehouse_id
    LEFT JOIN warehouses dw ON dw.id = t.destination_warehouse_id
    LEFT JOIN locations sl ON sl.id = t.source_location_id
    LEFT JOIN locations dl ON dl.id = t.destination_location_id
    ${whereClause}
    ORDER BY t.created_at DESC
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
    INSERT INTO transfer_items (
      transfer_id,
      product_id,
      source_location_id,
      destination_location_id,
      quantity
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [
      data.transferId,
      data.productId,
      data.sourceLocationId,
      data.destinationLocationId,
      data.quantity,
    ],
  );

  return result.rows[0];
}

async function findItems(transferId, client = db) {
  const result = await client.query(
    `
    SELECT
      ti.*,
      p.name AS product_name,
      p.sku,
      p.uom_id,
      sl.name AS source_location_name,
      dl.name AS destination_location_name
    FROM transfer_items ti
    JOIN products p ON p.id = ti.product_id
    LEFT JOIN locations sl ON sl.id = ti.source_location_id
    LEFT JOIN locations dl ON dl.id = ti.destination_location_id
    WHERE ti.transfer_id = $1
    ORDER BY ti.created_at ASC
    `,
    [transferId],
  );

  return result.rows;
}

async function findItem(transferId, productId, client = db) {
  const result = await client.query(
    `
    SELECT *
    FROM transfer_items
    WHERE transfer_id = $1
      AND product_id = $2
    `,
    [transferId, productId],
  );

  return result.rows[0] || null;
}

async function lockTransfer(id, client) {
  const result = await client.query(
    `
    SELECT *
    FROM transfers
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
    UPDATE transfers
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
  createTransfer,
  findById,
  list,
  addItem,
  findItems,
  findItem,
  lockTransfer,
  updateStatus,
};
