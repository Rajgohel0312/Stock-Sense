const repository =
  require("./stock.repository");

const productRepository =
  require("../catalog/product.repository");

const locationRepository =
  require("./location.repository");

async function listStock(filters) {
  return repository.findAll(filters);
}

async function getStock(
  productId,
  locationId
) {
  return repository.findStock(
    productId,
    locationId
  );
}

async function changeStock({
  productId,
  locationId,
  quantity,
  movementType,
  notes,
  userId,
  referenceType = null,
  referenceId = null
}) {
  /*
   * Verify product exists.
   */
  const product =
    await productRepository.findById(
      productId
    );

  if (!product) {
    const error = new Error(
      "Product not found."
    );

    error.statusCode = 400;

    throw error;
  }

  if (!product.is_active) {
    const error = new Error(
      "Cannot change stock for an inactive product."
    );

    error.statusCode = 400;

    throw error;
  }

  /*
   * Verify location exists.
   */
  const location =
    await locationRepository.findById(
      locationId
    );

  if (!location) {
    const error = new Error(
      "Location not found."
    );

    error.statusCode = 400;

    throw error;
  }

  if (!location.is_active) {
    const error = new Error(
      "Cannot change stock at an inactive location."
    );

    error.statusCode = 400;

    throw error;
  }

  /*
   * Validate movement direction.
   */
  const incomingTypes = [
    "receipt",
    "transfer_in",
    "adjustment"
  ];

  const outgoingTypes = [
    "delivery",
    "transfer_out"
  ];

  let quantityChange =
    Number(quantity);

  /*
   * Receipt / transfer_in are positive.
   * Delivery / transfer_out are negative.
   *
   * Adjustment can be positive or negative.
   */

  if (
    incomingTypes.includes(
      movementType
    ) &&
    movementType !== "adjustment"
  ) {
    quantityChange =
      Math.abs(quantityChange);
  }

  if (
    outgoingTypes.includes(
      movementType
    )
  ) {
    quantityChange =
      -Math.abs(quantityChange);
  }

  if (
    movementType === "adjustment" &&
    quantityChange === 0
  ) {
    const error = new Error(
      "Adjustment cannot be zero."
    );

    error.statusCode = 400;

    throw error;
  }

  return repository.changeQuantity({
    productId,
    locationId,
    quantityChange,
    movementType,
    referenceType,
    referenceId,
    notes,
    userId
  });
}

async function getLedger(filters) {
  return repository.getLedger(
    filters
  );
}

module.exports = {
  listStock,
  getStock,
  changeStock,
  getLedger
};