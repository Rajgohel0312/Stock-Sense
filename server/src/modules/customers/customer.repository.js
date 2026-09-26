const db = require("../../database");

async function createCustomer(data) {
  const result = await db.raw(
    `
    INSERT INTO customers (
      name,
      email,
      phone,
      address,
      customer_tier,
      currency,
      is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [
      data.name.trim(),
      data.email || null,
      data.phone || null,
      data.address || null,
      data.customer_tier ? data.customer_tier.toLowerCase() : "standard",
      data.currency ? data.currency.toUpperCase() : "USD",
      data.is_active !== undefined ? data.is_active : true,
    ],
  );

  return result.rows[0];
}

async function findById(id) {
  const result = await db.raw(
    `
    SELECT *
    FROM customers
    WHERE id = $1
    `,
    [id],
  );

  return result.rows[0] || null;
}

async function list(filters = {}) {
  const values = [];
  const conditions = [];

  if (filters.search) {
    values.push(`%${filters.search}%`);
    conditions.push(
      `(name ILIKE $${values.length} OR email ILIKE $${values.length} OR phone ILIKE $${values.length})`
    );
  }

  if (filters.active !== undefined && filters.active !== "") {
    const isActive = filters.active === "true" || filters.active === true;
    values.push(isActive);
    conditions.push(`is_active = $${values.length}`);
  }

  if (filters.tier) {
    values.push(filters.tier.toLowerCase());
    conditions.push(`customer_tier = $${values.length}`);
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

  const result = await db.raw(
    `
    SELECT *
    FROM customers
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${limitIndex}
    OFFSET $${offsetIndex}
    `,
    values,
  );

  return result.rows;
}

async function updateCustomer(id, data) {
  const allowedFields = [
    "name",
    "email",
    "phone",
    "address",
    "customer_tier",
    "currency",
    "is_active",
  ];

  const updates = [];
  const values = [];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      let val = data[field];
      if (field === "name" && typeof val === "string") val = val.trim();
      if (field === "customer_tier" && typeof val === "string") val = val.toLowerCase();
      if (field === "currency" && typeof val === "string") val = val.toUpperCase();

      values.push(val);
      updates.push(`${field} = $${values.length}`);
    }
  }

  if (!updates.length) {
    return findById(id);
  }

  updates.push("updated_at = NOW()");
  values.push(id);
  const idIndex = values.length;

  const result = await db.raw(
    `
    UPDATE customers
    SET ${updates.join(", ")}
    WHERE id = $${idIndex}
    RETURNING *
    `,
    values,
  );

  return result.rows[0] || null;
}

async function deactivateCustomer(id) {
  const result = await db.raw(
    `
    UPDATE customers
    SET
      is_active = FALSE,
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [id],
  );

  return result.rows[0] || null;
}

module.exports = {
  createCustomer,
  findById,
  list,
  updateCustomer,
  deactivateCustomer,
};
