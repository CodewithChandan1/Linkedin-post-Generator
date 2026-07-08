// Streak Alert Cron — fires daily at 7:30 PM IST (14:00 UTC)
// Checks every user who has an active streak but hasn't posted today.
// If today's post is still "pending" (not published), sends a streak-at-risk email.
//
// Logic:
//   streak >= 1  AND  today has no "posted" post  → send alert
//   streak == 0  → skip (nothing to protect)
//   already sent today → skip (deduped via lastStreakAlertSent)

import { connectDB } from "@/lib/db";
import Settings from "@/models/Settings";
import User from "@/models/User";
import Post from "@/models/Post";
import { sendStreakAlertMail, mailerConfigured } from "@/lib/mailer";
import { isAuthorizedCron, istDateKey } from "@/lib/cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Compute current streak for a user's posts (same logic as GrowthDashboard)
function computeStreak(posts) {
  if (!posts || posts.length === 0) return 0;
  const postedDates = new Set(
    posts.filter((p) => p.status === "posted").map((p) => p.date)
  );
  let streak = 0;
  // Start from yesterday — today isn't posted yet (that's why we're alerting)
  const d = new Date();
  d.setDate(d.getDate() - 1);
  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().slice(0, 10);
    if (postedDates.has(key)) {
      streak++;
    } else {
      break;
    }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// Hours left until midnight IST
function hoursUntilMidnightIST() {
  const now = new Date();
  const istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const midnight = new Date(istNow);
  midnight.setHours(24, 0, 0, 0); // next midnight in IST
  const diffMs = midnight - istNow;
  return Math.floor(diffMs / (1000 * 60 * 60));
}

export async function GET(req) {
  if (!isAuthorizedCron(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!mailerConfigured()) {
    return Response.json(
      { error: "GMAIL_USER and GMAIL_APP_PASSWORD not set" },
      { status: 500 }
    );
  }

  const today = istDateKey();
  const hoursLeft = hoursUntilMidnightIST();

  try {
    await connectDB();

    // Get all users who have reminders enabled and haven't been alerted today
    const settingsList = await Settings.find({
      reminderEnabled: true,
      $or: [
        { lastStreakAlertSent: { $exists: false } },
        { lastStreakAlertSent: "" },
        { lastStreakAlertSent: { $lt: today } },
      ],
    }).lean();

    let sent = 0;
    let skipped = 0;
    const errors = [];

    for (const s of settingsList) {
      try {
        // Check if user has already posted today
        const todayPost = await Post.findOne({
          userId: s.userId,
          date: today,
          status: "posted",
        }).lean();

        if (todayPost) {
          // Already posted today — no alert needed
          skipped++;
          continue;
        }

        // Calculate their current streak (based on yesterday and before)
        const recentPosts = await Post.find({ userId: s.userId })
          .sort({ date: -1 })
          .limit(400)
          .select("date status")
          .lean();

        const streak = computeStreak(recentPosts);

        if (streak === 0) {
          // No streak to protect — skip
          skipped++;
          continue;
        }

        // Get user's name and email
        let toEmail = s.email;
        let name = "";
        try {
          const user = await User.findById(s.userId).lean();
          if (user) {
            toEmail = toEmail || user.email;
            name = user.profile?.name || "";
          }
        } catch {
          // fall back to settings email
        }

        if (!toEmail) {
          skipped++;
          continue;
        }

        // Send streak alert
        await sendStreakAlertMail({ toEmail, name, streak, hoursLeft });

        // Mark as sent today to prevent duplicate alerts
        await Settings.updateOne(
          { userId: s.userId },
          { $set: { lastStreakAlertSent: today } }
        );

        sent++;
      } catch (err) {
        errors.push({ userId: s.userId, error: err.message });
      }
    }

    return Response.json({
      success: true,
      date: today,
      hoursLeft,
      sent,
      skipped,
      errors,
    });
  } catch (err) {
    console.error("streak-alert cron failed:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
