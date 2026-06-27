import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true },
    profile: {
      name: { type: String, default: "" },
      headline: { type: String, default: "" },
      location: { type: String, default: "" },
      initials: { type: String, default: "" },
      stack: [{ type: String }],
      achievements: [{ type: String }],
      projects: [{ type: String }],
    },
    isPremium: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationCode: { type: String },
    emailVerificationExpires: { type: Date },
    resetCode: { type: String },
    resetCodeExpires: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
