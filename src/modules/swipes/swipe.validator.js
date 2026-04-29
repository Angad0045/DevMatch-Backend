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
  req.validatedBody = result.data;
  next();
};

const swipeSchema = z.object({
  swipedId: z.string().min(1, "swipedId is required"),
  direction: z.enum(["like", "pass"], {
    errorMap: () => ({ message: "direction must be like or pass" }),
  }),
  intent: z.enum(["mentorship", "collaboration", "opensource", "learning"], {
    errorMap: () => ({ message: "Invalid intent value" }),
  }),
});

export const validateSwipe = validate(swipeSchema);
