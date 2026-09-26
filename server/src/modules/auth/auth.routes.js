const express = require("express");

const {
  signupController,
  loginController,
  meController,
  logoutController,
  forgotPasswordController,
  verifyResetOtpController,
  resetPasswordController,
  googleCallbackController,
  googleAuthController,
} = require("./auth.controller");

const { authenticate } = require("../../middleware/authenticate");
const router = express.Router();

router.post("/signup", signupController);

router.post("/login", loginController);

router.get("/me", authenticate, meController);

router.post("/logout", logoutController);

router.post("/forgot-password", forgotPasswordController);

router.post("/verify-reset-otp", verifyResetOtpController);

router.post("/reset-password", resetPasswordController);

router.get("/google", googleAuthController);

router.get("/google/callback", googleCallbackController);

module.exports = router;
