const repository = require("./alert.repository");

async function listAlerts(filters) {
  try {
    await repository.syncStockAlerts();
  } catch (err) {
    console.error("Error auto-syncing alerts:", err.message);
  }

  return repository.list(filters);
}

async function getAlert(id) {
  const alert = await repository.findById(id);
  if (!alert) {
    const error = new Error("Alert not found");
    error.statusCode = 404;
    throw error;
  }
  return alert;
}

async function markRead(id, isRead = true) {
  const alert = await repository.findById(id);
  if (!alert) {
    const error = new Error("Alert not found");
    error.statusCode = 404;
    throw error;
  }

  return repository.markRead(id, isRead);
}

module.exports = {
  listAlerts,
  getAlert,
  markRead,
};
