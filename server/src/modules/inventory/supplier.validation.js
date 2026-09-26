function validateSupplier(body) {
  const name =
    String(body.name || "").trim();

  const email =
    body.email
      ? String(body.email)
          .trim()
          .toLowerCase()
      : null;

  const phone =
    body.phone
      ? String(body.phone).trim()
      : null;

  const address =
    body.address
      ? String(body.address).trim()
      : null;

  if (!name) {
    throw new Error(
      "Supplier name is required."
    );
  }

  if (
    email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new Error(
      "Invalid supplier email."
    );
  }

  return {
    name,
    email,
    phone,
    address
  };
}

function validateSupplierUpdate(body) {
  const data = {};

  if (body.name !== undefined) {
    const name =
      String(body.name).trim();

    if (!name) {
      throw new Error(
        "Supplier name cannot be empty."
      );
    }

    data.name = name;
  }

  if (body.email !== undefined) {
    const email =
      body.email === null
        ? null
        : String(body.email)
            .trim()
            .toLowerCase();

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      throw new Error(
        "Invalid supplier email."
      );
    }

    data.email = email;
  }

  if (body.phone !== undefined) {
    data.phone =
      body.phone === null
        ? null
        : String(body.phone).trim();
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
  validateSupplier,
  validateSupplierUpdate
};