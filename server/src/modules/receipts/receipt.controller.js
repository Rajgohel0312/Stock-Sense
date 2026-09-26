const service = require("./receipt.service");
const {
  validateCreateReceipt,
  validateReceiptItem
} = require("./receipt.validation");

async function create(req, res, next) {
  try {
    const errors = validateCreateReceipt(req.body);

    if (errors.length) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    const receipt = await service.createReceipt({
      supplierId: req.body.supplierId,
      warehouseId: req.body.warehouseId,
      locationId: req.body.locationId,
      referenceNumber: req.body.referenceNumber,
      notes: req.body.notes,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: receipt
    });
  } catch (error) {
    next(error);
  }
}

async function list(req, res, next) {
  try {
    const receipts = await service.listReceipts(req.query);

    res.json({
      success: true,
      data: receipts
    });
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const receipt = await service.getReceipt(
      req.params.id
    );

    res.json({
      success: true,
      data: receipt
    });
  } catch (error) {
    next(error);
  }
}

async function addItem(req, res, next) {
  try {
    const errors = validateReceiptItem(req.body);

    if (errors.length) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    const item = await service.addItem(
      req.params.id,
      req.body
    );

    res.status(201).json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
}

async function validate(req, res, next) {
  try {
    const receipt = await service.validateReceipt(
      req.params.id,
      req.user.id
    );

    res.json({
      success: true,
      message: "Receipt validated successfully",
      data: receipt
    });
  } catch (error) {
    next(error);
  }
}

async function cancel(req, res, next) {
  try {
    const receipt = await service.cancelReceipt(
      req.params.id,
      req.user.id
    );

    res.json({
      success: true,
      message: "Receipt canceled successfully",
      data: receipt
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
  validate,
  cancel
};