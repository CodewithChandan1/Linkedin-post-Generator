import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth";

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { code } = await request.json();
    if (!code) {
      return NextResponse.json({ success: false, error: "Verification code is required" }, { status: 400 });
    }

    await connectDB();

    const dbUser = await User.findById(user._id);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Check if code matches
    if (!dbUser.emailVerificationCode || dbUser.emailVerificationCode !== code) {
      return NextResponse.json({ success: false, error: "Invalid verification code" }, { status: 400 });
    }

    // Check if code has expired
    if (!dbUser.emailVerificationExpires || dbUser.emailVerificationExpires < new Date()) {
      return NextResponse.json({ success: false, error: "Verification code has expired. Please request a new one." }, { status: 400 });
    }

    // Clear code and mark as verified
    dbUser.isEmailVerified = true;
    dbUser.emailVerificationCode = undefined;
    dbUser.emailVerificationExpires = undefined;
    await dbUser.save();

    console.log(`🎉 [EMAIL VERIFICATION] User ${dbUser.email} has been successfully verified!`);

    return NextResponse.json({
      success: true,
      message: "Email verified successfully! You can now enable daily reminders.",
      user: {
        id: dbUser._id.toString(),
        email: dbUser.email,
        profile: dbUser.profile,
        isPremium: dbUser.isPremium || false,
        isEmailVerified: true,
      }
    });
  } catch (error) {
    console.error("Email verification confirmation error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
