const MOVEMENT_TYPES = [
  "receipt",
  "delivery",
  "transfer_in",
  "transfer_out",
  "adjustment"
];

function validateStockChange(body) {
  const productId =
    String(body.productId || "").trim();

  const locationId =
    String(body.locationId || "").trim();

  const quantity =
    Number(body.quantity);

  const movementType =
    String(body.movementType || "")
      .trim();

  const notes =
    body.notes === undefined ||
    body.notes === null
      ? null
      : String(body.notes).trim();

  if (!productId) {
    throw new Error(
      "Product is required."
    );
  }

  if (!locationId) {
    throw new Error(
      "Location is required."
    );
  }

  if (
    !Number.isFinite(quantity) ||
    quantity === 0
  ) {
    throw new Error(
      "Quantity must be a non-zero number."
    );
  }

  if (
    !MOVEMENT_TYPES.includes(
      movementType
    )
  ) {
    throw new Error(
      "Invalid movement type."
    );
  }

  return {
    productId,
    locationId,
    quantity,
    movementType,
    notes
  };
}

module.exports = {
  validateStockChange
};