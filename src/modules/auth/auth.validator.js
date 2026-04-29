import { z } from "zod";
import { ApiError } from "../../utils/ApiError.js";

const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errorDetails = result.error?.issues || result.error?.errors || [];

    const errors = errorDetails.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return next(new ApiError(400, "Validation failed", errors));
  }
  req.validatedBody = result.data; // clean, type-safe data — never touch req.body after this
  next();
};

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  displayName: z.string().min(2, "Display name too short").max(50).trim(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const validateRegister = validate(registerSchema);
export const validateLogin = validate(loginSchema);
