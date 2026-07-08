// Cron: Auto-sync LinkedIn stats for all recently posted content
// Triggered by Vercel Cron — runs daily at 6 PM IST (12:30 UTC)
// Golden window has closed by then, so engagement numbers are fairly stable.
//
// This cron can't carry per-user LinkedIn tokens (they live in the browser).
// Instead it marks posts that NEED a sync — the client syncs on next app open.
// See: useLinkedIn.js → syncPendingStats()

import { connectDB } from "@/lib/db";
import Post from "@/models/Post";

export const runtime = "nodejs";

export async function GET(req) {
  // Vercel Cron secret check
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find posts that:
    // 1. Have a linkedInPostId (were posted via API)
    // 2. Were posted within last 7 days (still getting engagement)
    // 3. Haven't been synced in the last 12 hours
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

    const postsNeedingSync = await Post.find({
      linkedInPostId: { $exists: true, $ne: "" },
      status: "posted",
      postedAt: { $gte: sevenDaysAgo },
      $or: [
        { statsLastSyncedAt: null },
        { statsLastSyncedAt: { $lt: twelveHoursAgo } },
      ],
    })
      .select("postId userId linkedInPostId")
      .lean();

    // Mark them with a syncPending flag so the client knows to sync on next load
    if (postsNeedingSync.length > 0) {
      const postIds = postsNeedingSync.map((p) => p.postId);
      await Post.updateMany(
        { postId: { $in: postIds } },
        { $set: { syncPending: true } }
      );
    }

    return Response.json({
      message: `Marked ${postsNeedingSync.length} posts for client-side stats sync`,
      count: postsNeedingSync.length,
    });
  } catch (err) {
    console.error("sync-linkedin-stats cron failed:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
