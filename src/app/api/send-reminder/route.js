import { getSessionUser } from "@/lib/auth";
import { sendReminderMail, mailerConfigured } from "@/lib/mailer";

export const runtime = "nodejs";

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!mailerConfigured()) {
    return Response.json(
      { error: "GMAIL_USER and GMAIL_APP_PASSWORD not set in .env.local" },
      { status: 500 }
    );
  }

  let toEmail = user.email || user.profile?.email;
  let postPreview = "";
  try {
    const body = await req.json();
    if (body?.email) toEmail = body.email;
    if (body?.postPreview) postPreview = body.postPreview;
  } catch {
    // use default
  }

  if (!toEmail) {
    return Response.json({ error: "No destination email found" }, { status: 400 });
  }

  try {
    await sendReminderMail({ toEmail, name: user.profile?.name, postPreview });

    // Increment email counter in settings database
    try {
      const { connectDB } = await import("@/lib/db");
      const Settings = (await import("@/models/Settings")).default;
      await connectDB();
      await Settings.findOneAndUpdate(
        { userId: user._id.toString() },
        { $inc: { emailsSentCount: 1 } },
        { upsert: true }
      );
    } catch (dbErr) {
      console.error("Failed to increment email sent count in send-reminder route:", dbErr);
    }

    return Response.json({ success: true, to: toEmail });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
