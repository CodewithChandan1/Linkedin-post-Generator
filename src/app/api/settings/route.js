import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Settings from "@/models/Settings";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    let settings = await Settings.findOne({ userId: user._id });
    if (!settings) {
      // Return defaults if none exists yet
      settings = {
        userId: user._id,
        email: user.email,
        reminderTime: "08:00",
        reminderEnabled: true,
        pushEnabled: false,
        topics: {},
      };
    }
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
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

    if (body.reminderEnabled) {
      const dbUser = await User.findById(user._id);
      if (!dbUser || !dbUser.isEmailVerified) {
        return NextResponse.json(
          { success: false, error: "Please verify your email address to enable daily reminders." },
          { status: 400 }
        );
      }
    }

    const settings = await Settings.findOneAndUpdate(
      { userId: user._id },
      { $set: { ...body, userId: user._id } },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Failed to save settings:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
