const { validateSignup, validateLogin } = require("./auth.validation");

const { signup, login } = require("./auth.service");

const { getAuthCookieOptions } = require("../../config/cookies");
const { findUserById } = require("./auth.repository");

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

    const user =
        await findUserById(
            req.user.id
        );


    if (!user) {

        return res.status(401).json({
            success: false,
            message: "User account no longer exists."
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
                emailVerifiedAt:
                    user.email_verified_at,
                createdAt:
                    user.created_at,
                lastLoginAt:
                    user.last_login_at
            }
        }
    });
}


module.exports = {
  signupController,
  loginController,
  meController
};
