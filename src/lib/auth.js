import crypto from "crypto";
import { cookies } from "next/headers";
import { connectDB } from "./db";
import User from "@/models/User";
import Session from "@/models/Session";

// Secure PBKDF2 Password Hashing
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return { salt, hash };
}

export function verifyPassword(password, salt, hash) {
  const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === checkHash;
}

// Session Management
export async function createSession(userId) {
  await connectDB();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

  // Save to DB
  await Session.create({
    token,
    userId,
    expiresAt,
  });

  // Set HTTP-Only Cookie
  const cookieStore = cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: expiresAt,
    path: "/",
  });

  return token;
}

export async function getSessionUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return null;

    await connectDB();
    const session = await Session.findOne({ token });
    if (!session) return null;

    // Check expiration
    if (session.expiresAt < new Date()) {
      await Session.deleteOne({ token });
      return null;
    }

    const user = await User.findById(session.userId).lean();
    if (!user) return null;

    // Return user with string ID
    return {
      ...user,
      _id: user._id.toString(),
    };
  } catch (error) {
    console.error("Error in getSessionUser:", error);
    return null;
  }
}

export async function deleteSession() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("session")?.value;
    if (token) {
      await connectDB();
      await Session.deleteOne({ token });
    }
    // Clear cookie
    cookieStore.delete("session");
  } catch (error) {
    console.error("Error deleting session:", error);
  }
}
