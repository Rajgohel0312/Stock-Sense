const db = require("../../database");

async function findAll({
  search,
  active
} = {}) {
  let query = `
    SELECT
      id,
      name,
      code,
      address,
      is_active,
      created_at,
      updated_at
    FROM warehouses
    WHERE 1 = 1
  `;

  const params = [];

  if (search) {
    params.push(`%${search}%`);

    query += `
      AND (
        name ILIKE $${params.length}
        OR code ILIKE $${params.length}
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
      id,
      name,
      code,
      address,
      is_active,
      created_at,
      updated_at
    FROM warehouses
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function findByCode(code) {
  const result = await db.raw(
    `
    SELECT
      id,
      name,
      code,
      address,
      is_active
    FROM warehouses
    WHERE LOWER(code) = LOWER($1)
    LIMIT 1
    `,
    [code]
  );

  return result.rows[0] || null;
}

async function create({
  name,
  code,
  address
}) {
  const result = await db.raw(
    `
    INSERT INTO warehouses (
      name,
      code,
      address
    )
    VALUES ($1, $2, $3)
    RETURNING
      id,
      name,
      code,
      address,
      is_active,
      created_at,
      updated_at
    `,
    [
      name,
      code,
      address || null
    ]
  );

  return result.rows[0];
}

async function update(id, {
  name,
  code,
  address,
  isActive
}) {
  const result = await db.raw(
    `
    UPDATE warehouses
    SET
      name = COALESCE($1, name),
      code = COALESCE($2, code),
      address = COALESCE($3, address),
      is_active = COALESCE($4, is_active),
      updated_at = NOW()
    WHERE id = $5
    RETURNING
      id,
      name,
      code,
      address,
      is_active,
      created_at,
      updated_at
    `,
    [
      name ?? null,
      code ?? null,
      address ?? null,
      isActive ?? null,
      id
    ]
  );

  return result.rows[0] || null;
}

async function deactivate(id) {
  const result = await db.raw(
    `
    UPDATE warehouses
    SET
      is_active = FALSE,
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      name,
      code,
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
  findByCode,
  create,
  update,
  deactivate
};