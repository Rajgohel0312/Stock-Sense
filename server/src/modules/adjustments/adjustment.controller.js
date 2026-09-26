const service = require("./adjustment.service");
const {
  validateCreateAdjustment,
  validateAdjustmentItem,
} = require("./adjustment.validation");

async function create(req, res, next) {
  try {
    const errors = validateCreateAdjustment(req.body);
    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const adjustment = await service.createAdjustment({
      warehouseId: req.body.warehouseId,
      reason: req.body.reason,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: adjustment,
    });
  } catch (error) {
    next(error);
  }
}

async function list(req, res, next) {
  try {
    const adjustments = await service.listAdjustments(req.query);
    res.json({
      success: true,
      data: adjustments,
    });
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const adjustment = await service.getAdjustment(req.params.id);
    res.json({
      success: true,
      data: adjustment,
    });
  } catch (error) {
    next(error);
  }
}

async function addItem(req, res, next) {
  try {
    const errors = validateAdjustmentItem(req.body);
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

async function validate(req, res, next) {
  try {
    const adjustment = await service.validateAdjustment(
      req.params.id,
      req.user.id,
    );

    res.json({
      success: true,
      message: "Adjustment validated successfully",
      data: adjustment,
    });
  } catch (error) {
    next(error);
  }
}

async function cancel(req, res, next) {
  try {
    const adjustment = await service.cancelAdjustment(
      req.params.id,
      req.user.id,
    );

    res.json({
      success: true,
      message: "Adjustment canceled successfully",
      data: adjustment,
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
  cancel,
};
