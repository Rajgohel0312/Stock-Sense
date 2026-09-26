function validateSignup(data) {
  const errors = {};

  if (
    !data.name ||
    typeof data.name !== "string" ||
    data.name.trim().length < 2
  ) {
    errors.name = "Name must contain at least 2 characters.";
  }

  if (!data.email || typeof data.email !== "string") {
    errors.email = "Email is required.";
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(data.email.trim())) {
      errors.email = "Invalid email address.";
    }
  }

  if (!data.password || typeof data.password !== "string") {
    errors.password = "Password is required.";
  } else if (data.password.length < 8) {
    errors.password = "Password must contain at least 8 characters.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
function validateLogin(data) {
  const errors = {};

  if (!data.email || typeof data.email !== "string") {
    errors.email = "Email is required.";
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(data.email.trim())) {
      errors.email = "Invalid email address.";
    }
  }

  if (!data.password || typeof data.password !== "string") {
    errors.password = "Password is required.";
  }

  return {
    valid: Object.keys(errors).length === 0,

    errors,
  };
}

module.exports = {
  validateSignup,
  validateLogin,
};
