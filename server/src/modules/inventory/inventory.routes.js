const express = require("express");

const router = express.Router();

const { authenticate } = require("../../middleware/authenticate");
const { authorize } = require("../../middleware/authorize");

const warehouseController = require("./warehouse.controller");
const locationController = require("./location.controller");
const stockController = require("./stock.controller");
const reorderController = require("./reorder.controller");
const supplierController = require("./supplier.controller");
const reservationController = require("./reservation.controller");

router.use(authenticate);

/*
 * WAREHOUSES
 */

router.get("/warehouses", warehouseController.listWarehouses);

router.get("/warehouses/:id", warehouseController.getWarehouse);

router.post(
  "/warehouses",
  authorize("inventory_manager"),
  warehouseController.createWarehouse,
);

router.patch(
  "/warehouses/:id",
  authorize("inventory_manager"),
  warehouseController.updateWarehouse,
);

router.delete(
  "/warehouses/:id",
  authorize("inventory_manager"),
  warehouseController.deactivateWarehouse,
);

/*
 * LOCATIONS
 */

router.get("/locations", locationController.listLocations);

router.get("/locations/:id", locationController.getLocation);

router.post(
  "/locations",
  authorize("inventory_manager"),
  locationController.createLocation,
);

router.patch(
  "/locations/:id",
  authorize("inventory_manager"),
  locationController.updateLocation,
);

router.delete(
  "/locations/:id",
  authorize("inventory_manager"),
  locationController.deactivateLocation,
);

/*
 * STOCK & AUDIT LEDGER
 */

router.get("/stock", stockController.listStock);

router.get("/stock/:productId/:locationId", stockController.getStock);

router.post(
  "/stock/change",
  authorize("inventory_manager"),
  stockController.changeStock,
);

router.get("/stock-ledger", stockController.getLedger);
router.get("/ledger", stockController.getLedger);

/*
 * UNIFIED DOCUMENTS FILTER
 */
router.get("/documents", stockController.listDocuments);

/*
 * RESERVATIONS
 */
router.post(
  "/reservations",
  authorize("inventory_manager"),
  reservationController.create,
);

router.get("/reservations", reservationController.list);

router.get("/reservations/:id", reservationController.getById);

router.post(
  "/reservations/:id/release",
  authorize("inventory_manager"),
  reservationController.release,
);

router.delete(
  "/reservations/:id",
  authorize("inventory_manager"),
  reservationController.release,
);

/*
 * REORDER RULES
 */

router.get("/reorder-rules", reorderController.listRules);

router.get("/reorder-rules/:id", reorderController.getRule);

router.post(
  "/reorder-rules",
  authorize("inventory_manager"),
  reorderController.createRule,
);

router.patch(
  "/reorder-rules/:id",
  authorize("inventory_manager"),
  reorderController.updateRule,
);

/*
 * SUPPLIERS
 */

router.get("/suppliers", supplierController.listSuppliers);

router.get("/suppliers/:id", supplierController.getSupplier);

router.post(
  "/suppliers",
  authorize("inventory_manager"),
  supplierController.createSupplier,
);

router.patch(
  "/suppliers/:id",
  authorize("inventory_manager"),
  supplierController.updateSupplier,
);

module.exports = router;
