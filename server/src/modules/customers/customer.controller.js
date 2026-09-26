const service = require("./customer.service");
const {
  validateCreateCustomer,
  validateUpdateCustomer,
} = require("./customer.validation");

async function create(req, res, next) {
  try {
    const errors = validateCreateCustomer(req.body);
    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const customer = await service.createCustomer(req.body);
    res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
}

async function list(req, res, next) {
  try {
    const customers = await service.listCustomers(req.query);
    res.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const customer = await service.getCustomer(req.params.id);
    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const errors = validateUpdateCustomer(req.body);
    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const customer = await service.updateCustomer(req.params.id, req.body);
    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
}

async function deactivate(req, res, next) {
  try {
    const customer = await service.deactivateCustomer(req.params.id);
    res.json({
      success: true,
      message: "Customer deactivated successfully",
      data: customer,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  list,
  getById,
  update,
  deactivate,
};
