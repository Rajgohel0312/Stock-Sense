const service = require("./transfer.service");
const {
  validateCreateTransfer,
  validateTransferItem,
} = require("./transfer.validation");

async function create(req, res, next) {
  try {
    const errors = validateCreateTransfer(req.body);
    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const transfer = await service.createTransfer({
      sourceWarehouseId: req.body.sourceWarehouseId || req.body.source_warehouse_id,
      destinationWarehouseId:
        req.body.destinationWarehouseId ||
        req.body.destWarehouseId ||
        req.body.destination_warehouse_id ||
        req.body.dest_warehouse_id,
      sourceLocationId: req.body.sourceLocationId || req.body.source_location_id,
      destinationLocationId: req.body.destinationLocationId || req.body.destination_location_id,
      referenceNumber: req.body.referenceNumber,
      notes: req.body.notes,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: transfer,
    });
  } catch (error) {
    next(error);
  }
}

async function list(req, res, next) {
  try {
    const transfers = await service.listTransfers(req.query);
    res.json({
      success: true,
      data: transfers,
    });
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const transfer = await service.getTransfer(req.params.id);
    res.json({
      success: true,
      data: transfer,
    });
  } catch (error) {
    next(error);
  }
}

async function addItem(req, res, next) {
  try {
    const transfer = await service.getTransfer(req.params.id);
    const errors = validateTransferItem(req.body, transfer);
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
    const transfer = await service.markReady(req.params.id, req.user.id);
    res.json({
      success: true,
      message: "Transfer marked ready",
      data: transfer,
    });
  } catch (error) {
    next(error);
  }
}

async function validate(req, res, next) {
  try {
    const transfer = await service.validateTransfer(req.params.id, req.user.id);
    res.json({
      success: true,
      message: "Transfer validated successfully",
      data: transfer,
    });
  } catch (error) {
    next(error);
  }
}

async function cancel(req, res, next) {
  try {
    const transfer = await service.cancelTransfer(req.params.id, req.user.id);
    res.json({
      success: true,
      message: "Transfer canceled successfully",
      data: transfer,
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
  validate,
  cancel,
};
