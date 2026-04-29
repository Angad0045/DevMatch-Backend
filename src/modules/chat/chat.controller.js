import { catchAsync } from "../../utils/catchAsync.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { chatService } from "./chat.service.js";

export const getMessages = catchAsync(async (req, res) => {
  const { matchId } = req.validatedParams;
  const { page, limit } = req.query;

  const result = await chatService.getMessages({
    matchId,
    userId: req.user._id,
    page,
    limit,
  });

  res.status(200).json(new ApiResponse(200, result, "Messages fetched"));
});

export const deleteMessage = catchAsync(async (req, res) => {
  await chatService.softDeleteMessage({
    messageId: req.validatedParams.messageId,
    userId: req.user._id,
  });

  res.status(200).json(new ApiResponse(200, null, "Message deleted"));
});
