const db = require("../../database");

async function findAll({
  search,
  active
} = {}) {
  let query = `
    SELECT
      id,
      name,
      description,
      is_active,
      created_at,
      updated_at
    FROM categories
    WHERE 1 = 1
  `;

  const params = [];

  if (search) {
    params.push(`%${search}%`);
    query += `
      AND (
        name ILIKE $${params.length}
        OR description ILIKE $${params.length}
      )
    `;
  }

  if (active !== undefined) {
    params.push(active);
    query += `
      AND is_active = $${params.length}
    `;
  }

  query += `
    ORDER BY name ASC
  `;

  const result = await db.raw(query, params);

  return result.rows;
}

async function findById(id) {
  const result = await db.raw(
    `
    SELECT
      id,
      name,
      description,
      is_active,
      created_at,
      updated_at
    FROM categories
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function findByName(name) {
  const result = await db.raw(
    `
    SELECT
      id,
      name,
      description,
      is_active,
      created_at,
      updated_at
    FROM categories
    WHERE LOWER(name) = LOWER($1)
    LIMIT 1
    `,
    [name]
  );

  return result.rows[0] || null;
}

async function create({
  name,
  description
}) {
  const result = await db.raw(
    `
    INSERT INTO categories (
      name,
      description
    )
    VALUES ($1, $2)
    RETURNING
      id,
      name,
      description,
      is_active,
      created_at,
      updated_at
    `,
    [
      name,
      description || null
    ]
  );

  return result.rows[0];
}

async function update(id, {
  name,
  description,
  isActive
}) {
  const result = await db.raw(
    `
    UPDATE categories
    SET
      name = COALESCE($1, name),
      description = COALESCE($2, description),
      is_active = COALESCE($3, is_active),
      updated_at = NOW()
    WHERE id = $4
    RETURNING
      id,
      name,
      description,
      is_active,
      created_at,
      updated_at
    `,
    [
      name ?? null,
      description ?? null,
      isActive ?? null,
      id
    ]
  );

  return result.rows[0] || null;
}

async function remove(id) {
  const result = await db.raw(
    `
    UPDATE categories
    SET
      is_active = FALSE,
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      name,
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
  findByName,
  create,
  update,
  remove
};