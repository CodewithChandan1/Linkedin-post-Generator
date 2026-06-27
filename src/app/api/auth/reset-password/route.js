import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { hashPassword } from "@/lib/auth";

export async function POST(request) {
  try {
    await connectDB();
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: "Email, code, and new password are required" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validate code & expiration
    if (!user.resetCode || user.resetCode !== code.trim()) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    if (!user.resetCodeExpires || user.resetCodeExpires < new Date()) {
      return NextResponse.json({ error: "Verification code has expired" }, { status: 400 });
    }

    // Reset password
    const { salt, hash } = hashPassword(newPassword);
    user.passwordHash = hash;
    user.salt = salt;
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Password reset successful! You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
