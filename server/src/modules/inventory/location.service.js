const repository =
  require("./location.repository");

const warehouseRepository =
  require("./warehouse.repository");

async function listLocations(filters) {
  return repository.findAll(filters);
}

async function getLocation(id) {
  const location =
    await repository.findById(id);

  if (!location) {
    const error = new Error(
      "Location not found."
    );

    error.statusCode = 404;

    throw error;
  }

  return location;
}

async function createLocation(data) {
  const warehouse =
    await warehouseRepository.findById(
      data.warehouseId
    );

  if (!warehouse) {
    const error = new Error(
      "Warehouse not found."
    );

    error.statusCode = 400;

    throw error;
  }

  if (!warehouse.is_active) {
    const error = new Error(
      "Cannot create location in an inactive warehouse."
    );

    error.statusCode = 400;

    throw error;
  }

  if (data.parentLocationId) {
    const parent =
      await repository.findById(
        data.parentLocationId
      );

    if (!parent) {
      const error = new Error(
        "Parent location not found."
      );

      error.statusCode = 400;

      throw error;
    }

    if (
      parent.warehouse_id !==
      data.warehouseId
    ) {
      const error = new Error(
        "Parent location must belong to the same warehouse."
      );

      error.statusCode = 400;

      throw error;
    }
  }

  const existing =
    await repository.findByCode(
      data.warehouseId,
      data.code
    );

  if (existing) {
    const error = new Error(
      "Location code already exists in this warehouse."
    );

    error.statusCode = 409;

    throw error;
  }

  return repository.create(data);
}

async function updateLocation(
  id,
  data
) {
  const location =
    await repository.findById(id);

  if (!location) {
    const error = new Error(
      "Location not found."
    );

    error.statusCode = 404;

    throw error;
  }

  if (data.parentLocationId) {
    if (
      data.parentLocationId === id
    ) {
      const error = new Error(
        "A location cannot be its own parent."
      );

      error.statusCode = 400;

      throw error;
    }

    const parent =
      await repository.findById(
        data.parentLocationId
      );

    if (!parent) {
      const error = new Error(
        "Parent location not found."
      );

      error.statusCode = 400;

      throw error;
    }

    if (
      parent.warehouse_id !==
      location.warehouse_id
    ) {
      const error = new Error(
        "Parent location must belong to the same warehouse."
      );

      error.statusCode = 400;

      throw error;
    }
  }

  if (
    data.code &&
    data.code.toLowerCase() !==
      location.code.toLowerCase()
  ) {
    const existing =
      await repository.findByCode(
        location.warehouse_id,
        data.code
      );

    if (existing) {
      const error = new Error(
        "Location code already exists in this warehouse."
      );

      error.statusCode = 409;

      throw error;
    }
  }

  return repository.update(
    id,
    data
  );
}

async function deactivateLocation(id) {
  const location =
    await repository.findById(id);

  if (!location) {
    const error = new Error(
      "Location not found."
    );

    error.statusCode = 404;

    throw error;
  }

  return repository.deactivate(id);
}

module.exports = {
  listLocations,
  getLocation,
  createLocation,
  updateLocation,
  deactivateLocation
};