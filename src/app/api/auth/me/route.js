import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, user: null });
  }

  return NextResponse.json({
    success: true,
    user: {
      id: user._id,
      email: user.email,
      profile: user.profile,
    },
  });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await request.json();
    const { name, headline, location, initials, stack, achievements, projects } = body;

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          "profile.name": name !== undefined ? name : user.profile.name,
          "profile.headline": headline !== undefined ? headline : user.profile.headline,
          "profile.location": location !== undefined ? location : user.profile.location,
          "profile.initials": initials !== undefined ? initials : user.profile.initials,
          "profile.stack": stack !== undefined ? stack : user.profile.stack,
          "profile.achievements": achievements !== undefined ? achievements : user.profile.achievements,
          "profile.projects": projects !== undefined ? projects : user.profile.projects,
        },
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser._id.toString(),
        email: updatedUser.email,
        profile: updatedUser.profile,
      },
    });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
