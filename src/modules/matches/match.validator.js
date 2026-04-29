import { z } from "zod";
import { ApiError } from "../../utils/ApiError.js";

const validateParams = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.params);
  if (!result.success) {
    const errorDetails = result.error?.issues || result.error?.errors || [];

    const errors = errorDetails.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return next(new ApiError(400, "Invalid parameters", errors));
  }
  req.validatedParams = result.data;
  next();
};

// MongoDB ObjectId is a 24-character hex string.
// Validating this format before it hits Mongoose prevents
// CastError crashes when garbage like "abc" is passed as an id.
const objectIdSchema = z.object({
  matchId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid match ID"),
});

export const validateMatchId = validateParams(objectIdSchema);
