const db = require("../../database");

async function findById(userId) {
  const result = await db.raw(
    `
    SELECT
      u.id,
      u.role_id,
      r.name AS role,
      u.name,
      u.email,
      u.avatar_url,
      u.is_active,
      u.auth_token_version,
      u.email_verified_at,
      u.created_at,
      u.updated_at
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.id = $1
    `,
    [userId],
  );

  return result.rows[0] || null;
}

async function findUserWithPassword(userId) {
  const result = await db.raw(
    `
    SELECT id, password_hash
    FROM users
    WHERE id = $1
    `,
    [userId],
  );

  return result.rows[0] || null;
}

async function updateProfile(userId, data) {
  const updates = [];
  const values = [];

  if (data.name !== undefined) {
    values.push(data.name.trim());
    updates.push(`name = $${values.length}`);
  }

  const avatar = data.avatar_url !== undefined ? data.avatar_url : data.avatarUrl;
  if (avatar !== undefined) {
    values.push(avatar);
    updates.push(`avatar_url = $${values.length}`);
  }

  if (!updates.length) {
    return findById(userId);
  }

  updates.push("updated_at = NOW()");
  values.push(userId);
  const idIndex = values.length;

  const result = await db.raw(
    `
    UPDATE users
    SET ${updates.join(", ")}
    WHERE id = $${idIndex}
    RETURNING
      id,
      role_id,
      name,
      email,
      avatar_url,
      is_active,
      auth_token_version,
      email_verified_at,
      created_at,
      updated_at
    `,
    values,
  );

  return result.rows[0] || null;
}

async function updatePassword(userId, passwordHash) {
  const result = await db.raw(
    `
    UPDATE users
    SET
      password_hash = $1,
      updated_at = NOW()
    WHERE id = $2
    RETURNING id
    `,
    [passwordHash, userId],
  );

  return result.rows[0] || null;
}

async function incrementTokenVersion(userId) {
  const result = await db.raw(
    `
    UPDATE users
    SET
      auth_token_version = auth_token_version + 1,
      updated_at = NOW()
    WHERE id = $1
    RETURNING id, auth_token_version
    `,
    [userId],
  );

  return result.rows[0] || null;
}

module.exports = {
  findById,
  findUserWithPassword,
  updateProfile,
  updatePassword,
  incrementTokenVersion,
};
