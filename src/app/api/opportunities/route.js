import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Opportunity from "@/models/Opportunity";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const opportunities = await Opportunity.find({ userId: user._id }).sort({ date: -1, createdAt: -1 });
    return NextResponse.json({ success: true, opportunities });
  } catch (error) {
    console.error("Failed to fetch opportunities:", error);
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
    if (!body.oppId) {
      return NextResponse.json({ success: false, error: "oppId is required" }, { status: 400 });
    }

    body.userId = user._id;

    const opportunity = await Opportunity.findOneAndUpdate(
      { oppId: body.oppId, userId: user._id },
      { $set: body },
      { upsert: true, returnDocument: 'after' }
    );

    return NextResponse.json({ success: true, opportunity });
  } catch (error) {
    console.error("Failed to save opportunity:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
