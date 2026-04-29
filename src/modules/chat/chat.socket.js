import { chatService } from "./chat.service.js";
import { Match } from "../matches/match.model.js";

export const initChatSocket = (io) => {
  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();

    socket.on("join:match", async ({ matchId }) => {
      try {
        const match = await Match.findOne({
          _id: matchId,
          users: userId,
          isActive: true,
        });

        if (!match) {
          return socket.emit("error", {
            message: "Match not found or access denied",
          });
        }

        socket.join(`match:${matchId}`);
        socket.emit("join:match:ack", { matchId });
      } catch {
        socket.emit("error", { message: "Failed to join match" });
      }
    });

    socket.on("leave:match", ({ matchId }) => {
      socket.leave(`match:${matchId}`);
    });

    // Send a message
    socket.on("message:send", async ({ matchId, text }) => {
      try {
        // Validate text — don't process empty messages
        if (!text?.trim()) {
          return socket.emit("error", { message: "Message cannot be empty" });
        }

        if (text.trim().length > 2000) {
          return socket.emit("error", { message: "Message too long" });
        }

        const rooms = [...socket.rooms];
        if (!rooms.includes(`match:${matchId}`)) {
          return socket.emit("error", { message: "Join the match room first" });
        }

        const message = await chatService.saveMessage({
          matchId,
          senderId: userId,
          text: text.trim(),
        });

        io.to(`match:${matchId}`).emit("message:new", {
          _id: message._id,
          matchId,
          sender: {
            _id: userId,
            displayName: socket.user.profile.displayName,
            avatarUrl: socket.user.profile.avatarUrl,
          },
          text: message.text,
          readBy: message.readBy,
          createdAt: message.createdAt,
        });
      } catch {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("typing:start", ({ matchId }) => {
      socket.to(`match:${matchId}`).emit("typing:start", {
        userId,
        displayName: socket.user.profile.displayName,
      });
    });

    socket.on("typing:stop", ({ matchId }) => {
      socket.to(`match:${matchId}`).emit("typing:stop", { userId });
    });

    socket.on("message:read", async ({ matchId, messageId }) => {
      try {
        await chatService.markAsRead({ messageId, userId });

        socket.to(`match:${matchId}`).emit("message:read", {
          messageId,
          userId,
        });
      } catch {
        socket.emit("error", { message: "Failed to mark message as read" });
      }
    });

    socket.broadcast.emit("user:online", { userId });

    socket.on("disconnect", () => {
      socket.broadcast.emit("user:offline", { userId });
    });
  });
};
