// Daily reminder cron — fires server-side via Vercel Cron (see vercel.json).
// Emails every user who has reminders enabled, once per IST day.
// Unlike the client-side scheduler, this works even when no one has the app open.

import { connectDB } from "@/lib/db";
import Settings from "@/models/Settings";
import User from "@/models/User";
import { sendReminderMail, mailerConfigured } from "@/lib/mailer";
import { isAuthorizedCron, istDateKey } from "@/lib/cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  try {
    await connectDB();
    const settingsList = await Settings.find({ reminderEnabled: true }).lean();

    let sent = 0;
    let skipped = 0;
    const errors = [];

    for (const s of settingsList) {
      if (s.lastReminderSent === today) {
        skipped++;
        continue;
      }

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

      try {
        await sendReminderMail({ toEmail, name });
        await Settings.updateOne(
          { userId: s.userId },
          { $inc: { emailsSentCount: 1 }, $set: { lastReminderSent: today } }
        );
        sent++;
      } catch (err) {
        errors.push({ userId: s.userId, error: err.message });
      }
    }

    return Response.json({ success: true, date: today, sent, skipped, errors });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
