const express = require("express");

const controller = require("./delivery.controller");
const { authenticate } = require("../../middleware/authenticate");
const { authorize } = require("../../middleware/authorize");

const router = express.Router();

router.use(authenticate);

router.get("/", controller.list);

router.get("/:id", controller.getById);

router.post("/", authorize("inventory_manager"), controller.create);

router.post("/:id/items", authorize("inventory_manager"), controller.addItem);

router.post("/:id/ready", authorize("inventory_manager"), controller.ready);
router.post("/:id/mark-ready", authorize("inventory_manager"), controller.ready);

router.post(
  "/:id/pick",
  authorize("inventory_manager", "warehouse_staff"),
  controller.picked,
);

router.post(
  "/:id/pack",
  authorize("inventory_manager", "warehouse_staff"),
  controller.packed,
);

router.post(
  "/:id/validate",
  authorize("inventory_manager"),
  controller.validate,
);

router.post(
  "/:id/cancel",
  authorize("inventory_manager"),
  controller.cancel,
);

module.exports = router;