import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    email: { type: String, default: "" },
    reminderTime: { type: String, default: "08:00" },
    reminderEnabled: { type: Boolean, default: true },
    pushEnabled: { type: Boolean, default: false },
    topics: { type: mongoose.Schema.Types.Mixed, default: {} },
    emailsSentCount: { type: Number, default: 0 },
    lastReminderSent: { type: String, default: "" },  // YYYY-MM-DD (IST) — dedupes the daily cron
    lastStreakAlertSent: { type: String, default: "" }, // YYYY-MM-DD (IST) — dedupes streak alert cron
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
