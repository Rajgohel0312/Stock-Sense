const db = require("../../database");

async function findAll() {
  const result = await db.raw(
    `
    SELECT
      id,
      name,
      code,
      created_at
    FROM units_of_measure
    ORDER BY name ASC
    `
  );

  return result.rows;
}

async function findById(id) {
  const result = await db.raw(
    `
    SELECT
      id,
      name,
      code
    FROM units_of_measure
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = {
  findAll,
  findById
};