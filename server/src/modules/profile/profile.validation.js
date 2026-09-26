function validateUpdateProfile(body) {
  const errors = [];
  const name = body.name;

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      errors.push("Name cannot be empty");
    }
  }

  const avatar = body.avatar_url || body.avatarUrl;
  if (avatar !== undefined && avatar !== null) {
    if (typeof avatar !== "string") {
      errors.push("avatar_url must be a string");
    }
  }

  return errors;
}

function validateChangePassword(body) {
  const errors = [];

  if (!body.currentPassword || typeof body.currentPassword !== "string") {
    errors.push("currentPassword is required");
  }

  if (
    !body.newPassword ||
    typeof body.newPassword !== "string" ||
    body.newPassword.length < 6
  ) {
    errors.push("newPassword must be at least 6 characters long");
  }

  return errors;
}

module.exports = {
  validateUpdateProfile,
  validateChangePassword,
};
