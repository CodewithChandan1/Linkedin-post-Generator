import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Settings from "@/models/Settings";

export async function POST() {
  try {
    await connectDB();
    const settings = await Settings.findOneAndUpdate(
      { userId: "default" },
      { $inc: { emailsSentCount: 1 } },
      { upsert: true, new: true }
    );
    return NextResponse.json({ success: true, emailsSentCount: settings.emailsSentCount });
  } catch (error) {
    console.error("Failed to increment email count:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
