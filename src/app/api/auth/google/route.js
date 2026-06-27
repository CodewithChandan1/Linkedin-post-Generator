import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { createSession } from "@/lib/auth";

export async function POST(request) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ success: false, error: "ID Token is required" }, { status: 400 });
    }

    // Verify Google Token via Google's OAuth2 API
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!response.ok) {
      return NextResponse.json({ success: false, error: "Invalid Google token" }, { status: 400 });
    }

    const payload = await response.json();
    
    // Validate Audience matches our Google Client ID
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (payload.aud !== googleClientId) {
      console.error("Audience mismatch:", payload.aud, "expected:", googleClientId);
      return NextResponse.json({ success: false, error: "Security validation failed" }, { status: 400 });
    }

    const email = payload.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ success: false, error: "Email not provided by Google" }, { status: 400 });
    }

    await connectDB();

    // Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create a new user with Google details
      const dummySalt = crypto.randomBytes(16).toString("hex");
      const dummyHash = crypto.randomBytes(64).toString("hex"); // Google users don't login with passwords

      const name = payload.name || email.split("@")[0];
      const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      user = await User.create({
        email,
        passwordHash: dummyHash,
        salt: dummySalt,
        profile: {
          name: name,
          initials: initials,
          headline: "Software Engineer",
          location: "India",
          stack: ["React", "Next.js", "JavaScript"],
          achievements: [],
          projects: [],
        },
        isPremium: false,
        isEmailVerified: true,
      });
    }

    // Create a login session
    const token = await createSession(user._id);

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        isPremium: user.isPremium || false,
        isEmailVerified: user.isEmailVerified || false,
      },
    });
  } catch (error) {
    console.error("Google authentication error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
