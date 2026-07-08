// /api/notifications — CRUD for persistent notifications
//
// GET    → fetch all notifications for logged-in user (newest first)
// POST   → create a new notification
// PATCH  → mark as read (body: { id } or { all: true })
// DELETE → delete one (query: ?id=xxx) or all (query: ?all=true)

import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import Notification from "@/models/Notification";

export const runtime = "nodejs";

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const notifications = await Notification.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return Response.json({ success: true, notifications });
}

// ── POST — create ─────────────────────────────────────────────────────────────
export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { type, title, message, icon } = await req.json();
  if (!title) return Response.json({ error: "title required" }, { status: 400 });

  await connectDB();

  const notification = await Notification.create({
    userId: user._id,
    type: type || "info",
    title,
    message: message || "",
    icon: icon || "",
  });

  // Prune oldest — keep max 100 per user
  const count = await Notification.countDocuments({ userId: user._id });
  if (count > 100) {
    const oldest = await Notification.find({ userId: user._id })
      .sort({ createdAt: 1 })
      .limit(count - 100)
      .select("_id")
      .lean();
    await Notification.deleteMany({ _id: { $in: oldest.map((n) => n._id) } });
  }

  return Response.json({ success: true, notification });
}

// ── PATCH — mark read ─────────────────────────────────────────────────────────
export async function PATCH(req) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, all } = await req.json();
  await connectDB();

  if (all) {
    await Notification.updateMany({ userId: user._id }, { $set: { read: true } });
  } else if (id) {
    await Notification.findOneAndUpdate(
      { _id: id, userId: user._id },
      { $set: { read: true } }
    );
  }

  return Response.json({ success: true });
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(req) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id  = searchParams.get("id");
  const all = searchParams.get("all");

  await connectDB();

  if (all === "true") {
    await Notification.deleteMany({ userId: user._id });
  } else if (id) {
    await Notification.deleteOne({ _id: id, userId: user._id });
  }

  return Response.json({ success: true });
}
