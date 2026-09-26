const {
  validateSignup,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyResetOtp,
} = require("./auth.validation");

const {
  signup,
  login,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} = require("./auth.service");
const passport = require("../../config/google");
const { getAuthCookieOptions } = require("../../config/cookies");
const { findUserById } = require("./auth.repository");
const env = require("../../config/env");
const { generateAccessToken } = require("./auth.utils");

async function signupController(req, res) {
  const validation = validateSignup(req.body);

  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: validation.errors,
    });
  }

  try {
    const user = await signup(req.body);

    return res.status(201).json({
      success: true,

      message: "Account created successfully.",

      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to create account.",
    });
  }
}
async function loginController(req, res) {
  const validation = validateLogin(req.body);

  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: validation.errors,
    });
  }

  try {
    const result = await login(req.body);

    /*
        |--------------------------------------------------------------------------
        | Set HTTP-only auth cookie
        |--------------------------------------------------------------------------
        */

    res.cookie("stocksense_access_token", result.token, getAuthCookieOptions());

    /*
        |--------------------------------------------------------------------------
        | Never send token in response
        |--------------------------------------------------------------------------
        */

    return res.status(200).json({
      success: true,

      message: "Login successful.",

      data: {
        user: result.user,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,

      message: error.message || "Unable to login.",
    });
  }
}
async function meController(req, res) {
  const user = await findUserById(req.user.id);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "User account no longer exists.",
    });
  }

  return res.status(200).json({
    success: true,

    data: {
      user: {
        id: user.id,
        roleId: user.role_id,
        role: user.role_name,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatar_url,
        isActive: user.is_active,
        emailVerifiedAt: user.email_verified_at,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at,
      },
    },
  });
}
async function logoutController(req, res) {
  res.clearCookie("stocksense_access_token", {
    httpOnly: true,

    secure: process.env.NODE_ENV === "production",

    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",

    path: "/",
  });

  return res.status(200).json({
    success: true,

    message: "Logged out successfully.",
  });
}
async function forgotPasswordController(req, res, next) {
  try {
    const { email } = validateForgotPassword(req.body);

    const result = await forgotPassword(email);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}
async function verifyResetOtpController(req, res, next) {
  try {
    const { email, otp } = validateVerifyResetOtp(req.body);

    const result = await verifyResetOtp(email, otp);

    return res.status(200).json({
      success: true,
      message: "OTP verified.",
      resetToken: result.resetToken,
    });
  } catch (error) {
    next(error);
  }
}
async function resetPasswordController(req, res, next) {
  try {
    const { resetToken, newPassword } = validateResetPassword(req.body);

    const result = await resetPassword(resetToken, newPassword);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}
function googleAuthController(req, res, next) {
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })(req, res, next);
}
function googleCallbackController(req, res, next) {
  passport.authenticate(
    "google",
    {
      session: false,
    },
    (error, user) => {
      if (error) {
        return next(error);
      }

      if (!user) {
        return res.redirect(`${env.clientUrl}/login?error=google_auth_failed`);
      }

      const token = generateAccessToken(user);

      res.cookie("stocksense_access_token", token, getAuthCookieOptions());

      return res.redirect(`${env.clientUrl}/dashboard`);
    },
  )(req, res, next);
}
module.exports = {
  signupController,
  loginController,
  meController,
  logoutController,
  forgotPasswordController,
  verifyResetOtpController,
  resetPasswordController,
  googleAuthController,
  googleCallbackController,
};
