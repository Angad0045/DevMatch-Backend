import { User } from "./user.model.js";
import { ApiError } from "../../utils/ApiError.js";

export const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

export const updateMe = async (userId, updates) => {
  const flatUpdates = {};

  const topLevelFields = ["intent"];
  const profileFields = [
    "displayName",
    "bio",
    "avatarUrl",
    "githubHandle",
    "skills",
    "experienceLevel",
    "timezone",
  ];

  for (const key of topLevelFields) {
    if (updates[key] !== undefined) {
      flatUpdates[key] = updates[key];
    }
  }

  for (const key of profileFields) {
    if (updates[key] !== undefined) {
      flatUpdates[`profile.${key}`] = updates[key];
    }
  }

  if (Object.keys(flatUpdates).length === 0) {
    throw new ApiError(400, "No valid fields provided for update");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: flatUpdates },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!user) throw new ApiError(404, "User not found");
  return user;
};

export const deleteMe = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      isActive: false,
      refreshTokenHash: null,
      email: `deleted_${userId}@devmatch.io`,
    },
    { new: true },
  );

  if (!user) throw new ApiError(404, "User not found");
};
