import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (val) => validator.isEmail(val),
        message: "Please provide a valid email",
      },
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    refreshTokenHash: {
      type: String,
      select: false,
      default: null,
    },
    profile: {
      displayName: {
        type: String,
        required: [true, "Display name is required"],
        trim: true,
      },
      bio: { type: String, maxlength: 500 },
      avatarUrl: String,
      githubHandle: String,
      skills: [{ type: String, lowercase: true, trim: true }],
      experienceLevel: {
        type: String,
        enum: ["junior", "mid", "senior", "principal"],
      },
      timezone: String,
    },
    intent: [
      {
        type: String,
        enum: ["mentorship", "collaboration", "opensource", "learning"],
      },
    ],
    isActive: { type: Boolean, default: true },
    lastSeenAt: Date,
  },
  { timestamps: true },
);
// ── Indexes
userSchema.index({ "profile.skills": 1 });
userSchema.index({ intent: 1 });
userSchema.index({ isActive: 1, updatedAt: -1 });
// ── Hooks
// userSchema.pre("save", async function (next) {
//   if (!this.isModified("passwordHash")) return next();
//   this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
//   next();
// });
userSchema.pre("save", async function () {
  if (!this.isModified("passwordHash")) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  // Just finish the function. Mongoose sees the Promise resolved and automatically moves to the next step
});
// ── Instance methods
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

export const User = mongoose.model("User", userSchema);
