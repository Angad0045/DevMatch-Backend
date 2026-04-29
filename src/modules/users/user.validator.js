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

// All fields optional — user can update any subset of their profile
// .strict() rejects any keys not defined in the schema — blocks mass assignment
const updateProfileSchema = z
  .object({
    displayName: z.string().min(2).max(50).trim().optional(),
    bio: z.string().max(500).trim().optional(),
    avatarUrl: z.string().url("Invalid avatar URL").optional(),
    githubHandle: z
      .string()
      .regex(/^[a-zA-Z0-9-]+$/, "Invalid GitHub handle")
      .max(39)
      .optional(),
    skills: z
      .array(z.string().toLowerCase().trim())
      .max(20, "Maximum 20 skills allowed")
      .optional(),
    experienceLevel: z
      .enum(["junior", "mid", "senior", "principal"])
      .optional(),
    timezone: z.string().optional(),
    intent: z
      .array(z.enum(["mentorship", "collaboration", "opensource", "learning"]))
      .min(1, "Select at least one intent")
      .optional(),
  })
  .strict(); // ← rejects unknown keys entirely

export const validateUpdateProfile = validate(updateProfileSchema);
