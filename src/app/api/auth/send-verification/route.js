import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth";

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    // Generate 6-digit random code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

    // Save to user model
    const dbUser = await User.findById(user._id);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    dbUser.emailVerificationCode = verificationCode;
    dbUser.emailVerificationExpires = expiresAt;
    await dbUser.save();

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    // Developer convenience: if credentials are not configured or are dummy values, log code to terminal
    if (!gmailUser || !gmailPass || gmailUser.includes("your") || gmailUser.includes("abc@")) {
      console.log(`\n📧 [EMAIL VERIFICATION] Dev Code for ${dbUser.email}: ${verificationCode}\n`);
      return NextResponse.json({
        success: true,
        message: "Verification code generated successfully. (Printed to Server Terminal)",
      });
    }

    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    const mailOptions = {
      from: `"DevPost AI" <${gmailUser}>`,
      to: dbUser.email,
      subject: "Verify Your Email Address - DevPost AI",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #2563EB; text-align: center;">Email Verification</h2>
          <p>Hi there,</p>
          <p>Thank you for choosing DevPost AI. To verify your email address and enable daily email notifications, please use the 6-digit code below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1e293b; background-color: #f1f5f9; padding: 10px 20px; border-radius: 6px; border: 1px dashed #cbd5e1;">${verificationCode}</span>
          </div>
          <p style="color: #64748b; font-size: 14px;">This code is valid for 15 minutes. If you did not request this code, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="text-align: center; color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} DevPost AI. All rights reserved.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ [EMAIL VERIFICATION] Verification email sent to ${dbUser.email}`);

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email address.",
    });
  } catch (error) {
    console.error("Email verification send error:", error);
    // Even if nodemailer fails, log the code so the developer/user isn't blocked!
    try {
      const dbUser = await User.findById(user._id);
      if (dbUser && dbUser.emailVerificationCode) {
        console.log(`\n📧 [EMAIL VERIFICATION] Fallback Dev Code for ${dbUser.email}: ${dbUser.emailVerificationCode}\n`);
      }
    } catch {}
    
    return NextResponse.json({
      success: true,
      message: "Could not send verification email, but code was printed to terminal.",
      fallback: true
    });
  }
}
