const { verifyAccessToken } = require("../modules/auth/auth.utils");

const db = require("../database");

async function authenticate(req, res, next) {
  try {
    /*
        |--------------------------------------------------------------------------
        | Get token from HTTP-only cookie
        |--------------------------------------------------------------------------
        */

    const token = req.cookies?.stocksense_access_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    /*
        |--------------------------------------------------------------------------
        | Verify JWT
        |--------------------------------------------------------------------------
        */

    let payload;

    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token.",
      });
    }

    /*
        |--------------------------------------------------------------------------
        | Token subject
        |--------------------------------------------------------------------------
        */

    const userId = payload.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    /*
        |--------------------------------------------------------------------------
        | Load CURRENT user from database
        |--------------------------------------------------------------------------
        |
        | Do not trust role information stored in an old JWT.
        |
        */

    const result = await db.raw(
      `
            SELECT
                u.id,
                u.role_id,
                u.name,
                u.email,
                u.avatar_url,
                u.is_active,
                u.email_verified_at,

                r.name AS role_name

            FROM users u

            INNER JOIN roles r
                ON r.id = u.role_id

            WHERE u.id = $1

            LIMIT 1
            `,
      [userId],
    );

    const user = result.rows[0];

    /*
        |--------------------------------------------------------------------------
        | User no longer exists
        |--------------------------------------------------------------------------
        */

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists.",
      });
    }

    if (
      payload.tokenVersion !== undefined &&
      payload.tokenVersion !== user.auth_token_version
    ) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }

    /*
        |--------------------------------------------------------------------------
        | Account disabled
        |--------------------------------------------------------------------------
        */

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive.",
      });
    }

    /*
        |--------------------------------------------------------------------------
        | Attach current user to request
        |--------------------------------------------------------------------------
        */

    req.user = {
      id: user.id,
      roleId: user.role_id,
      role: user.role_name,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatar_url,
      isActive: user.is_active,
      emailVerifiedAt: user.email_verified_at,
    };

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  authenticate,
};
