import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import { config } from "./config/index.js";
import { User } from "./modules/users/user.model.js";
import { verifyAccessToken } from "./utils/tokens.js";
import { initChatSocket } from "./modules/chat/chat.socket.js";

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: config.CLIENT_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));

    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.sub).select(
      "_id profile.displayName profile.avatarUrl isActive",
    );

    if (!user || !user.isActive) return next(new Error("User not found"));

    socket.user = user;
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
});

connectDB().then(() => {
  initChatSocket(io);

  httpServer.listen(config.PORT, () => {
    console.log(
      `🔌 Socket server running on port ${config.PORT} [${config.NODE_ENV}]`,
    );
  });
});
