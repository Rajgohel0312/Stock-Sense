const repository = require("./dashboard.repository");

async function getSummary(filters) {
  return repository.getSummary(filters);
}

async function getLowStock(filters) {
  return repository.getLowStock(filters);
}

async function getRecentMovements(filters) {
  return repository.getRecentMovements(filters);
}

async function getPendingDocuments(filters) {
  return repository.getPendingDocuments(filters);
}

module.exports = {
  getSummary,
  getLowStock,
  getRecentMovements,
  getPendingDocuments,
};
