const db = require("../../database");

async function createReservation(data, client = db) {
  const result = await client.query(
    `
    INSERT INTO stock_reservations (
      product_id,
      location_id,
      quantity,
      reference_type,
      reference_id,
      status,
      created_by
    )
    VALUES ($1, $2, $3, $4, $5, 'active', $6)
    RETURNING *
    `,
    [
      data.productId,
      data.locationId,
      data.quantity,
      data.referenceType || null,
      data.referenceId || null,
      data.createdBy,
    ],
  );

  return result.rows[0];
}

async function findById(id) {
  const result = await db.query(
    `
    SELECT
      r.*,
      p.name AS product_name,
      p.sku,
      l.name AS location_name,
      u.name AS created_by_name
    FROM stock_reservations r
    JOIN products p ON p.id = r.product_id
    JOIN locations l ON l.id = r.location_id
    LEFT JOIN users u ON u.id = r.created_by
    WHERE r.id = $1
    `,
    [id],
  );

  return result.rows[0] || null;
}

async function list(filters = {}) {
  const values = [];
  const conditions = [];

  if (filters.productId) {
    values.push(filters.productId);
    conditions.push(`r.product_id = $${values.length}`);
  }

  if (filters.locationId) {
    values.push(filters.locationId);
    conditions.push(`r.location_id = $${values.length}`);
  }

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`r.status = $${values.length}`);
  }

  if (filters.referenceType) {
    values.push(filters.referenceType);
    conditions.push(`r.reference_type = $${values.length}`);
  }

  if (filters.referenceId) {
    values.push(filters.referenceId);
    conditions.push(`r.reference_id = $${values.length}`);
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
      r.*,
      p.name AS product_name,
      p.sku,
      l.name AS location_name,
      u.name AS created_by_name
    FROM stock_reservations r
    JOIN products p ON p.id = r.product_id
    JOIN locations l ON l.id = r.location_id
    LEFT JOIN users u ON u.id = r.created_by
    ${whereClause}
    ORDER BY r.created_at DESC
    LIMIT $${limitIndex}
    OFFSET $${offsetIndex}
    `,
    values,
  );

  return result.rows;
}

async function lockReservation(id, client) {
  const result = await client.query(
    `
    SELECT *
    FROM stock_reservations
    WHERE id = $1
    FOR UPDATE
    `,
    [id],
  );

  return result.rows[0] || null;
}

async function updateStatus(id, status, client = db) {
  const result = await client.query(
    `
    UPDATE stock_reservations
    SET
      status = $1,
      updated_at = NOW()
    WHERE id = $2
    RETURNING *
    `,
    [status, id],
  );

  return result.rows[0];
}

module.exports = {
  createReservation,
  findById,
  list,
  lockReservation,
  updateStatus,
};
