const express = require("express");
const controller = require("./profile.controller");
const { authenticate } = require("../../middleware/authenticate");

const router = express.Router();

router.use(authenticate);

router.get("/", controller.getProfile);
router.patch("/", controller.updateProfile);
router.put("/", controller.updateProfile);
router.post("/change-password", controller.changePassword);
router.post("/password", controller.changePassword);
router.put("/password", controller.changePassword);
router.post("/logout-all", controller.logoutAll);

module.exports = router;
