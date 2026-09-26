const db = require("../../database");

async function findAll({ productId, locationId, active } = {}) {
  let query = `
    SELECT
      rr.id,

      rr.product_id,
      p.name AS product_name,
      p.sku,

      rr.location_id,
      l.name AS location_name,
      l.code AS location_code,

      rr.minimum_quantity,
      rr.maximum_quantity,
      rr.reorder_quantity,

      rr.is_active,
      rr.created_at,
      rr.updated_at

    FROM reorder_rules rr

    INNER JOIN products p
      ON p.id = rr.product_id

    LEFT JOIN locations l
      ON l.id = rr.location_id

    WHERE 1 = 1
  `;

  const params = [];

  if (productId) {
    params.push(productId);

    query += `
      AND rr.product_id = $${params.length}
    `;
  }

  if (locationId) {
    params.push(locationId);

    query += `
      AND rr.location_id = $${params.length}
    `;
  }

  if (active !== undefined) {
    params.push(active);

    query += `
      AND rr.is_active = $${params.length}
    `;
  }

  query += `
    ORDER BY p.name ASC
  `;

  const result = await db.raw(query, params);

  return result.rows;
}

async function findById(id) {
  const result = await db.raw(
    `
    SELECT
      id,
      product_id,
      location_id,
      minimum_quantity,
      maximum_quantity,
      reorder_quantity,
      is_active,
      created_at,
      updated_at
    FROM reorder_rules
    WHERE id = $1
    LIMIT 1
    `,
    [id],
  );

  return result.rows[0] || null;
}

async function findExisting(productId, locationId) {
  const result = await db.raw(
    `
    SELECT
      id,
      product_id,
      location_id,
      minimum_quantity,
      maximum_quantity,
      reorder_quantity,
      is_active
    FROM reorder_rules
    WHERE product_id = $1
      AND (
        location_id = $2
        OR (
          location_id IS NULL
          AND $2 IS NULL
        )
      )
    LIMIT 1
    `,
    [productId, locationId],
  );

  return result.rows[0] || null;
}

async function create({
  productId,
  locationId,
  minQuantity,
  maxQuantity,
  reorderQuantity,
}) {
  const result = await db.raw(
    `
    INSERT INTO reorder_rules (
      product_id,
      location_id,
      minimum_quantity,
      maximum_quantity,
      reorder_quantity
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING
      id,
      product_id,
      location_id,
      minimum_quantity,
      maximum_quantity,
      reorder_quantity,
      is_active,
      created_at,
      updated_at
    `,
    [
      productId,
      locationId || null,
      minQuantity,
      maxQuantity,
      reorderQuantity,
    ],
  );

  return result.rows[0];
}

async function update(
  id,
  { minQuantity, maxQuantity, reorderQuantity, isActive },
) {
  const result = await db.raw(
    `
    UPDATE reorder_rules
    SET
      minimum_quantity =
        COALESCE($1, minimum_quantity),

      maximum_quantity =
        COALESCE($2, maximum_quantity),

      reorder_quantity =
        COALESCE($3, reorder_quantity),

      is_active =
        COALESCE($4, is_active),

      updated_at = NOW()

    WHERE id = $5

    RETURNING
      id,
      product_id,
      location_id,
      minimum_quantity,
      maximum_quantity,
      reorder_quantity,
      is_active,
      created_at,
      updated_at
    `,
    [
      minQuantity ?? null,
      maxQuantity ?? null,
      reorderQuantity ?? null,
      isActive ?? null,
      id,
    ],
  );

  return result.rows[0] || null;
}

module.exports = {
  findAll,
  findById,
  findExisting,
  create,
  update,
};