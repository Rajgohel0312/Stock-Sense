const express = require("express");
const controller = require("./alert.controller");
const { authenticate } = require("../../middleware/authenticate");

const router = express.Router();

router.use(authenticate);

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.patch("/:id/read", controller.markRead);
router.post("/:id/resolve", controller.markRead);

module.exports = router;
