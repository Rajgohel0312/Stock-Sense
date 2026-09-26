const db = require("../../database");

async function findAll({
  search,
  active
} = {}) {
  let query = `
    SELECT
      id,
      name,
      email,
      phone,
      address,
      is_active,
      created_at,
      updated_at
    FROM suppliers
    WHERE 1 = 1
  `;

  const params = [];

  if (search) {
    params.push(`%${search}%`);

    query += `
      AND (
        name ILIKE $${params.length}
        OR email ILIKE $${params.length}
        OR phone ILIKE $${params.length}
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

  const result =
    await db.raw(query, params);

  return result.rows;
}

async function findById(id) {
  const result = await db.raw(
    `
    SELECT
      id,
      name,
      email,
      phone,
      address,
      is_active,
      created_at,
      updated_at
    FROM suppliers
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function create({
  name,
  email,
  phone,
  address
}) {
  const result = await db.raw(
    `
    INSERT INTO suppliers (
      name,
      email,
      phone,
      address
    )
    VALUES ($1, $2, $3, $4)
    RETURNING
      id,
      name,
      email,
      phone,
      address,
      is_active,
      created_at,
      updated_at
    `,
    [
      name,
      email || null,
      phone || null,
      address || null
    ]
  );

  return result.rows[0];
}

async function update(id, {
  name,
  email,
  phone,
  address,
  isActive
}) {
  const result = await db.raw(
    `
    UPDATE suppliers
    SET
      name = COALESCE($1, name),
      email = COALESCE($2, email),
      phone = COALESCE($3, phone),
      address = COALESCE($4, address),
      is_active = COALESCE($5, is_active),
      updated_at = NOW()
    WHERE id = $6
    RETURNING
      id,
      name,
      email,
      phone,
      address,
      is_active,
      created_at,
      updated_at
    `,
    [
      name ?? null,
      email ?? null,
      phone ?? null,
      address ?? null,
      isActive ?? null,
      id
    ]
  );

  return result.rows[0] || null;
}

module.exports = {
  findAll,
  findById,
  create,
  update
};