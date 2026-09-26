const bcrypt = require("bcryptjs");
const repository = require("./profile.repository");

async function getProfile(userId) {
  const profile = await repository.findById(userId);
  if (!profile) {
    const error = new Error("User profile not found");
    error.statusCode = 404;
    throw error;
  }
  return profile;
}

async function updateProfile(userId, data) {
  const user = await repository.findById(userId);
  if (!user) {
    const error = new Error("User profile not found");
    error.statusCode = 404;
    throw error;
  }

  return repository.updateProfile(userId, data);
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await repository.findUserWithPassword(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (!user.password_hash) {
    const error = new Error(
      "Account was created via OAuth. Password cannot be changed this way.",
    );
    error.statusCode = 400;
    throw error;
  }

  const matches = await bcrypt.compare(currentPassword, user.password_hash);
  if (!matches) {
    const error = new Error("Current password is incorrect");
    error.statusCode = 400;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const newHash = await bcrypt.hash(newPassword, salt);

  await repository.updatePassword(userId, newHash);
  return { message: "Password updated successfully. All other sessions have been invalidated." };
}

async function logoutAll(userId) {
  const result = await repository.incrementTokenVersion(userId);
  if (!result) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return { message: "All sessions have been invalidated." };
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  logoutAll,
};
