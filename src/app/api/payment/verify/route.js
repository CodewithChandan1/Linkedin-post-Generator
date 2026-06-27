import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth";

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ensure monetization is enabled
  if (process.env.NEXT_PUBLIC_ENABLE_MONETIZATION !== "true") {
    return NextResponse.json({ error: "Monetization is not enabled" }, { status: 400 });
  }

  try {
    const { orderId, paymentId, signature, mock } = await request.json();

    await connectDB();

    if (mock) {
      // Mock payment verification (local developer testing)
      console.log(`✅ [RAZORPAY] Mock payment verified for User: ${user.email}`);
      
      const dbUser = await User.findById(user._id);
      if (dbUser) {
        dbUser.isPremium = true;
        await dbUser.save();
      }

      return NextResponse.json({
        success: true,
        message: "Mock payment verified successfully! Your account is now upgraded to Pro.",
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: "Razorpay Key Secret is missing" }, { status: 500 });
    }

    // Standard Razorpay Signature Verification
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(orderId + "|" + paymentId)
      .digest("hex");

    if (generatedSignature !== signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Payment is verified! Upgrade the user in the database
    const dbUser = await User.findById(user._id);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    dbUser.isPremium = true;
    await dbUser.save();

    console.log(`🎉 [RAZORPAY] Real payment verified successfully! User: ${user.email}`);

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully! Your account has been upgraded to Pro.",
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
