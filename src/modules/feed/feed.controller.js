import { catchAsync } from "../../utils/catchAsync.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { getFeed } from "./feed.service.js";

export const feed = catchAsync(async (req, res) => {
  const { users, pagination } = await getFeed(req.user._id, req.validatedQuery);

  res
    .status(200)
    .json(
      new ApiResponse(200, { users, pagination }, "Feed fetched successfully"),
    );
});
