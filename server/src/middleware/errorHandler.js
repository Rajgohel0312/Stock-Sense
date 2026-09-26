function errorHandler(error, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`);
  console.error(error);

  /*
  | PostgreSQL unique violation
  */
  if (error.code === "23505") {
    return res.status(409).json({
      success: false,
      message: "A record with the same unique value already exists.",
    });
  }

  /*
  | PostgreSQL foreign key violation
  */
  if (error.code === "23503") {
    return res.status(409).json({
      success: false,
      message: "This operation violates a related record constraint.",
    });
  }

  /*
  | PostgreSQL check constraint
  */
  if (error.code === "23514") {
    return res.status(400).json({
      success: false,
      message: "The supplied data violates a database rule.",
    });
  }

  /*
  | PostgreSQL invalid UUID syntax
  */
  if (error.code === "22P02") {
    return res.status(400).json({
      success: false,
      message: "Invalid identifier format.",
    });
  }

  /*
  | Application error
  */
  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    message: statusCode === 500 ? "Internal server error." : error.message,
  };

  if (error.errors && Array.isArray(error.errors)) {
    response.errors = error.errors;
  }

  return res.status(statusCode).json(response);
}

module.exports = {
  errorHandler,
};