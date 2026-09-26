function validateCreateTransfer(body) {
  const errors = [];

  const sourceWh = body.sourceWarehouseId || body.source_warehouse_id;
  const destWh =
    body.destinationWarehouseId ||
    body.destWarehouseId ||
    body.destination_warehouse_id ||
    body.dest_warehouse_id;

  if (!sourceWh) {
    errors.push("sourceWarehouseId is required");
  }

  if (!destWh) {
    errors.push("destinationWarehouseId is required");
  }

  if (
    body.referenceNumber !== undefined &&
    (typeof body.referenceNumber !== "string" || body.referenceNumber.length > 100)
  ) {
    errors.push("referenceNumber is invalid");
  }

  return errors;
}

function validateTransferItem(body, header = {}) {
  const errors = [];

  if (!body.productId) {
    errors.push("productId is required");
  }

  const quantity = Number(body.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    errors.push("quantity must be greater than 0");
  }

  const sourceLoc =
    body.sourceLocationId ||
    body.source_location_id ||
    header.source_location_id;
  const destLoc =
    body.destinationLocationId ||
    body.destLocationId ||
    body.destination_location_id ||
    body.dest_location_id ||
    header.destination_location_id;

  if (!sourceLoc) {
    errors.push("sourceLocationId is required on item or transfer header");
  }

  if (!destLoc) {
    errors.push("destinationLocationId is required on item or transfer header");
  }

  if (sourceLoc && destLoc && sourceLoc === destLoc) {
    errors.push("sourceLocationId and destinationLocationId cannot be the same");
  }

  return errors;
}

module.exports = {
  validateCreateTransfer,
  validateTransferItem,
};
