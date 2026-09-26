const service =
  require("./warehouse.service");

const {
  validateCreateWarehouse,
  validateUpdateWarehouse
} = require("./warehouse.validation");

async function listWarehouses(
  req,
  res,
  next
) {
  try {
    const {
      search,
      active
    } = req.query;

    let activeFilter;

    if (active !== undefined) {
      activeFilter =
        active === "true";
    }

    const warehouses =
      await service.listWarehouses({
        search,
        active: activeFilter
      });

    res.json({
      success: true,
      data: warehouses
    });
  } catch (error) {
    next(error);
  }
}

async function getWarehouse(
  req,
  res,
  next
) {
  try {
    const warehouse =
      await service.getWarehouse(
        req.params.id
      );

    res.json({
      success: true,
      data: warehouse
    });
  } catch (error) {
    next(error);
  }
}

async function createWarehouse(
  req,
  res,
  next
) {
  try {
    const data =
      validateCreateWarehouse(
        req.body
      );

    const warehouse =
      await service.createWarehouse(
        data
      );

    res.status(201).json({
      success: true,
      data: warehouse
    });
  } catch (error) {
    next(error);
  }
}

async function updateWarehouse(
  req,
  res,
  next
) {
  try {
    const data =
      validateUpdateWarehouse(
        req.body
      );

    const warehouse =
      await service.updateWarehouse(
        req.params.id,
        data
      );

    res.json({
      success: true,
      data: warehouse
    });
  } catch (error) {
    next(error);
  }
}

async function deactivateWarehouse(
  req,
  res,
  next
) {
  try {
    const warehouse =
      await service.deactivateWarehouse(
        req.params.id
      );

    res.json({
      success: true,
      data: warehouse
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deactivateWarehouse
};