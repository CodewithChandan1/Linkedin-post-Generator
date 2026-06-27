import mongoose from "mongoose";

const ProfileVisitSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    visitId: { type: String, required: true, unique: true }, // Client-side generated timestamp/id
    count: { type: Number, required: true },
    note: { type: String, default: "" },
    week: { type: String, required: true }, // YYYY-WNN
    date: { type: String, required: true }, // YYYY-MM-DD
  },
  {
    timestamps: true,
  }
);

ProfileVisitSchema.index({ week: -1 });

export default mongoose.models.ProfileVisit || mongoose.model("ProfileVisit", ProfileVisitSchema);
