const {
  findUserByEmail,
  findRoleByName,
  createUser,
  updateLastLogin,
} = require("./auth.repository");

const {
  hashPassword,
  comparePassword,
  generateAccessToken,
} = require("./auth.utils");

async function signup({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  /*
    |--------------------------------------------------------------------------
    | Check existing user
    |--------------------------------------------------------------------------
    */

  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser) {
    const error = new Error("An account with this email already exists.");

    error.statusCode = 409;

    throw error;
  }

  /*
    |--------------------------------------------------------------------------
    | Find default role
    |--------------------------------------------------------------------------
    */

  const role = await findRoleByName("warehouse_staff");

  if (!role) {
    const error = new Error("Default user role is not configured.");

    error.statusCode = 500;

    throw error;
  }

  /*
    |--------------------------------------------------------------------------
    | Hash password
    |--------------------------------------------------------------------------
    */

  const passwordHash = await hashPassword(password);

  /*
    |--------------------------------------------------------------------------
    | Create user
    |--------------------------------------------------------------------------
    */

  const user = await createUser({
    role_id: role.id,
    name: name.trim(),
    email: normalizedEmail,
    password_hash: passwordHash,
  });

  return user;
}
async function login({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await findUserByEmail(normalizedEmail);

  /*
    |--------------------------------------------------------------------------
    | Don't reveal whether email exists
    |--------------------------------------------------------------------------
    */

  if (!user) {
    const error = new Error("Invalid email or password.");

    error.statusCode = 401;

    throw error;
  }

  /*
    |--------------------------------------------------------------------------
    | Account status
    |--------------------------------------------------------------------------
    */

  if (!user.is_active) {
    const error = new Error("This account is inactive.");

    error.statusCode = 403;

    throw error;
  }

  /*
    |--------------------------------------------------------------------------
    | Google-only users don't have password
    |--------------------------------------------------------------------------
    */

  if (!user.password_hash) {
    const error = new Error("This account uses Google sign-in.");

    error.statusCode = 400;

    throw error;
  }

  /*
    |--------------------------------------------------------------------------
    | Password verification
    |--------------------------------------------------------------------------
    */

  const passwordMatches = await comparePassword(password, user.password_hash);

  if (!passwordMatches) {
    const error = new Error("Invalid email or password.");

    error.statusCode = 401;

    throw error;
  }
  await updateLastLogin(user.id);
  /*
    |--------------------------------------------------------------------------
    | Generate JWT
    |--------------------------------------------------------------------------
    */

  const token = generateAccessToken(user);

  return {
    token,

    user: {
      id: user.id,
      roleId: user.role_id,
      role: user.role_name,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatar_url,
      isActive: user.is_active,
    },
  };
}

module.exports = {
  signup,
  login,
};
