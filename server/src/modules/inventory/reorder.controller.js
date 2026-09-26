const service = require("./reorder.service");

const {
  validateReorderRule,
  validateUpdateReorderRule,
} = require("./reorder.validation");

async function listRules(req, res, next) {
  try {
    const { productId, locationId, active } = req.query;

    let activeFilter;

    if (active !== undefined) {
      activeFilter = active === "true";
    }

    const rules = await service.listRules({
      productId,
      locationId,
      active: activeFilter,
    });

    res.json({
      success: true,
      data: rules,
    });
  } catch (error) {
    next(error);
  }
}

async function getRule(req, res, next) {
  try {
    const rule = await service.getRule(req.params.id);

    res.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
}

async function createRule(req, res, next) {
  try {
    const data = validateReorderRule(req.body);

    const rule = await service.createRule(data);

    res.status(201).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
}

async function updateRule(req, res, next) {
  try {
    const data = validateUpdateReorderRule(req.body);

    const rule = await service.updateRule(req.params.id, data);

    res.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listRules,
  getRule,
  createRule,
  updateRule,
};
