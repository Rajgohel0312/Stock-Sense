const express = require("express");
const controller = require("./customer.controller");
const { authenticate } = require("../../middleware/authenticate");
const { authorize } = require("../../middleware/authorize");

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("inventory_manager", "warehouse_staff"),
  controller.list,
);

router.get(
  "/:id",
  authorize("inventory_manager", "warehouse_staff"),
  controller.getById,
);

router.post(
  "/",
  authorize("inventory_manager"),
  controller.create,
);

router.patch(
  "/:id",
  authorize("inventory_manager"),
  controller.update,
);

router.put(
  "/:id",
  authorize("inventory_manager"),
  controller.update,
);

router.delete(
  "/:id",
  authorize("inventory_manager"),
  controller.deactivate,
);

module.exports = router;
