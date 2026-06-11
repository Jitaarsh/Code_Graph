/**
 * Global Error Handler Middleware
 * Catches all unhandled errors and sends a structured JSON response
 *
 * Handles specific Mongoose/MongoDB error types:
 * - CastError: Invalid MongoDB ObjectId
 * - 11000: Duplicate key (e.g., duplicate email)
 * - ValidationError: Mongoose validation failures
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose bad ObjectId (CastError)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}. Please check the format.`;
  }

  // MongoDB duplicate key error (e.g., duplicate email)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue).join(", ");
    message = `Duplicate value entered for: ${field}. Please use a different value.`;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  // Log error in development
  if (process.env.NODE_ENV === "development") {
    console.error("🔴 Global Error Handler:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
