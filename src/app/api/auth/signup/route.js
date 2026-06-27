import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Settings from "@/models/Settings";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(request) {
  try {
    await connectDB();
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    const { salt, hash } = hashPassword(password);
    
    // Create new user with default developer profile fields
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash: hash,
      salt,
      profile: {
        name,
        headline: "Developer | Building cool things",
        location: "India",
        initials: name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
        stack: ["React", "Next.js", "Node.js", "MongoDB"],
        achievements: [],
        projects: [],
      },
    });

    // Create default settings for this user
    await Settings.create({
      userId: user._id.toString(),
      email: user.email,
      reminderTime: "08:00",
      reminderEnabled: false,
      pushEnabled: false,
      topics: {},
    });

    await createSession(user._id.toString());

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        profile: user.profile,
        isPremium: false,
        isEmailVerified: false,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
