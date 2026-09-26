const db = require("../../database");

async function createReceipt(data) {
  const receiptNumber = data.receiptNumber || `REC-${Date.now()}`;

  const result = await db.raw(
    `
    INSERT INTO receipts (
      supplier_id,
      warehouse_id,
      status,
      receipt_number,
      scheduled_date,
      notes,
      created_by
    )
    VALUES ($1, $2, 'draft', $3, $4, $5, $6)
    RETURNING *
    `,
    [
      data.supplierId,
      data.warehouseId,
      receiptNumber,
      data.scheduledDate || null,
      data.notes || null,
      data.createdBy,
    ],
  );

  return result.rows[0];
}

async function findById(id) {
  const result = await db.raw(
    `
    SELECT
      r.*,
      s.name AS supplier_name,
      w.name AS warehouse_name
    FROM receipts r
    LEFT JOIN suppliers s
      ON s.id = r.supplier_id
    LEFT JOIN warehouses w
      ON w.id = r.warehouse_id
    WHERE r.id = $1
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
    conditions.push(`r.status = $${values.length}`);
  }

  if (filters.supplierId) {
    values.push(filters.supplierId);
    conditions.push(`r.supplier_id = $${values.length}`);
  }

  if (filters.warehouseId) {
    values.push(filters.warehouseId);
    conditions.push(`r.warehouse_id = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  values.push(Number(filters.limit) || 50);
  const limitIndex = values.length;

  values.push(Number(filters.offset) || 0);
  const offsetIndex = values.length;

  const result = await db.raw(
    `
  SELECT
    r.*,
    s.name AS supplier_name,
    w.name AS warehouse_name
  FROM receipts r
  LEFT JOIN suppliers s
    ON s.id = r.supplier_id
  LEFT JOIN warehouses w
    ON w.id = r.warehouse_id
  ${whereClause}
  ORDER BY r.created_at DESC
  LIMIT $${limitIndex}
  OFFSET $${offsetIndex}
  `,
    values,
  );

  return result.rows;
}

async function addItem(data, client = null) {
  const query = `
    INSERT INTO receipt_items (
      receipt_id,
      product_id,
      location_id,
      quantity
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  const params = [
    data.receiptId,
    data.productId,
    data.locationId,
    data.quantity,
  ];

  const result = client
    ? await client.query(query, params)
    : await db.raw(query, params);

  return result.rows[0];
}

async function findItems(receiptId, client = db) {
  const result =
    client === db
      ? await db.raw(
          `
          SELECT
            ri.*,
            p.name AS product_name,
            p.sku,
            p.uom_id
          FROM receipt_items ri
          JOIN products p ON p.id = ri.product_id
          WHERE ri.receipt_id = $1
          ORDER BY ri.created_at ASC
          `,
          [receiptId],
        )
      : await client.query(
          `
          SELECT
            ri.*,
            p.name AS product_name,
            p.sku,
            p.uom_id
          FROM receipt_items ri
          JOIN products p ON p.id = ri.product_id
          WHERE ri.receipt_id = $1
          ORDER BY ri.created_at ASC
          `,
          [receiptId],
        );

  return result.rows;
}

async function findItem(receiptId, productId, client = db) {
  const result =
    client === db
      ? await db.raw(
          `
          SELECT *
          FROM receipt_items
          WHERE receipt_id = $1
            AND product_id = $2
          `,
          [receiptId, productId],
        )
      : await client.query(
          `
          SELECT *
          FROM receipt_items
          WHERE receipt_id = $1
            AND product_id = $2
          `,
          [receiptId, productId],
        );

  return result.rows[0] || null;
}

async function updateStatus(id, status, userId, client = db) {
  const result = await client.query(
    `
    UPDATE receipts
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

  return result.rows[0] || null;
}

async function lockReceipt(id, client) {
  const result = await client.query(
    `
    SELECT *
    FROM receipts
    WHERE id = $1
    FOR UPDATE
    `,
    [id],
  );

  return result.rows[0] || null;
}

async function lockProduct(productId, client) {
  const result = await client.query(
    `
    SELECT *
    FROM products
    WHERE id = $1
      AND is_active = TRUE
    FOR UPDATE
    `,
    [productId],
  );

  return result.rows[0] || null;
}

module.exports = {
  createReceipt,
  findById,
  list,
  addItem,
  findItems,
  findItem,
  updateStatus,
  lockReceipt,
  lockProduct,
};
