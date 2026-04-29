import { verifyAccessToken } from "../utils/tokens.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../modules/users/user.model.js";

export const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiError(401, "Missing or malformed token");
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.sub).select("-passwordHash");
    if (!user || !user.isActive)
      throw new ApiError(401, "User not found or inactive");

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
