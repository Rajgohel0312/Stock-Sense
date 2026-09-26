function validateCreateCategory(body) {
  const name = String(body.name || "").trim();

  const description =
    body.description === undefined ||
    body.description === null
      ? null
      : String(body.description).trim();

  if (!name) {
    throw new Error("Category name is required.");
  }

  if (name.length < 2) {
    throw new Error(
      "Category name must be at least 2 characters."
    );
  }

  if (name.length > 100) {
    throw new Error(
      "Category name cannot exceed 100 characters."
    );
  }

  return {
    name,
    description
  };
}

function validateUpdateCategory(body) {
  const data = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();

    if (!name) {
      throw new Error(
        "Category name cannot be empty."
      );
    }

    data.name = name;
  }

  if (body.description !== undefined) {
    data.description =
      body.description === null
        ? null
        : String(body.description).trim();
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
  validateCreateCategory,
  validateUpdateCategory
};