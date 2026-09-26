function validateCreateReceipt(body) {
  const errors = [];

  if (!body.supplierId) {
    errors.push("supplierId is required");
  }

  if (!body.warehouseId) {
    errors.push("warehouseId is required");
  }


  if (body.referenceNumber !== undefined) {
    if (
      typeof body.referenceNumber !== "string" ||
      body.referenceNumber.length > 100
    ) {
      errors.push("referenceNumber is invalid");
    }
  }

  return errors;
}

function validateReceiptItem(body) {
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

  return errors;
}

module.exports = {
  validateCreateReceipt,
  validateReceiptItem
};