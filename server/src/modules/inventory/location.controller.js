const service =
  require("./location.service");

const {
  validateCreateLocation,
  validateUpdateLocation
} = require("./location.validation");

async function listLocations(
  req,
  res,
  next
) {
  try {
    const {
      warehouseId,
      search,
      active
    } = req.query;

    let activeFilter;

    if (active !== undefined) {
      activeFilter =
        active === "true";
    }

    const locations =
      await service.listLocations({
        warehouseId,
        search,
        active: activeFilter
      });

    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    next(error);
  }
}

async function getLocation(
  req,
  res,
  next
) {
  try {
    const location =
      await service.getLocation(
        req.params.id
      );

    res.json({
      success: true,
      data: location
    });
  } catch (error) {
    next(error);
  }
}

async function createLocation(
  req,
  res,
  next
) {
  try {
    const data =
      validateCreateLocation(
        req.body
      );

    const location =
      await service.createLocation(
        data
      );

    res.status(201).json({
      success: true,
      data: location
    });
  } catch (error) {
    next(error);
  }
}

async function updateLocation(
  req,
  res,
  next
) {
  try {
    const data =
      validateUpdateLocation(
        req.body
      );

    const location =
      await service.updateLocation(
        req.params.id,
        data
      );

    res.json({
      success: true,
      data: location
    });
  } catch (error) {
    next(error);
  }
}

async function deactivateLocation(
  req,
  res,
  next
) {
  try {
    const location =
      await service.deactivateLocation(
        req.params.id
      );

    res.json({
      success: true,
      data: location
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listLocations,
  getLocation,
  createLocation,
  updateLocation,
  deactivateLocation
};