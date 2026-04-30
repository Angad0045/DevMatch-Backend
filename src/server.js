import app from "./app.js";
import { connectDB } from "./config/db.js";

try {
  await connectDB();
} catch (err) {
  console.error(
    "Startup DB connection failed — requests will fail until resolved",
  );
}

export default app;
