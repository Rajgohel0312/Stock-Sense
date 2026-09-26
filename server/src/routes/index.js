const express = require("express");

const authRoutes = require("../modules/auth/auth.routes");
const catalogRoutes = require("../modules/catalog/catalog.routes");
const customerRoutes = require("../modules/customers/customer.routes");
const inventoryRoutes = require("../modules/inventory/inventory.routes");
const receiptRoutes = require("../modules/receipts/receipt.routes");
const deliveryRoutes = require("../modules/deliveries/delivery.routes");
const transferRoutes = require("../modules/transfers/transfer.routes");
const adjustmentRoutes = require("../modules/adjustments/adjustment.routes");
const dashboardRoutes = require("../modules/dashboard/dashboard.routes");
const alertRoutes = require("../modules/alerts/alert.routes");
const profileRoutes = require("../modules/profile/profile.routes");

const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/catalog", catalogRoutes);
router.use("/customers", customerRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/receipts", receiptRoutes);
router.use("/deliveries", deliveryRoutes);
router.use("/transfers", transferRoutes);
router.use("/adjustments", adjustmentRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/alerts", alertRoutes);
router.use("/profile", profileRoutes);

// Catalog aliases for direct client access (/api/products, /api/categories, /api/uom, /api/units)
const categoryController = require("../modules/catalog/category.controller");
const productController = require("../modules/catalog/product.controller");

router.get("/categories", authenticate, categoryController.listCategories);
router.get("/categories/:id", authenticate, categoryController.getCategory);
router.post(
  "/categories",
  authenticate,
  authorize("inventory_manager"),
  categoryController.createCategory,
);
router.patch(
  "/categories/:id",
  authenticate,
  authorize("inventory_manager"),
  categoryController.updateCategory,
);
router.put(
  "/categories/:id",
  authenticate,
  authorize("inventory_manager"),
  categoryController.updateCategory,
);
router.delete(
  "/categories/:id",
  authenticate,
  authorize("inventory_manager"),
  categoryController.deactivateCategory,
);

router.get("/units", authenticate, productController.listUnits);
router.get("/uom", authenticate, productController.listUnits);

router.get("/products", authenticate, productController.listProducts);
router.get("/products/:id", authenticate, productController.getProduct);
router.post(
  "/products",
  authenticate,
  authorize("inventory_manager"),
  productController.createProduct,
);
router.patch(
  "/products/:id",
  authenticate,
  authorize("inventory_manager"),
  productController.updateProduct,
);
router.put(
  "/products/:id",
  authenticate,
  authorize("inventory_manager"),
  productController.updateProduct,
);
router.delete(
  "/products/:id",
  authenticate,
  authorize("inventory_manager"),
  productController.deactivateProduct,
);

router.get(
  "/test-manager",
  authenticate,
  authorize("inventory_manager"),
  (req, res) => {
    res.json({
      success: true,
      message: "Inventory manager access granted.",
      user: req.user,
    });
  },
);

module.exports = router;
