import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Soft delete — never hard delete messages.
    // If sender deletes a message, set this timestamp.
    // Queries filter deletedAt: null. The document stays for audit/moderation.
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// All message history queries filter by matchId and sort by time.
// This compound index covers both in one scan.
messageSchema.index({ matchId: 1, createdAt: -1 });

export const Message = mongoose.model("Message", messageSchema);
