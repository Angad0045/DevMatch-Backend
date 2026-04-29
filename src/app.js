import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";
import { config } from "./config/index.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { ApiError } from "./utils/ApiError.js";

const app = express();

// Security
app.use(helmet());

app.use(
  cors({
    origin: config.CLIENT_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// Sanitization
app.use((req, _res, next) => {
  req.body = mongoSanitize.sanitize(req.body);
  req.params = mongoSanitize.sanitize(req.params);
  next();
});
// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many auth attempts, try again in an hour.",
  },
});

app.use("/api", globalLimiter);
// app.use("/api/v1/auth", authLimiter);

// Health check
app.get("/health", (_req, res) => {
  res
    .status(200)
    .json({ status: "ok", env: config.NODE_ENV, timestamp: new Date() });
});

// Routes
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import feedRoutes from "./modules/feed/feed.routes.js";
import swipeRoutes from "./modules/swipes/swipe.routes.js";
import matchRoutes from "./modules/matches/match.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/feed", feedRoutes);
app.use("/api/v1/swipes", swipeRoutes);
app.use("/api/v1/matches", matchRoutes);
app.use("/api/v1/chat", chatRoutes);

// 404 catch-all
app.use((_req, _res, next) => {
  next(new ApiError(404, "Route not found"));
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
