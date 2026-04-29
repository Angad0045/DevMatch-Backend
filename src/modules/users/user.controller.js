import { catchAsync } from "../../utils/catchAsync.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { getMe, updateMe, deleteMe } from "./user.service.js";

export const getMyProfile = catchAsync(async (req, res) => {
  const user = await getMe(req.user._id);
  res.status(200).json(new ApiResponse(200, { user }, "Profile fetched"));
});

export const updateMyProfile = catchAsync(async (req, res) => {
  const user = await updateMe(req.user._id, req.validatedBody);
  res.status(200).json(new ApiResponse(200, { user }, "Profile updated"));
});

export const deleteMyAccount = catchAsync(async (req, res) => {
  await deleteMe(req.user._id);

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });

  res
    .status(200)
    .json(new ApiResponse(200, null, "Account deactivated successfully"));
});
