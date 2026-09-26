const service = require("./alert.service");

async function list(req, res, next) {
  try {
    const alerts = await service.listAlerts(req.query);
    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const alert = await service.getAlert(req.params.id);
    res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    next(error);
  }
}

async function markRead(req, res, next) {
  try {
    const isRead = req.body.isRead !== undefined ? req.body.isRead : true;
    const alert = await service.markRead(req.params.id, isRead);
    res.json({
      success: true,
      message: "Alert updated successfully",
      data: alert,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  getById,
  markRead,
};
