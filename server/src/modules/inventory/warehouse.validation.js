function validateCreateWarehouse(body) {
  const name =
    String(body.name || "").trim();

  const code =
    String(body.code || "")
      .trim()
      .toUpperCase();

  const address =
    body.address === undefined ||
    body.address === null
      ? null
      : String(body.address).trim();

  if (!name) {
    throw new Error(
      "Warehouse name is required."
    );
  }

  if (name.length < 2) {
    throw new Error(
      "Warehouse name must be at least 2 characters."
    );
  }

  if (!code) {
    throw new Error(
      "Warehouse code is required."
    );
  }

  if (!/^[A-Z0-9][A-Z0-9_-]*$/.test(code)) {
    throw new Error(
      "Invalid warehouse code."
    );
  }

  return {
    name,
    code,
    address
  };
}

function validateUpdateWarehouse(body) {
  const data = {};

  if (body.name !== undefined) {
    const name =
      String(body.name).trim();

    if (!name) {
      throw new Error(
        "Warehouse name cannot be empty."
      );
    }

    data.name = name;
  }

  if (body.code !== undefined) {
    const code =
      String(body.code)
        .trim()
        .toUpperCase();

    if (!/^[A-Z0-9][A-Z0-9_-]*$/.test(code)) {
      throw new Error(
        "Invalid warehouse code."
      );
    }

    data.code = code;
  }

  if (body.address !== undefined) {
    data.address =
      body.address === null
        ? null
        : String(body.address).trim();
  }

  if (body.isActive !== undefined) {
    if (
      typeof body.isActive !== "boolean"
    ) {
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
  validateCreateWarehouse,
  validateUpdateWarehouse
};