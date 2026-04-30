import mongoose from "mongoose";
import { config } from "./index.js";

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(config.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log(`✅ MongoDB connected :${conn.connection.host}`);

    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed (SIGINT)");
      process.exit(0);
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    throw err;
  }
};
