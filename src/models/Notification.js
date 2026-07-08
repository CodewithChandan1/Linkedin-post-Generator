import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["info", "success", "reminder", "warning"],
      default: "info",
    },
    title:   { type: String, required: true },
    message: { type: String, default: "" },
    icon:    { type: String, default: "" },
    read:    { type: Boolean, default: false, index: true },
  },
  { timestamps: true } // createdAt, updatedAt auto
);

// Keep only last 100 notifications per user (TTL-style cleanup handled in API)
NotificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);
