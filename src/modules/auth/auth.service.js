import { User } from "../users/user.model.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
} from "../../utils/tokens.js";
import bcrypt from "bcryptjs";

export const registerUser = async ({ email, password, displayName }) => {
  // Service checks DB-level uniqueness explicitly for a clean error message.
  // The unique index on the schema is the hard guarantee — this is for UX.
  const existingUser = await User.findOne({ email });
  if (existingUser)
    throw new ApiError(409, "An account with this email already exists");

  // Pass plaintext — the pre-save hook handles hashing.
  // Never hash here. The model owns that responsibility.
  const user = await User.create({
    email,
    passwordHash: password, // pre-save hook will bcrypt this
    profile: { displayName },
  });

  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  // Store a hash of the refresh token — never the raw token.
  // This lets us invalidate it on logout without exposing it if the DB leaks.
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await user.save();

  return { user, accessToken, refreshToken };
};

export const loginUser = async ({ email, password }) => {
  // +passwordHash because select: false hides it by default
  const user = await User.findOne({ email }).select(
    "+passwordHash +refreshTokenHash",
  );

  // Always run comparePassword even if user not found.
  // This prevents timing attacks — an attacker can't tell which check failed.
  const dummyHash =
    "$2b$12$invalidhashpaddingtomakeittaketime.................";
  const passwordToCheck = user ? user.passwordHash : dummyHash;
  const isMatch = await bcrypt.compare(password, passwordToCheck);

  // Same error message regardless of which check failed — prevents email enumeration
  if (!user || !isMatch) throw new ApiError(401, "Invalid credentials");

  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  user.lastSeenAt = new Date();
  await user.save();

  return { user, accessToken, refreshToken };
};

export const refreshAccessToken = async (rawRefreshToken) => {
  if (!rawRefreshToken) throw new ApiError(401, "No refresh token provided");

  // Verify the token is structurally valid and not expired
  let payload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  // Find user and load the stored hash — select: false by default
  const user = await User.findById(payload.sub).select("+refreshTokenHash");
  if (!user || !user.refreshTokenHash) {
    throw new ApiError(401, "Session expired. Please log in again.");
  }

  // Compare the incoming raw token against the stored hash
  const isValid = await bcrypt.compare(rawRefreshToken, user.refreshTokenHash);
  if (!isValid) throw new ApiError(401, "Invalid refresh token");

  // Issue a new access token
  const newAccessToken = signAccessToken(user._id);

  // Rotate the refresh token — old one is now invalidated
  const newRefreshToken = signRefreshToken(user._id);
  user.refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
  await user.save();

  return { accessToken: newAccessToken, newRefreshToken };
};

export const logoutUser = async (userId) => {
  // Wipe the refresh token hash — the cookie removal is done in the controller.
  // Even if someone kept a copy of the refresh token, it can't be used anymore.
  await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
};
