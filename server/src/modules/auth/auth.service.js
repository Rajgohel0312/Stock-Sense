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
  generateOtp,
  hashOtp,
  generateResetToken,
  hashResetToken,
} = require("./auth.utils");
const { sendPasswordResetOtp } = require("../../services/email.service");
const authRedis = require("./auth.redis");
const authRepository = require("./auth.repository");

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
async function forgotPassword(email) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await authRepository.findUserByEmail(normalizedEmail);

  // Never reveal whether the email exists.
  if (!user) {
    return {
      message: "If an account exists for this email, an OTP has been sent.",
    };
  }

  if (!user.is_active) {
    return {
      message: "If an account exists for this email, an OTP has been sent.",
    };
  }

  const cooldown = await authRedis.hasOtpCooldown(normalizedEmail);

  if (cooldown) {
    const error = new Error("Please wait before requesting another OTP.");

    error.statusCode = 429;

    throw error;
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp);

  await authRedis.saveOtp(user.id, otpHash);

  await authRedis.setOtpCooldown(normalizedEmail);

  
  await sendPasswordResetOtp(normalizedEmail, otp);

  return {
    message: "If an account exists for this email, an OTP has been sent.",
  };
}
async function verifyResetOtp(email, otp) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await authRepository.findUserByEmail(normalizedEmail);

  if (!user) {
    throw new Error("Invalid OTP.");
  }

  const attempts = await authRedis.incrementOtpAttempts(user.id);

  if (attempts > 5) {
    await authRedis.deleteOtp(user.id);

    const error = new Error("Too many invalid OTP attempts.");

    error.statusCode = 429;

    throw error;
  }

  const storedOtpHash = await authRedis.getOtp(user.id);

  if (!storedOtpHash) {
    throw new Error("OTP expired or not found.");
  }

  const submittedOtpHash = hashOtp(otp);

  if (submittedOtpHash !== storedOtpHash) {
    throw new Error("Invalid OTP.");
  }

  const resetToken = generateResetToken();

  const resetTokenHash = hashResetToken(resetToken);

  await authRedis.saveResetToken(resetTokenHash, user.id);

  await authRedis.deleteOtp(user.id);
  await authRedis.deleteOtpAttempts(user.id);

  return {
    resetToken,
  };
}
async function resetPassword(resetToken, newPassword) {
  const tokenHash = hashResetToken(resetToken);

  const userId = await authRedis.getResetTokenUser(tokenHash);

  if (!userId) {
    const error = new Error("Invalid or expired reset token.");

    error.statusCode = 401;

    throw error;
  }

  const passwordHash = await hashPassword(newPassword);

  const user = await authRepository.updatePassword(userId, passwordHash);

  if (!user) {
    const error = new Error("Unable to reset password.");

    error.statusCode = 400;

    throw error;
  }

  await authRedis.deleteResetToken(tokenHash);

  return {
    message: "Password reset successfully. Please login again.",
  };
}

module.exports = {
  signup,
  login,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
};
