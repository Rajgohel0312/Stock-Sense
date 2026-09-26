const service = require("./stock.service");
const { validateStockChange } = require("./stock.validation");

async function listStock(req, res, next) {
  try {
    const {
      productId,
      categoryId,
      warehouseId,
      locationId,
      search,
      lowStock,
      outOfStock,
      limit,
      offset,
    } = req.query;

    const stock = await service.listStock({
      productId,
      categoryId,
      warehouseId,
      locationId,
      search,
      lowStock,
      outOfStock,
      limit,
      offset,
    });

    res.json({
      success: true,
      data: stock,
    });
  } catch (error) {
    next(error);
  }
}

async function getStock(req, res, next) {
  try {
    const stock = await service.getStock(
      req.params.productId,
      req.params.locationId,
    );

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock record not found",
      });
    }

    res.json({
      success: true,
      data: stock,
    });
  } catch (error) {
    next(error);
  }
}

async function changeStock(req, res, next) {
  try {
    const data = validateStockChange(req.body);

    const result = await service.changeStock({
      ...data,
      userId: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function getLedger(req, res, next) {
  try {
    const {
      productId,
      locationId,
      warehouseId,
      movementType,
      referenceType,
      referenceId,
      createdBy,
      dateFrom,
      dateTo,
      limit,
      offset,
    } = req.query;

    const ledger = await service.getLedger({
      productId,
      locationId,
      warehouseId,
      movementType,
      referenceType,
      referenceId,
      createdBy,
      dateFrom,
      dateTo,
      limit,
      offset,
    });

    res.json({
      success: true,
      data: ledger,
    });
  } catch (error) {
    next(error);
  }
}

async function listDocuments(req, res, next) {
  try {
    const {
      type,
      status,
      warehouseId,
      locationId,
      productId,
      categoryId,
      dateFrom,
      dateTo,
      limit,
      offset,
    } = req.query;

    const documents = await service.listDocuments({
      type,
      status,
      warehouseId,
      locationId,
      productId,
      categoryId,
      dateFrom,
      dateTo,
      limit,
      offset,
    });

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listStock,
  getStock,
  changeStock,
  getLedger,
  listDocuments,
};