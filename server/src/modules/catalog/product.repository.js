const db = require("../../database");

async function findAll({
  search,
  categoryId,
  active
} = {}) {
  let query = `
    SELECT
      p.id,
      p.name,
      p.sku,
      p.description,
      p.is_active,

      p.category_id,
      c.name AS category_name,

      p.uom_id,
      u.name AS uom_name,
      u.code AS uom_code,

      p.created_at,
      p.updated_at

    FROM products p

    INNER JOIN categories c
      ON c.id = p.category_id

    INNER JOIN units_of_measure u
      ON u.id = p.uom_id

    WHERE 1 = 1
  `;

  const params = [];

  if (search) {
    params.push(`%${search}%`);

    query += `
      AND (
        p.name ILIKE $${params.length}
        OR p.sku ILIKE $${params.length}
      )
    `;
  }

  if (categoryId) {
    params.push(categoryId);

    query += `
      AND p.category_id = $${params.length}
    `;
  }

  if (active !== undefined) {
    params.push(active);

    query += `
      AND p.is_active = $${params.length}
    `;
  }

  query += `
    ORDER BY p.name ASC
  `;

  const result = await db.raw(
    query,
    params
  );

  return result.rows;
}

async function findById(id) {
  const result = await db.raw(
    `
    SELECT
      p.id,
      p.name,
      p.sku,
      p.description,
      p.is_active,

      p.category_id,
      c.name AS category_name,

      p.uom_id,
      u.name AS uom_name,
      u.code AS uom_code,

      p.created_at,
      p.updated_at

    FROM products p

    INNER JOIN categories c
      ON c.id = p.category_id

    INNER JOIN units_of_measure u
      ON u.id = p.uom_id

    WHERE p.id = $1

    LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function findBySku(sku) {
  const result = await db.raw(
    `
    SELECT
      id,
      name,
      sku,
      description,
      category_id,
      uom_id,
      is_active
    FROM products
    WHERE LOWER(sku) = LOWER($1)
    LIMIT 1
    `,
    [sku]
  );

  return result.rows[0] || null;
}

async function create({
  name,
  sku,
  description,
  categoryId,
  uomId
}) {
  const result = await db.raw(
    `
    INSERT INTO products (
      name,
      sku,
      description,
      category_id,
      uom_id
    )
    VALUES ($1, $2, $3, $4, $5)

    RETURNING
      id,
      name,
      sku,
      description,
      category_id,
      uom_id,
      is_active,
      created_at,
      updated_at
    `,
    [
      name,
      sku,
      description || null,
      categoryId,
      uomId
    ]
  );

  return result.rows[0];
}

async function update(id, {
  name,
  sku,
  description,
  categoryId,
  uomId,
  isActive
}) {
  const result = await db.raw(
    `
    UPDATE products
    SET
      name = COALESCE($1, name),
      sku = COALESCE($2, sku),
      description = COALESCE($3, description),
      category_id = COALESCE($4, category_id),
      uom_id = COALESCE($5, uom_id),
      is_active = COALESCE($6, is_active),
      updated_at = NOW()

    WHERE id = $7

    RETURNING
      id,
      name,
      sku,
      description,
      category_id,
      uom_id,
      is_active,
      created_at,
      updated_at
    `,
    [
      name ?? null,
      sku ?? null,
      description ?? null,
      categoryId ?? null,
      uomId ?? null,
      isActive ?? null,
      id
    ]
  );

  return result.rows[0] || null;
}

async function remove(id) {
  const result = await db.raw(
    `
    UPDATE products
    SET
      is_active = FALSE,
      updated_at = NOW()

    WHERE id = $1

    RETURNING
      id,
      name,
      sku,
      is_active,
      updated_at
    `,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = {
  findAll,
  findById,
  findBySku,
  create,
  update,
  remove
};