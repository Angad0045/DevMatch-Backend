import { z } from "zod";
import { ApiError } from "../../utils/ApiError.js";

const validateQuery = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const errorDetails = result.error?.issues || result.error?.errors || [];

    const errors = errorDetails.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return next(new ApiError(400, "Invalid query parameters", errors));
  }
  req.validatedQuery = result.data; // use req.validatedQuery, not req.query
  next();
};

const feedQuerySchema = z.object({
  intent: z
    .enum(["mentorship", "collaboration", "opensource", "learning"])
    .optional(),

  // Skills arrive as a comma-separated string: ?skills=react,node,mongodb
  // We split in the service — keeping the URL clean
  skills: z.string().optional(),

  experienceLevel: z.enum(["junior", "mid", "senior", "principal"]).optional(),

  // Query params are always strings — coerce to number in service
  page: z
    .string()
    .regex(/^\d+$/, "Page must be a positive integer")
    .default("1"),

  limit: z
    .string()
    .regex(/^\d+$/, "Limit must be a positive integer")
    .default("10"),
});

export const validateFeedQuery = validateQuery(feedQuerySchema);
