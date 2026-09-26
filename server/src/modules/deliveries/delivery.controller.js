const service = require("./delivery.service");

const {
  validateCreateDelivery,
  validateDeliveryItem,
} = require("./delivery.validation");

async function create(req, res, next) {
  try {
    const errors = validateCreateDelivery(req.body);

    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const delivery = await service.createDelivery({
      customerId: req.body.customerId,
      warehouseId: req.body.warehouseId,
      locationId: req.body.locationId,
      referenceNumber: req.body.referenceNumber,
      notes: req.body.notes,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: delivery,
    });
  } catch (error) {
    next(error);
  }
}

async function list(req, res, next) {
  try {
    const deliveries = await service.listDeliveries(req.query);

    res.json({
      success: true,
      data: deliveries,
    });
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const delivery = await service.getDelivery(req.params.id);

    res.json({
      success: true,
      data: delivery,
    });
  } catch (error) {
    next(error);
  }
}

async function addItem(req, res, next) {
  try {
    const errors = validateDeliveryItem(req.body);

    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const item = await service.addItem(req.params.id, req.body);

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
}

async function ready(req, res, next) {
  try {
    const delivery = await service.markReady(req.params.id, req.user.id);

    res.json({
      success: true,
      message: "Delivery marked ready",
      data: delivery,
    });
  } catch (error) {
    next(error);
  }
}

async function picked(req, res, next) {
  try {
    const delivery = await service.markPicked(req.params.id, req.user.id);

    res.json({
      success: true,
      message: "Delivery picked",
      data: delivery,
    });
  } catch (error) {
    next(error);
  }
}

async function packed(req, res, next) {
  try {
    const delivery = await service.markPacked(req.params.id, req.user.id);

    res.json({
      success: true,
      message: "Delivery packed",
      data: delivery,
    });
  } catch (error) {
    next(error);
  }
}

async function validate(req, res, next) {
  try {
    const delivery = await service.validateDelivery(
      req.params.id,
      req.user.id,
    );

    res.json({
      success: true,
      message: "Delivery validated successfully",
      data: delivery,
    });
  } catch (error) {
    next(error);
  }
}

async function cancel(req, res, next) {
  try {
    const delivery = await service.cancelDelivery(
      req.params.id,
      req.user.id,
    );

    res.json({
      success: true,
      message: "Delivery canceled successfully",
      data: delivery,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  list,
  getById,
  addItem,
  ready,
  picked,
  packed,
  validate,
  cancel,
};