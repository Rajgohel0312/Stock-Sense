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
| Create user
|--------------------------------------------------------------------------
*/

async function createUser(data) {
  const result = await db
    .insert("users")
    .values(data)
    .returning([
      "id",
      "role_id",
      "name",
      "email",
      "avatar_url",
      "is_active",
      "email_verified_at",
      "created_at",
    ])
    .execute();

  return result.rows[0];
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

module.exports = {
  findUserByEmail,
  findRoleByName,
  createUser,
  updateLastLogin,
  findUserById,
};
