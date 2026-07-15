import mongoose from "mongoose";

const SavedBlogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    articleId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    coverImage: { type: String },
    author: {
      name: { type: String },
      username: { type: String },
      profileImage: { type: String }
    },
    url: { type: String },
    readableContent: { type: String },
    notes: { type: String, default: "" }
  },
  { timestamps: true }
);

// Create compound index for faster lookup and ensuring uniqueness per user
SavedBlogSchema.index({ userId: 1, articleId: 1 }, { unique: true });

export default mongoose.models.SavedBlog || mongoose.model("SavedBlog", SavedBlogSchema);
