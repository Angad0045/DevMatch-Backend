import { Match } from "./match.model.js";
import { ApiError } from "../../utils/ApiError.js";

export const getMyMatches = async (userId) => {
  const matches = await Match.find({
    users: userId, // $in not needed — querying an array field
    isActive: true,
  })
    .populate("users", "profile intent") // attach both participants' public profiles
    .sort({ lastMessageAt: -1, createdAt: -1 }); // most recently active first
  // If lastMessageAt is null (no messages yet), fall back to createdAt

  // Remove the current user from the users array so the
  // client receives "the other person" directly — no filtering needed on frontend
  return matches.map((match) => {
    const matchObj = match.toObject();
    matchObj.otherUser = matchObj.users.find(
      (u) => u._id.toString() !== userId.toString(),
    );
    delete matchObj.users; // client doesn't need the full array
    return matchObj;
  });
};

export const getMatchById = async (matchId, userId) => {
  const match = await Match.findOne({
    _id: matchId,
    users: userId, // ownership check — user must be a participant
    isActive: true,
  }).populate("users", "profile intent createdAt");

  if (!match) throw new ApiError(404, "Match not found");
  return match;
};

export const unmatch = async (matchId, userId) => {
  const match = await Match.findOne({
    _id: matchId,
    users: userId, // only participants can unmatch
    isActive: true,
  });

  if (!match) throw new ApiError(404, "Match not found");

  // Soft delete — keep the document for data integrity.
  // Messages reference this matchId. Hard deleting would orphan them.
  match.isActive = false;
  await match.save();
};
