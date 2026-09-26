const service = require("./reservation.service");
const { validateCreateReservation } = require("./reservation.validation");

async function create(req, res, next) {
  try {
    const errors = validateCreateReservation(req.body);
    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const reservation = await service.createReservation({
      productId: req.body.productId,
      locationId: req.body.locationId,
      quantity: req.body.quantity,
      referenceType: req.body.referenceType,
      referenceId: req.body.referenceId,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
}

async function list(req, res, next) {
  try {
    const reservations = await service.listReservations(req.query);
    res.json({
      success: true,
      data: reservations,
    });
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const reservation = await service.getReservation(req.params.id);
    res.json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
}

async function release(req, res, next) {
  try {
    const reservation = await service.releaseReservation(
      req.params.id,
      req.user.id,
    );

    res.json({
      success: true,
      message: "Reservation released successfully",
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  list,
  getById,
  release,
};
