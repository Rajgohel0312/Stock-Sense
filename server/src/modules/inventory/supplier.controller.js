const service =
  require("./supplier.service");

const {
  validateSupplier,
  validateSupplierUpdate
} = require("./supplier.validation");

async function listSuppliers(
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

    const suppliers =
      await service.listSuppliers({
        search,
        active: activeFilter
      });

    res.json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    next(error);
  }
}

async function getSupplier(
  req,
  res,
  next
) {
  try {
    const supplier =
      await service.getSupplier(
        req.params.id
      );

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    next(error);
  }
}

async function createSupplier(
  req,
  res,
  next
) {
  try {
    const data =
      validateSupplier(
        req.body
      );

    const supplier =
      await service.createSupplier(
        data
      );

    res.status(201).json({
      success: true,
      data: supplier
    });
  } catch (error) {
    next(error);
  }
}

async function updateSupplier(
  req,
  res,
  next
) {
  try {
    const data =
      validateSupplierUpdate(
        req.body
      );

    const supplier =
      await service.updateSupplier(
        req.params.id,
        data
      );

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier
};