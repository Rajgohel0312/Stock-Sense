const repository =
  require("./warehouse.repository");

async function listWarehouses(filters) {
  return repository.findAll(filters);
}

async function getWarehouse(id) {
  const warehouse =
    await repository.findById(id);

  if (!warehouse) {
    const error = new Error(
      "Warehouse not found."
    );

    error.statusCode = 404;

    throw error;
  }

  return warehouse;
}

async function createWarehouse(data) {
  const existing =
    await repository.findByCode(
      data.code
    );

  if (existing) {
    const error = new Error(
      "Warehouse code already exists."
    );

    error.statusCode = 409;

    throw error;
  }

  return repository.create(data);
}

async function updateWarehouse(
  id,
  data
) {
  const warehouse =
    await repository.findById(id);

  if (!warehouse) {
    const error = new Error(
      "Warehouse not found."
    );

    error.statusCode = 404;

    throw error;
  }

  if (
    data.code &&
    data.code.toLowerCase() !==
      warehouse.code.toLowerCase()
  ) {
    const existing =
      await repository.findByCode(
        data.code
      );

    if (existing) {
      const error = new Error(
        "Warehouse code already exists."
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

async function deactivateWarehouse(id) {
  const warehouse =
    await repository.findById(id);

  if (!warehouse) {
    const error = new Error(
      "Warehouse not found."
    );

    error.statusCode = 404;

    throw error;
  }

  return repository.deactivate(id);
}

module.exports = {
  listWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deactivateWarehouse
};