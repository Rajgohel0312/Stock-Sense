const service =
  require("./stock.service");

const {
  validateStockChange
} = require("./stock.validation");

async function listStock(
  req,
  res,
  next
) {
  try {
    const {
      productId,
      warehouseId,
      locationId,
      search
    } = req.query;

    const stock =
      await service.listStock({
        productId,
        warehouseId,
        locationId,
        search
      });

    res.json({
      success: true,
      data: stock
    });
  } catch (error) {
    next(error);
  }
}

async function getStock(
  req,
  res,
  next
) {
  try {
    const stock =
      await service.getStock(
        req.params.productId,
        req.params.locationId
      );

    res.json({
      success: true,
      data: stock
    });
  } catch (error) {
    next(error);
  }
}

async function changeStock(
  req,
  res,
  next
) {
  try {
    const data =
      validateStockChange(
        req.body
      );

    const result =
      await service.changeStock({
        ...data,
        userId: req.user.id
      });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function getLedger(
  req,
  res,
  next
) {
  try {
    const {
      productId,
      locationId,
      warehouseId,
      movementType,
      limit,
      offset
    } = req.query;

    const ledger =
      await service.getLedger({
        productId,
        locationId,
        warehouseId,
        movementType,
        limit,
        offset
      });

    res.json({
      success: true,
      data: ledger
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listStock,
  getStock,
  changeStock,
  getLedger
};