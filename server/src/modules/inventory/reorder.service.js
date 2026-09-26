const repository = require("./reorder.repository");

const productRepository = require("../catalog/product.repository");

const locationRepository = require("./location.repository");

async function listRules(filters) {
  return repository.findAll(filters);
}

async function getRule(id) {
  const rule = await repository.findById(id);

  if (!rule) {
    const error = new Error("Reorder rule not found.");

    error.statusCode = 404;

    throw error;
  }

  return rule;
}

async function createRule(data) {
  const product = await productRepository.findById(data.productId);

  if (!product) {
    const error = new Error("Product not found.");

    error.statusCode = 400;

    throw error;
  }

  if (!product.is_active) {
    const error = new Error("Cannot create rule for inactive product.");

    error.statusCode = 400;

    throw error;
  }

  if (data.locationId) {
    const location = await locationRepository.findById(data.locationId);

    if (!location) {
      const error = new Error("Location not found.");

      error.statusCode = 400;

      throw error;
    }
  }

  const existing = await repository.findExisting(
    data.productId,
    data.locationId,
  );

  if (existing) {
    const error = new Error(
      "A reorder rule already exists for this product and location.",
    );

    error.statusCode = 409;

    throw error;
  }

  return repository.create(data);
}

async function updateRule(id, data) {
  const rule = await repository.findById(id);

  if (!rule) {
    const error = new Error("Reorder rule not found.");

    error.statusCode = 404;

    throw error;
  }

  const min = data.minQuantity ?? Number(rule.minimum_quantity);

  const max =  data.maxQuantity ?? Number(rule.maximum_quantity);

  const reorder = data.reorderQuantity ?? Number(rule.reorder_quantity);

  if (min >= max) {
    const error = new Error(
      "Minimum quantity must be less than maximum quantity.",
    );

    error.statusCode = 400;

    throw error;
  }

  if (reorder <= 0) {
    const error = new Error("Reorder quantity must be greater than zero.");

    error.statusCode = 400;

    throw error;
  }

  return repository.update(id, data);
}

module.exports = {
  listRules,
  getRule,
  createRule,
  updateRule,
};
