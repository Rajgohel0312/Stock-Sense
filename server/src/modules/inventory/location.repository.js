const db = require("../../database");

async function findAll({
  warehouseId,
  search,
  active
} = {}) {
  let query = `
    SELECT
      l.id,
      l.warehouse_id,
      w.name AS warehouse_name,
      w.code AS warehouse_code,

      l.parent_location_id,
      parent.name AS parent_location_name,

      l.name,
      l.code,
      l.location_type,
      l.is_active,

      l.created_at,
      l.updated_at

    FROM locations l

    INNER JOIN warehouses w
      ON w.id = l.warehouse_id

    LEFT JOIN locations parent
      ON parent.id = l.parent_location_id

    WHERE 1 = 1
  `;

  const params = [];

  if (warehouseId) {
    params.push(warehouseId);

    query += `
      AND l.warehouse_id = $${params.length}
    `;
  }

  if (search) {
    params.push(`%${search}%`);

    query += `
      AND (
        l.name ILIKE $${params.length}
        OR l.code ILIKE $${params.length}
      )
    `;
  }

  if (active !== undefined) {
    params.push(active);

    query += `
      AND l.is_active = $${params.length}
    `;
  }

  query += `
    ORDER BY l.name ASC
  `;

  const result =
    await db.raw(query, params);

  return result.rows;
}

async function findById(id) {
  const result = await db.raw(
    `
    SELECT
      l.id,
      l.warehouse_id,
      l.parent_location_id,
      l.name,
      l.code,
      l.location_type,
      l.is_active
    FROM locations l
    WHERE l.id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function findByCode(
  warehouseId,
  code
) {
  const result = await db.raw(
    `
    SELECT
      id,
      warehouse_id,
      parent_location_id,
      name,
      code,
      location_type,
      is_active
    FROM locations
    WHERE warehouse_id = $1
      AND LOWER(code) = LOWER($2)
    LIMIT 1
    `,
    [
      warehouseId,
      code
    ]
  );

  return result.rows[0] || null;
}

async function create({
  warehouseId,
  parentLocationId,
  name,
  code,
  locationType
}) {
  const result = await db.raw(
    `
    INSERT INTO locations (
      warehouse_id,
      parent_location_id,
      name,
      code,
      location_type
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING
      id,
      warehouse_id,
      parent_location_id,
      name,
      code,
      location_type,
      is_active,
      created_at,
      updated_at
    `,
    [
      warehouseId,
      parentLocationId || null,
      name,
      code,
      locationType
    ]
  );

  return result.rows[0];
}

async function update(id, {
  parentLocationId,
  name,
  code,
  locationType,
  isActive
}) {
  const result = await db.raw(
    `
    UPDATE locations
    SET
      parent_location_id =
        COALESCE($1, parent_location_id),

      name =
        COALESCE($2, name),

      code =
        COALESCE($3, code),

      location_type =
        COALESCE($4, location_type),

      is_active =
        COALESCE($5, is_active),

      updated_at = NOW()

    WHERE id = $6

    RETURNING
      id,
      warehouse_id,
      parent_location_id,
      name,
      code,
      location_type,
      is_active,
      created_at,
      updated_at
    `,
    [
      parentLocationId ?? null,
      name ?? null,
      code ?? null,
      locationType ?? null,
      isActive ?? null,
      id
    ]
  );

  return result.rows[0] || null;
}

async function deactivate(id) {
  const result = await db.raw(
    `
    UPDATE locations
    SET
      is_active = FALSE,
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      warehouse_id,
      parent_location_id,
      name,
      code,
      location_type,
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