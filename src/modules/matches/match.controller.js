import { catchAsync } from "../../utils/catchAsync.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { getMyMatches, getMatchById, unmatch } from "./match.service.js";

export const listMatches = catchAsync(async (req, res) => {
  const matches = await getMyMatches(req.user._id);
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { matches, total: matches.length },
        "Matches fetched",
      ),
    );
});

export const matchDetail = catchAsync(async (req, res) => {
  const match = await getMatchById(req.validatedParams.matchId, req.user._id);
  res.status(200).json(new ApiResponse(200, { match }, "Match fetched"));
});

export const deleteMatch = catchAsync(async (req, res) => {
  await unmatch(req.validatedParams.matchId, req.user._id);
  res.status(200).json(new ApiResponse(200, null, "Unmatched successfully"));
});
