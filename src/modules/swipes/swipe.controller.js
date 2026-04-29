import { catchAsync } from "../../utils/catchAsync.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { createSwipe, getMySwipes } from "./swipe.service.js";

export const swipe = catchAsync(async (req, res) => {
  const { swipe, match } = await createSwipe(req.user._id, req.validatedBody);

  // Tell the client whether this swipe created a match.
  // Frontend uses this to trigger the "It's a match!" animation.
  const message = match ? "It's a match!" : "Swipe recorded";

  res.status(201).json(new ApiResponse(201, { swipe, match }, message));
});

export const mySwipes = catchAsync(async (req, res) => {
  const { direction } = req.query; // optional: ?direction=like
  const swipes = await getMySwipes(req.user._id, direction);

  res.status(200).json(new ApiResponse(200, { swipes }, "Swipes fetched"));
});
