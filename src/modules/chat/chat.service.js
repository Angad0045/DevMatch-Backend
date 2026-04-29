import { Message } from "./chat.model.js";
import { Match } from "../matches/match.model.js";
import { ApiError } from "../../utils/ApiError.js";

// Shared by both REST and Socket.io — single source of truth for DB operations
export const chatService = {
  // Called by Socket.io on every message:send event
  async saveMessage({ matchId, senderId, text }) {
    const message = await Message.create({
      matchId,
      sender: senderId,
      text,
    });

    // Keep the match's lastMessageAt current.
    // This powers "sort by recent activity" in the match list.
    await Match.findByIdAndUpdate(matchId, {
      lastMessageAt: message.createdAt,
    });

    return message;
  },

  // Called by REST GET /chat/:matchId/messages
  async getMessages({ matchId, userId, page = 1, limit = 30 }) {
    // Verify the requesting user is a participant in this match.
    // Without this check, any authenticated user could read any chat history.
    const match = await Match.findOne({
      _id: matchId,
      users: userId,
      isActive: true,
    });
    if (!match) throw new ApiError(404, "Match not found");

    const pageNum = Number(page);
    const limitNum = Math.min(Number(limit), 100); // cap — never unlimited
    const skip = (pageNum - 1) * limitNum;

    const [messages, total] = await Promise.all([
      Message.find({ matchId, deletedAt: null })
        .sort({ createdAt: -1 }) // newest first from DB
        .skip(skip)
        .limit(limitNum)
        .populate("sender", "profile.displayName profile.avatarUrl"),

      Message.countDocuments({ matchId, deletedAt: null }),
    ]);

    return {
      messages: messages.reverse(), // reverse to chronological for the client
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        hasMore: skip + messages.length < total,
      },
    };
  },

  // Called by Socket.io on message:read event
  async markAsRead({ messageId, userId }) {
    await Message.findByIdAndUpdate(messageId, {
      $addToSet: { readBy: userId }, // $addToSet prevents duplicate entries
    });
  },

  // Called by REST DELETE /chat/messages/:messageId
  async softDeleteMessage({ messageId, userId }) {
    // findOne with sender check — user can only delete their own messages
    const message = await Message.findOne({
      _id: messageId,
      sender: userId,
      deletedAt: null, // already deleted messages can't be deleted again
    });

    if (!message)
      throw new ApiError(404, "Message not found or already deleted");

    message.deletedAt = new Date();
    await message.save();
  },
};
