// src/modules/auth/auth.controller.js
import { catchAsync } from "../../utils/catchAsync.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
} from "./auth.service.js";
import { config } from "../../config/index.js";

// Cookie config in one place — reused for both register and login
const refreshTokenCookieOptions = {
  httpOnly: true, // JS cannot read it
  secure: config.NODE_ENV === "production", // HTTPS only in prod
  sameSite: "Strict", // No cross-site requests
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

export const register = catchAsync(async (req, res) => {
  const { user, accessToken, refreshToken } = await registerUser(
    req.validatedBody,
  );

  res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { user, accessToken },
        "Account created successfully",
      ),
    );
});

export const login = catchAsync(async (req, res) => {
  const { user, accessToken, refreshToken } = await loginUser(
    req.validatedBody,
  );

  res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

  res
    .status(200)
    .json(new ApiResponse(200, { user, accessToken }, "Login successful"));
});

export const refresh = catchAsync(async (req, res) => {
  // The httpOnly cookie is read here — not the Authorization header
  const rawRefreshToken = req.cookies?.refreshToken;

  const { accessToken, newRefreshToken } =
    await refreshAccessToken(rawRefreshToken);

  // Re-set the rotated refresh token cookie
  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res
    .status(200)
    .json(new ApiResponse(200, { accessToken }, "Token refreshed"));
});

export const logout = catchAsync(async (req, res) => {
  // req.user is set by the authenticate middleware on protected routes
  await logoutUser(req.user._id);

  res.clearCookie("refreshToken", refreshTokenCookieOptions);

  res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
});
