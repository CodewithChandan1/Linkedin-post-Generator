import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const posts = await Post.find({ userId: user._id }).sort({ date: -1, createdAt: -1 });
    return NextResponse.json({ success: true, posts });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await request.json();
    if (!body.postId) {
      return NextResponse.json({ success: false, error: "postId is required" }, { status: 400 });
    }

    // Bind post to the authenticated user
    body.userId = user._id;

    const post = await Post.findOneAndUpdate(
      { postId: body.postId, userId: user._id },
      { $set: body },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("Failed to save post:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json({ success: false, error: "postId is required" }, { status: 400 });
    }

    // Only allow deleting user's own posts
    await Post.deleteOne({ postId, userId: user._id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete post:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
