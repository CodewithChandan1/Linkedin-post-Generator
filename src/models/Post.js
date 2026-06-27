import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    postId: { type: String, required: true, unique: true }, // client-generated id
    date: { type: String, required: true, index: true },    // YYYY-MM-DD
    content: { type: String, required: true },
    hashtags: [{ type: String }],
    imagePrompt: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    hooks: [{ type: String }],
    topic: { type: String, default: "" },
    status: { type: String, enum: ["pending", "posted"], default: "pending" },
    source: { type: String, default: "scheduled" },
    trendingTitle: { type: String, default: "" },
    postedAt: { type: Date, default: null },
    format: { type: String, default: "text" },
    hasFollowerCTA: { type: Boolean, default: false },
    depthScore: { type: Number, default: 0 },
    depthLevel: { type: String, default: "Low" },
    humanized: { type: Boolean, default: false },
    humanizeChanges: [{ type: String }],
    // Analytics (Phase 6)
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
);

// Indexes for common queries
PostSchema.index({ date: -1 });
PostSchema.index({ status: 1 });
PostSchema.index({ createdAt: -1 });

export default mongoose.models.Post || mongoose.model("Post", PostSchema);
