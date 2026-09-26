const express = require("express");

const {
  signupController,
  loginController,
  meController,
} = require("./auth.controller");

const { authenticate } = require("../../middleware/authenticate");
const router = express.Router();

router.post("/signup", signupController);

router.post("/login", loginController);

router.get("/me", authenticate, meController);

module.exports = router;
