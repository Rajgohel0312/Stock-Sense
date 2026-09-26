const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const env = require("../../config/env");

const SALT_ROUNDS = 12;
const crypto = require("crypto");

/*
|--------------------------------------------------------------------------
| Hash password
|--------------------------------------------------------------------------
*/

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/*
|--------------------------------------------------------------------------
| Compare password
|--------------------------------------------------------------------------
*/

async function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

/*
|--------------------------------------------------------------------------
| JWT
|--------------------------------------------------------------------------
*/

function generateAccessToken(user) {
  if (!user?.id) {
    throw new Error("User ID is required to generate token.");
  }

  return jwt.sign(
    {
      sub: user.id,
      roleId: user.role_id,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
    },
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = {
  hashPassword,
  comparePassword,
  generateAccessToken,
  verifyAccessToken,
  generateOtp,
  hashOtp,
  generateResetToken,
  hashResetToken,
};
