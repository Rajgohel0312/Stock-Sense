function validateCreateAdjustment(body) {
  const errors = [];

  if (!body.warehouseId) {
    errors.push("warehouseId is required");
  }

  if (body.reason !== undefined && (typeof body.reason !== "string" || body.reason.length > 255)) {
    errors.push("reason must be a string of at most 255 characters");
  }

  return errors;
}

function validateAdjustmentItem(body) {
  const errors = [];

  if (!body.productId) {
    errors.push("productId is required");
  }

  if (!body.locationId) {
    errors.push("locationId is required");
  }

  const counted = Number(body.countedQuantity);
  if (!Number.isFinite(counted) || counted < 0) {
    errors.push("countedQuantity must be a number greater than or equal to 0");
  }

  return errors;
}

module.exports = {
  validateCreateAdjustment,
  validateAdjustmentItem,
};
