function validateCreateReservation(body) {
  const errors = [];

  if (!body.productId) {
    errors.push("productId is required");
  }

  if (!body.locationId) {
    errors.push("locationId is required");
  }

  const quantity = Number(body.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    errors.push("quantity must be greater than 0");
  }

  if (
    body.referenceType !== undefined &&
    (typeof body.referenceType !== "string" || body.referenceType.length > 50)
  ) {
    errors.push("referenceType must be a string of at most 50 characters");
  }

  return errors;
}

module.exports = {
  validateCreateReservation,
};
