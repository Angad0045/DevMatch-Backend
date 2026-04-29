import app from "./app.js";
import { Server } from "socket.io";
import { createServer } from "http";
import { connectDB } from "./config/db.js";
import { config } from "./config/index.js";
import { User } from "./modules/users/user.model.js";
import { verifyAccessToken } from "./utils/tokens.js";
import { initChatSocket } from "./modules/chat/chat.socket.js";

const startServer = async () => {
  await connectDB();

  // Wrap Express in an HTTP server so Socket.io can share the same port
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: config.CLIENT_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Runs once per connection — before any event handlers.
  // Rejects unauthenticated sockets before they enter the event loop.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));

      const payload = verifyAccessToken(token);

      const user = await User.findById(payload.sub).select(
        "_id profile.displayName profile.avatarUrl isActive",
      );

      if (!user || !user.isActive) return next(new Error("User not found"));

      socket.user = user; // Available as socket.user in all event handlers
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  initChatSocket(io);

  // httpServer instead of app.listen — both REST and WS on the same port
  httpServer.listen(config.PORT, () => {
    console.log(
      `🚀 Server running on port ${config.PORT} [${config.NODE_ENV}]`,
    );
    console.log(`🔌 Socket.io ready`);
  });
};

startServer();
