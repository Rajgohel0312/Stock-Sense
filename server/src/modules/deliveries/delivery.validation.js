function validateCreateDelivery(body) {
  const errors = [];

  if (!body.customerId && !body.customer_id) {
    errors.push("customerId is required");
  }

  if (!body.warehouseId && !body.warehouse_id) {
    errors.push("warehouseId is required");
  }

  if (
    body.referenceNumber !== undefined &&
    (
      typeof body.referenceNumber !== "string" ||
      body.referenceNumber.length > 100
    )
  ) {
    errors.push("referenceNumber is invalid");
  }

  return errors;
}

function validateDeliveryItem(body) {
  const errors = [];

  if (!body.productId) {
    errors.push("productId is required");
  }

  const quantity = Number(body.quantity);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    errors.push("quantity must be greater than 0");
  }

  return errors;
}

module.exports = {
  validateCreateDelivery,
  validateDeliveryItem
};