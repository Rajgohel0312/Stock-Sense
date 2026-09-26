const service = require("./dashboard.service");

async function getSummary(req, res, next) {
  try {
    const summary = await service.getSummary(req.query);
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
}

async function getLowStock(req, res, next) {
  try {
    const lowStock = await service.getLowStock(req.query);
    res.json({
      success: true,
      data: lowStock,
    });
  } catch (error) {
    next(error);
  }
}

async function getRecentMovements(req, res, next) {
  try {
    const movements = await service.getRecentMovements(req.query);
    res.json({
      success: true,
      data: movements,
    });
  } catch (error) {
    next(error);
  }
}

async function getPendingDocuments(req, res, next) {
  try {
    const documents = await service.getPendingDocuments(req.query);
    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSummary,
  getLowStock,
  getRecentMovements,
  getPendingDocuments,
};
