import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

export const signAccessToken = (userId) =>
  jwt.sign({ sub: userId, type: "access" }, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRY,
    algorithm: "HS256",
  });

export const signRefreshToken = (userId) =>
  jwt.sign({ sub: userId, type: "refresh" }, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRY,
    algorithm: "HS256",
  });

export const verifyAccessToken = (token) =>
  jwt.verify(token, config.JWT_ACCESS_SECRET);

export const verifyRefreshToken = (token) =>
  jwt.verify(token, config.JWT_REFRESH_SECRET);
