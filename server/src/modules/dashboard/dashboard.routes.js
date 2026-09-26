const express = require("express");
const controller = require("./dashboard.controller");
const { authenticate } = require("../../middleware/authenticate");

const router = express.Router();

router.use(authenticate);

router.get("/summary", controller.getSummary);
router.get("/low-stock", controller.getLowStock);
router.get("/recent-movements", controller.getRecentMovements);
router.get("/pending-documents", controller.getPendingDocuments);

module.exports = router;
