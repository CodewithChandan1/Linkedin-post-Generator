import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ProfileVisit from "@/models/ProfileVisit";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const visits = await ProfileVisit.find({ userId: user._id }).sort({ date: -1, createdAt: -1 });
    return NextResponse.json({ success: true, visits });
  } catch (error) {
    console.error("Failed to fetch profile visits:", error);
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
    if (!body.visitId) {
      return NextResponse.json({ success: false, error: "visitId is required" }, { status: 400 });
    }

    body.userId = user._id;

    const visit = await ProfileVisit.findOneAndUpdate(
      { visitId: body.visitId, userId: user._id },
      { $set: body },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, visit });
  } catch (error) {
    console.error("Failed to save profile visit:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
