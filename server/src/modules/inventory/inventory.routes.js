const express = require("express");

const router = express.Router();

const { authenticate } = require("../../middleware/authenticate");

const { authorize } = require("../../middleware/authorize");

const warehouseController = require("./warehouse.controller");

const locationController = require("./location.controller");
const stockController = require("./stock.controller");


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

router.get(
  "/stock",
  stockController.listStock
);

router.get(
  "/stock/:productId/:locationId",
  stockController.getStock
);

router.post(
  "/stock/change",
  authorize("inventory_manager"),
  stockController.changeStock
);

router.get(
  "/stock-ledger",
  stockController.getLedger
);

module.exports = router;
