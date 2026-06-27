import { NextResponse } from "next/server";
import Razorpay from "razorpay";
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
    const { plan } = await request.json(); // e.g. "pro"
    const amount = plan === "pro" ? 1900 : 4900; // $19 or $49 in cents/INR (Razorpay works in paise/cents)
    
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Developer convenience: If Razorpay keys are missing in env, allow mock payment flow
    if (!keyId || !keySecret) {
      console.warn("⚠️ [RAZORPAY] Key ID or Secret is missing in .env. Falling back to Mock Payment Mode.");
      return NextResponse.json({
        success: true,
        mock: true,
        orderId: `mock_order_${Math.random().toString(36).substring(7)}`,
        amount: amount,
        currency: "INR",
        keyId: "mock_key_id",
      });
    }

    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: amount * 100, // Razorpay amount in paise (1 INR = 100 paise)
      currency: "INR",
      receipt: `receipt_order_${Math.random().toString(36).substring(7)}`,
    };

    const order = await instance.orders.create(options);

    return NextResponse.json({
      success: true,
      mock: false,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId,
    });
  } catch (error) {
    console.error("Failed to create Razorpay order:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
