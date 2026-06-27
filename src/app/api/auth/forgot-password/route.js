import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function POST(request) {
  try {
    await connectDB();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: "No account found with this email address" }, { status: 404 });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    user.resetCode = code;
    user.resetCodeExpires = expiresAt;
    await user.save();

    // Print to terminal console
    console.log("\n==================================================");
    console.log(`🔑 [PASSWORD RESET] Email: ${email}`);
    console.log(`Verification Code: ${code}`);
    console.log("==================================================\n");

    return NextResponse.json({
      success: true,
      message: "Verification code sent! Please check your server terminal console.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
