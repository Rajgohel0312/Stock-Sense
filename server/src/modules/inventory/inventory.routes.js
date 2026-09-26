const express = require("express");

const router = express.Router();

const {
  authenticate
} = require("../../middleware/authenticate");

const {
  authorize
} = require("../../middleware/authorize");

const warehouseController =
  require("./warehouse.controller");

const locationController =
  require("./location.controller");

router.use(authenticate);

/*
 * WAREHOUSES
 */

router.get(
  "/warehouses",
  warehouseController.listWarehouses
);

router.get(
  "/warehouses/:id",
  warehouseController.getWarehouse
);

router.post(
  "/warehouses",
  authorize("inventory_manager"),
  warehouseController.createWarehouse
);

router.patch(
  "/warehouses/:id",
  authorize("inventory_manager"),
  warehouseController.updateWarehouse
);

router.delete(
  "/warehouses/:id",
  authorize("inventory_manager"),
  warehouseController.deactivateWarehouse
);

/*
 * LOCATIONS
 */

router.get(
  "/locations",
  locationController.listLocations
);

router.get(
  "/locations/:id",
  locationController.getLocation
);

router.post(
  "/locations",
  authorize("inventory_manager"),
  locationController.createLocation
);

router.patch(
  "/locations/:id",
  authorize("inventory_manager"),
  locationController.updateLocation
);

router.delete(
  "/locations/:id",
  authorize("inventory_manager"),
  locationController.deactivateLocation
);

module.exports = router;