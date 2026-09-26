const LOCATION_TYPES = [
  "internal",
  "receiving",
  "shipping",
  "production",
  "damaged"
];

function validateCreateLocation(body) {
  const warehouseId =
    String(body.warehouseId || "").trim();

  const parentLocationId =
    body.parentLocationId
      ? String(body.parentLocationId).trim()
      : null;

  const name =
    String(body.name || "").trim();

  const code =
    String(body.code || "")
      .trim()
      .toUpperCase();

  const locationType =
    String(body.locationType || "internal")
      .trim()
      .toLowerCase();

  if (!warehouseId) {
    throw new Error(
      "Warehouse is required."
    );
  }

  if (!name) {
    throw new Error(
      "Location name is required."
    );
  }

  if (!code) {
    throw new Error(
      "Location code is required."
    );
  }

  if (!/^[A-Z0-9][A-Z0-9._-]*$/.test(code)) {
    throw new Error(
      "Invalid location code."
    );
  }

  if (!LOCATION_TYPES.includes(locationType)) {
    throw new Error(
      `Invalid location type. Allowed: ${LOCATION_TYPES.join(", ")}`
    );
  }

  return {
    warehouseId,
    parentLocationId,
    name,
    code,
    locationType
  };
}

function validateUpdateLocation(body) {
  const data = {};

  if (body.parentLocationId !== undefined) {
    data.parentLocationId =
      body.parentLocationId === null
        ? null
        : String(body.parentLocationId).trim();
  }

  if (body.name !== undefined) {
    const name =
      String(body.name).trim();

    if (!name) {
      throw new Error(
        "Location name cannot be empty."
      );
    }

    data.name = name;
  }

  if (body.code !== undefined) {
    const code =
      String(body.code)
        .trim()
        .toUpperCase();

    if (!/^[A-Z0-9][A-Z0-9._-]*$/.test(code)) {
      throw new Error(
        "Invalid location code."
      );
    }

    data.code = code;
  }

  if (body.locationType !== undefined) {
    const locationType =
      String(body.locationType)
        .trim()
        .toLowerCase();

    if (!LOCATION_TYPES.includes(locationType)) {
      throw new Error(
        "Invalid location type."
      );
    }

    data.locationType =
      locationType;
  }

  if (body.isActive !== undefined) {
    if (
      typeof body.isActive !== "boolean"
    ) {
      throw new Error(
        "isActive must be boolean."
      );
    }

    data.isActive =
      body.isActive;
  }

  if (Object.keys(data).length === 0) {
    throw new Error(
      "At least one field is required."
    );
  }

  return data;
}

module.exports = {
  validateCreateLocation,
  validateUpdateLocation
};