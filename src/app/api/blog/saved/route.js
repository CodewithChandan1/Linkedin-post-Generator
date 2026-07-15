import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import SavedBlog from "@/models/SavedBlog";

export const runtime = "nodejs";

// GET: Fetch all saved blogs for user
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const saved = await SavedBlog.find({ userId: user._id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, saved });
  } catch (error) {
    console.error("Failed to fetch saved blogs:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Save a new blog
export async function POST(req) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { articleId, title, description, coverImage, author, url, readableContent, notes } = body;

    if (!articleId || !title) {
      return NextResponse.json({ success: false, error: "articleId and title are required" }, { status: 400 });
    }

    await connectDB();
    const savedBlog = await SavedBlog.findOneAndUpdate(
      { userId: user._id, articleId },
      {
        $set: {
          title,
          description,
          coverImage,
          author,
          url,
          readableContent,
          notes: notes || "",
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    return NextResponse.json({ success: true, saved: savedBlog });
  } catch (error) {
    console.error("Failed to save blog:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Update notes for a saved blog
export async function PATCH(req) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { articleId, notes } = body;

    if (!articleId) {
      return NextResponse.json({ success: false, error: "articleId is required" }, { status: 400 });
    }

    await connectDB();
    const updated = await SavedBlog.findOneAndUpdate(
      { userId: user._id, articleId },
      { $set: { notes } },
      { returnDocument: 'after' }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "Saved blog not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, saved: updated });
  } catch (error) {
    console.error("Failed to update notes:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a saved blog
export async function DELETE(req) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const articleId = searchParams.get("articleId");

  if (!articleId) {
    return NextResponse.json({ success: false, error: "articleId is required" }, { status: 400 });
  }

  try {
    await connectDB();
    await SavedBlog.deleteOne({ userId: user._id, articleId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete saved blog:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
