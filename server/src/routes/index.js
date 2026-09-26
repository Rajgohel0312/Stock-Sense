const express = require("express");

const authRoutes = require("../modules/auth/auth.routes");
const catalogRoutes = require("../modules/catalog/catalog.routes");
const inventoryRoutes = require("../modules/inventory/inventory.routes");

const { authenticate } = require("../middleware/authenticate.js");

const { authorize } = require("../middleware/authorize.js");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/catalog", catalogRoutes);
router.use("/inventory", inventoryRoutes);

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
