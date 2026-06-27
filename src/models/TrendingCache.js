import mongoose from "mongoose";

// Single-document cache of the latest trending scan, refreshed daily by the cron.
const TrendingCacheSchema = new mongoose.Schema(
  {
    key: { type: String, default: "latest", unique: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    scannedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.TrendingCache ||
  mongoose.model("TrendingCache", TrendingCacheSchema);
