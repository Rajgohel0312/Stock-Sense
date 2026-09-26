const service = require("./profile.service");
const {
  validateUpdateProfile,
  validateChangePassword,
} = require("./profile.validation");

async function getProfile(req, res, next) {
  try {
    const profile = await service.getProfile(req.user.id);
    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const errors = validateUpdateProfile(req.body);
    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const updated = await service.updateProfile(req.user.id, req.body);
    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const errors = validateChangePassword(req.body);
    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const result = await service.changePassword(
      req.user.id,
      req.body.currentPassword,
      req.body.newPassword,
    );

    res.clearCookie("stocksense_access_token");

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

async function logoutAll(req, res, next) {
  try {
    const result = await service.logoutAll(req.user.id);

    res.clearCookie("stocksense_access_token");

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  logoutAll,
};
