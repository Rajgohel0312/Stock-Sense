const db = require("../../database");

/*
|--------------------------------------------------------------------------
| Find user by email
|--------------------------------------------------------------------------
*/

async function findUserByEmail(email) {
  const result = await db
    .select([
      "u.id",
      "u.role_id",
      "u.name",
      "u.email",
      "u.password_hash",
      "u.avatar_url",
      "u.is_active",
      "u.email_verified_at",
      "u.last_login_at",
      "u.created_at",
      "u.auth_token_version",
      "u.updated_at",
      {
        column: "r.name",
        alias: "role_name",
      },
    ])
    .from("users", "u")
    .join("roles", "r.id", "=", "u.role_id", "INNER", "r")
    .whereFunction("LOWER", "u.email", "=", email)
    .limit(1)
    .execute();

  return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Find role
|--------------------------------------------------------------------------
*/

async function findRoleByName(roleName) {
  const result = await db
    .select(["id", "name"])
    .from("roles")
    .where("name", "=", roleName)
    .limit(1)
    .execute();

  return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Update Last Login
|--------------------------------------------------------------------------
*/

async function updateLastLogin(userId) {
  await db
    .update("users")
    .set({
      last_login_at: new Date(),
    })
    .where("id", "=", userId)
    .execute();
}

/*
|--------------------------------------------------------------------------
| Find User By Id
|--------------------------------------------------------------------------
*/

async function findUserById(userId) {
  const result = await db.raw(
    `
        SELECT
            u.id,
            u.role_id,
            u.name,
            u.email,
            u.avatar_url,
            u.is_active,
            u.email_verified_at,
            u.created_at,
            u.last_login_at,
            u.auth_token_version,
            r.name AS role_name

        FROM users u

        INNER JOIN roles r
            ON r.id = u.role_id

        WHERE u.id = $1

        LIMIT 1
        `,
    [userId],
  );

  return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Update Password
|--------------------------------------------------------------------------
*/

async function updatePassword(userId, passwordHash) {
  const result = await db.raw(
    `
    UPDATE users
    SET
      password_hash = $1,
      auth_token_version = auth_token_version + 1,
      updated_at = NOW()
    WHERE id = $2
    RETURNING
      id,
      auth_token_version
    `,
    [passwordHash, userId],
  );

  return result.rows[0] || null;
}
async function findUserByOAuth(provider, providerId) {
  const result = await db.raw(
    `
    SELECT
      u.id,
      u.role_id,
      u.name,
      u.email,
      u.password_hash,
      u.avatar_url,
      u.is_active,
      u.email_verified_at,
      u.last_login_at,
      u.created_at,
      u.updated_at,
      r.name AS role_name

    FROM oauth_accounts oa

    INNER JOIN users u
      ON u.id = oa.user_id

    INNER JOIN roles r
      ON r.id = u.role_id

    WHERE oa.provider = $1
      AND oa.provider_account_id = $2

    LIMIT 1
    `,
    [provider, providerId],
  );

  return result.rows[0] || null;
}
async function createOAuthAccount({ userId, provider, providerAccountId }) {
  const result = await db.raw(
    `
    INSERT INTO oauth_accounts (
      user_id,
      provider,
      provider_account_id
    )
    VALUES ($1, $2, $3)
    ON CONFLICT (provider, provider_account_id)
    DO NOTHING
    RETURNING *
    `,
    [userId, provider, providerAccountId],
  );

  return result.rows[0];
}
async function createUser({
  name,
  email,
  passwordHash,
  roleId,
  avatarUrl = null,
  emailVerifiedAt = null,
}) {
  console.log("REPOSITORY createUser INPUT:", {
    name,
    email,
    roleId,
    passwordHash: passwordHash ? "[HASHED]" : null,
    avatarUrl,
    emailVerifiedAt,
  });
  const params = [
    name,
    email,
    passwordHash,
    roleId,
    (avatarUrl = null),
    (emailVerifiedAt = null),
  ];

  console.log("SQL PARAMS:", [
    params[0],
    params[1],
    "[HASHED]",
    params[3],
    params[4],
    params[5],
  ]);
  const result = await db.raw(
    `
    INSERT INTO users (
      name,
      email,
      password_hash,
      role_id,
      avatar_url,
      email_verified_at
    )
    VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
      id,
      role_id,
      name,
      email,
      avatar_url,
      is_active,
      email_verified_at,
      created_at

    `,
    [name, email, passwordHash, roleId, avatarUrl, emailVerifiedAt],
  );

  return result.rows[0];
}
async function updateGoogleProfile(userId, avatarUrl) {
  const result = await db.raw(
    `
    UPDATE users
    SET
      avatar_url = $1,
      email_verified_at = COALESCE(email_verified_at, NOW()),
      updated_at = NOW()
    WHERE id = $2
    RETURNING
      id,
      role_id,
      name,
      email,
      avatar_url,
      is_active,
      email_verified_at,
      created_at,
      last_login_at,
      updated_at
    `,
    [avatarUrl, userId],
  );

  return result.rows[0] || null;
}
module.exports = {
  findUserByEmail,
  findRoleByName,
  createUser,
  updateLastLogin,
  findUserById,
  findUserByOAuth,
  createOAuthAccount,
  updatePassword,
  updateGoogleProfile,
};
