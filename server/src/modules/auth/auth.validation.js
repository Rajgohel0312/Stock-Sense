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
function validateForgotPassword(body) {
  const email = String(body.email || "")
    .trim()
    .toLowerCase();

  if (!email) {
    throw new Error("Email is required.");
  }

  return { email };
}

function validateVerifyResetOtp(body) {
  const email = String(body.email || "")
    .trim()
    .toLowerCase();

  const otp = String(body.otp || "").trim();

  if (!email) {
    throw new Error("Email is required.");
  }

  if (!/^\d{6}$/.test(otp)) {
    throw new Error("OTP must be a 6-digit number.");
  }

  return {
    email,
    otp,
  };
}

function validateResetPassword(body) {
  const resetToken = String(body.resetToken || "").trim();

  const newPassword = String(body.newPassword || "");

  if (!resetToken) {
    throw new Error("Reset token is required.");
  }

  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  return {
    resetToken,
    newPassword,
  };
}
module.exports = {
  validateSignup,
  validateLogin,
  validateForgotPassword,
  validateVerifyResetOtp,
  validateResetPassword,
};
