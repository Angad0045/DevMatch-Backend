import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    users: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],

    intent: {
      type: String,
      enum: ["mentorship", "collaboration", "opensource", "learning"],
      required: true,
    },

    isActive: { type: Boolean, default: true },

    // Updated every time a chat message is sent.
    // Powers "sort matches by most recent activity" in the matches list.
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// The most common query: "give me all matches for user X"
matchSchema.index({ users: 1 });
matchSchema.index({ users: 1, isActive: 1 });

export const Match = mongoose.model("Match", matchSchema);
