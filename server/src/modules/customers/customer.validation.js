function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const ALLOWED_TIERS = ["standard", "silver", "gold", "platinum"];

function validateCreateCustomer(body) {
  const errors = [];

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    errors.push("Name is required");
  }

  if (body.email !== undefined && body.email !== null && body.email !== "") {
    if (typeof body.email !== "string" || !isValidEmail(body.email)) {
      errors.push("Invalid email format");
    }
  }

  if (body.customer_tier !== undefined && body.customer_tier !== null) {
    const tier = String(body.customer_tier).toLowerCase();
    if (!ALLOWED_TIERS.includes(tier)) {
      errors.push(`Tier must be one of: ${ALLOWED_TIERS.join(", ")}`);
    }
  }

  if (body.currency !== undefined && body.currency !== null) {
    if (typeof body.currency !== "string" || !/^[A-Z]{3}$/.test(body.currency)) {
      errors.push("Currency must be 3 uppercase characters (e.g. USD, EUR)");
    }
  }

  return errors;
}

function validateUpdateCustomer(body) {
  const errors = [];
  const allowedFields = [
    "name",
    "email",
    "phone",
    "address",
    "customer_tier",
    "currency",
    "is_active",
  ];

  const providedKeys = Object.keys(body).filter((k) => allowedFields.includes(k));
  if (providedKeys.length === 0) {
    errors.push("At least one valid field must be provided for update");
  }

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      errors.push("Name cannot be empty");
    }
  }

  if (body.email !== undefined && body.email !== null && body.email !== "") {
    if (typeof body.email !== "string" || !isValidEmail(body.email)) {
      errors.push("Invalid email format");
    }
  }

  if (body.customer_tier !== undefined && body.customer_tier !== null) {
    const tier = String(body.customer_tier).toLowerCase();
    if (!ALLOWED_TIERS.includes(tier)) {
      errors.push(`Tier must be one of: ${ALLOWED_TIERS.join(", ")}`);
    }
  }

  if (body.currency !== undefined && body.currency !== null) {
    if (typeof body.currency !== "string" || !/^[A-Z]{3}$/.test(body.currency)) {
      errors.push("Currency must be 3 uppercase characters (e.g. USD, EUR)");
    }
  }

  if (body.is_active !== undefined) {
    if (typeof body.is_active !== "boolean") {
      errors.push("is_active must be a boolean");
    }
  }

  return errors;
}

module.exports = {
  ALLOWED_TIERS,
  validateCreateCustomer,
  validateUpdateCustomer,
};
