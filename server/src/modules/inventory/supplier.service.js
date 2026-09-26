const repository =
  require("./supplier.repository");

async function listSuppliers(filters) {
  return repository.findAll(filters);
}

async function getSupplier(id) {
  const supplier =
    await repository.findById(id);

  if (!supplier) {
    const error = new Error(
      "Supplier not found."
    );

    error.statusCode = 404;

    throw error;
  }

  return supplier;
}

async function createSupplier(data) {
  return repository.create(data);
}

async function updateSupplier(
  id,
  data
) {
  const supplier =
    await repository.findById(id);

  if (!supplier) {
    const error = new Error(
      "Supplier not found."
    );

    error.statusCode = 404;

    throw error;
  }

  return repository.update(
    id,
    data
  );
}

module.exports = {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier
};