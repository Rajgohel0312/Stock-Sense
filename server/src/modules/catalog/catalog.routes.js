const express = require("express");

const router = express.Router();

const { authenticate } = require("../../middleware/authenticate");

const { authorize } = require("../../middleware/authorize");

const controller = require("./category.controller");
const productController = require("./product.controller");
router.use(authenticate);

router.get("/categories", controller.listCategories);

router.get("/categories/:id", controller.getCategory);

router.post(
  "/categories",
  authorize("inventory_manager"),
  controller.createCategory,
);

router.patch(
  "/categories/:id",
  authorize("inventory_manager"),
  controller.updateCategory,
);

router.delete(
  "/categories/:id",
  authorize("inventory_manager"),
  controller.deactivateCategory,
);

router.get("/units", productController.listUnits);

router.get("/products", productController.listProducts);

router.get("/products/:id", productController.getProduct);

router.post(
  "/products",
  authorize("inventory_manager"),
  productController.createProduct,
);

router.patch(
  "/products/:id",
  authorize("inventory_manager"),
  productController.updateProduct,
);

router.delete(
  "/products/:id",
  authorize("inventory_manager"),
  productController.deactivateProduct,
);

module.exports = router;
