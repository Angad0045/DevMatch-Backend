// src/middleware/error.middleware.js
import { config } from "../config/index.js";

export const errorHandler = (err, req, res, _next) => {
  // Mongoose: field-level validation failures
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res
      .status(400)
      .json({ success: false, message: "Validation failed", errors });
  }

  // Mongoose: duplicate key (email already exists, etc.)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res
      .status(409)
      .json({ success: false, message: `${field} already exists` });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }

  // Our own ApiError — safe to expose
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  // Unhandled programmer error — never leak details in production
  console.error("UNHANDLED ERROR:", err); // temporary until you want a logging strategy
  return res.status(500).json({
    success: false,
    message:
      config.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
};
