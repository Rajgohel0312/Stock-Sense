function validateReorderRule(body) {
  const productId = String(body.productId || "").trim();

  const locationId = body.locationId ? String(body.locationId).trim() : null;

  const minQuantity = Number(body.minQuantity);

  const maxQuantity = Number(body.maxQuantity);

  const reorderQuantity = Number(body.reorderQuantity);

  if (!productId) {
    throw new Error("Product is required.");
  }

  if (!Number.isFinite(minQuantity) || minQuantity < 0) {
    throw new Error("Minimum quantity must be a non-negative number.");
  }

  if (!Number.isFinite(maxQuantity) || maxQuantity <= 0) {
    throw new Error("Maximum quantity must be greater than zero.");
  }

  if (!Number.isFinite(reorderQuantity) || reorderQuantity <= 0) {
    throw new Error("Reorder quantity must be greater than zero.");
  }

  if (minQuantity >= maxQuantity) {
    throw new Error("Minimum quantity must be less than maximum quantity.");
  }

  return {
    productId,
    locationId,
    minQuantity,
    maxQuantity,
    reorderQuantity,
  };
}

function validateUpdateReorderRule(body) {
  const data = {};

  if (body.minQuantity !== undefined) {
    data.minQuantity = Number(body.minQuantity);
  }

  if (body.maxQuantity !== undefined) {
    data.maxQuantity = Number(body.maxQuantity);
  }

  if (body.reorderQuantity !== undefined) {
    data.reorderQuantity = Number(body.reorderQuantity);
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") {
      throw new Error("isActive must be boolean.");
    }

    data.isActive = body.isActive;
  }

  if (Object.keys(data).length === 0) {
    throw new Error("At least one field is required.");
  }

  if (
    data.minQuantity !== undefined &&
    (!Number.isFinite(data.minQuantity) || data.minQuantity < 0)
  ) {
    throw new Error("Invalid minimum quantity.");
  }

  if (
    data.maxQuantity !== undefined &&
    (!Number.isFinite(data.maxQuantity) || data.maxQuantity <= 0)
  ) {
    throw new Error("Invalid maximum quantity.");
  }

  if (
    data.reorderQuantity !== undefined &&
    (!Number.isFinite(data.reorderQuantity) || data.reorderQuantity <= 0)
  ) {
    throw new Error("Invalid reorder quantity.");
  }

  return data;
}

module.exports = {
  validateReorderRule,
  validateUpdateReorderRule,
};
