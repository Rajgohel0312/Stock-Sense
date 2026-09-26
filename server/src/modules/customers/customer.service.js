const repository = require("./customer.repository");

async function createCustomer(data) {
  return repository.createCustomer(data);
}

async function getCustomer(id) {
  const customer = await repository.findById(id);
  if (!customer) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }
  return customer;
}

async function listCustomers(filters) {
  return repository.list(filters);
}

async function updateCustomer(id, data) {
  const existing = await repository.findById(id);
  if (!existing) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }

  return repository.updateCustomer(id, data);
}

async function deactivateCustomer(id) {
  const existing = await repository.findById(id);
  if (!existing) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }

  return repository.deactivateCustomer(id);
}

module.exports = {
  createCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
  deactivateCustomer,
};
