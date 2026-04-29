import mongoose from "mongoose";

const swipeSchema = new mongoose.Schema(
  {
    swiper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    swiped: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    direction: { type: String, enum: ["like", "pass"], required: true },
    intent: {
      type: String,
      enum: ["mentorship", "collaboration", "opensource", "learning"],
      required: true,
    },
  },
  { timestamps: true },
);

// Prevents the same user swiping the same person twice.
// This is enforced at DB level — not just application level.
// If a duplicate insert is attempted, MongoDB throws error code 11000,

swipeSchema.index({ swiper: 1, swiped: 1 }, { unique: true });

// Powers the mutual-like check in swipe service:
// "did this person already like me back?"
swipeSchema.index({ swiped: 1, direction: 1 });

export const Swipe = mongoose.model("Swipe", swipeSchema);
