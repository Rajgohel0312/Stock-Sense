function validateCreateProduct(body) {
  const name =
    String(body.name || "").trim();

  const sku =
    String(body.sku || "")
      .trim()
      .toUpperCase();

  const description =
    body.description === undefined ||
    body.description === null
      ? null
      : String(body.description).trim();

  const categoryId =
    String(body.categoryId || "").trim();

  const uomId =
    String(body.uomId || "").trim();

  if (!name) {
    throw new Error(
      "Product name is required."
    );
  }

  if (name.length < 2) {
    throw new Error(
      "Product name must be at least 2 characters."
    );
  }

  if (!sku) {
    throw new Error(
      "SKU is required."
    );
  }

  if (!/^[A-Z0-9][A-Z0-9._-]*$/.test(sku)) {
    throw new Error(
      "SKU contains invalid characters."
    );
  }

  if (!categoryId) {
    throw new Error(
      "Category is required."
    );
  }

  if (!uomId) {
    throw new Error(
      "Unit of measure is required."
    );
  }

  return {
    name,
    sku,
    description,
    categoryId,
    uomId
  };
}

function validateUpdateProduct(body) {
  const data = {};

  if (body.name !== undefined) {
    const name =
      String(body.name).trim();

    if (!name) {
      throw new Error(
        "Product name cannot be empty."
      );
    }

    data.name = name;
  }

  if (body.sku !== undefined) {
    const sku =
      String(body.sku)
        .trim()
        .toUpperCase();

    if (!/^[A-Z0-9][A-Z0-9._-]*$/.test(sku)) {
      throw new Error(
        "SKU contains invalid characters."
      );
    }

    data.sku = sku;
  }

  if (body.description !== undefined) {
    data.description =
      body.description === null
        ? null
        : String(body.description).trim();
  }

  if (body.categoryId !== undefined) {
    data.categoryId =
      String(body.categoryId).trim();

    if (!data.categoryId) {
      throw new Error(
        "Category cannot be empty."
      );
    }
  }

  if (body.uomId !== undefined) {
    data.uomId =
      String(body.uomId).trim();

    if (!data.uomId) {
      throw new Error(
        "Unit of measure cannot be empty."
      );
    }
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") {
      throw new Error(
        "isActive must be boolean."
      );
    }

    data.isActive = body.isActive;
  }

  if (Object.keys(data).length === 0) {
    throw new Error(
      "At least one field is required."
    );
  }

  return data;
}

module.exports = {
  validateCreateProduct,
  validateUpdateProduct
};