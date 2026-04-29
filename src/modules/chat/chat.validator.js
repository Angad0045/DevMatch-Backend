// src/modules/chat/chat.validator.js
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

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID");

export const validateMatchId = validateParams(z.object({ matchId: objectId }));

export const validateMessageId = validateParams(
  z.object({ messageId: objectId }),
);
