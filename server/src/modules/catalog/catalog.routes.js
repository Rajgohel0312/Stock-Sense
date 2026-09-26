const express = require("express");

const router = express.Router();

const {
  authenticate
} = require("../../middleware/authenticate");

const {
  authorize
} = require("../../middleware/authorize");

const controller =
  require("./category.controller");

router.use(authenticate);

router.get(
  "/categories",
  controller.listCategories
);

router.get(
  "/categories/:id",
  controller.getCategory
);

router.post(
  "/categories",
  authorize("inventory_manager"),
  controller.createCategory
);

router.patch(
  "/categories/:id",
  authorize("inventory_manager"),
  controller.updateCategory
);

router.delete(
  "/categories/:id",
  authorize("inventory_manager"),
  controller.deactivateCategory
);

module.exports = router;