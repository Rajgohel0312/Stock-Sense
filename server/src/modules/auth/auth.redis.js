const { redisClient } = require("../../redis/client");

const OTP_TTL = 5 * 60;
const RESET_TOKEN_TTL = 10 * 60;

function otpKey(userId) {
  return `otp:password-reset:${userId}`;
}

function otpCooldownKey(email) {
  return `otp:password-reset:cooldown:${email}`;
}

function otpAttemptsKey(userId) {
  return `otp:password-reset:attempts:${userId}`;
}

function resetTokenKey(tokenHash) {
  return `password-reset:token:${tokenHash}`;
}

function emailVerifyOtpKey(userId) {
  return `otp:email-verify:${userId}`;
}

function emailVerifyAttemptsKey(userId) {
  return `otp:email-verify:attempts:${userId}`;
}

async function saveOtp(userId, otpHash) {
  await redisClient.set(otpKey(userId), otpHash, {
    EX: OTP_TTL,
  });
}

async function getOtp(userId) {
  return redisClient.get(otpKey(userId));
}

async function deleteOtp(userId) {
  await redisClient.del(otpKey(userId));
}

async function setOtpCooldown(email) {
  await redisClient.set(otpCooldownKey(email), "1", {
    EX: 60,
  });
}

async function hasOtpCooldown(email) {
  return Boolean(await redisClient.exists(otpCooldownKey(email)));
}

async function incrementOtpAttempts(userId) {
  const key = otpAttemptsKey(userId);
  const attempts = await redisClient.incr(key);
  if (attempts === 1) {
    await redisClient.expire(key, OTP_TTL);
  }
  return attempts;
}

async function deleteOtpAttempts(userId) {
  await redisClient.del(otpAttemptsKey(userId));
}

async function saveResetToken(tokenHash, userId) {
  await redisClient.set(resetTokenKey(tokenHash), userId, {
    EX: RESET_TOKEN_TTL,
  });
}

async function getResetTokenUser(tokenHash) {
  return redisClient.get(resetTokenKey(tokenHash));
}

async function deleteResetToken(tokenHash) {
  await redisClient.del(resetTokenKey(tokenHash));
}

// Email Verification Redis helpers
async function saveEmailVerificationOtp(userId, otpHash) {
  await redisClient.set(emailVerifyOtpKey(userId), otpHash, {
    EX: OTP_TTL,
  });
}

async function getEmailVerificationOtp(userId) {
  return redisClient.get(emailVerifyOtpKey(userId));
}

async function deleteEmailVerificationOtp(userId) {
  await redisClient.del(emailVerifyOtpKey(userId));
  await redisClient.del(emailVerifyAttemptsKey(userId));
}

async function incrementEmailVerificationAttempts(userId) {
  const key = emailVerifyAttemptsKey(userId);
  const attempts = await redisClient.incr(key);
  if (attempts === 1) {
    await redisClient.expire(key, OTP_TTL);
  }
  return attempts;
}

module.exports = {
  saveOtp,
  getOtp,
  deleteOtp,
  setOtpCooldown,
  hasOtpCooldown,
  incrementOtpAttempts,
  deleteOtpAttempts,
  saveResetToken,
  getResetTokenUser,
  deleteResetToken,
  saveEmailVerificationOtp,
  getEmailVerificationOtp,
  deleteEmailVerificationOtp,
  incrementEmailVerificationAttempts,
};