// Server-side email helper (nodemailer + Gmail).
// Shared by the manual /api/send-reminder route and the daily Vercel cron.

import nodemailer from "nodemailer";
import { getBestTime } from "./bestTime";

export function mailerConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function buildReminderHtml({ name, previewText, bestTime, appLink, postDate }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>LinkedIn Post Reminder</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0A66C2 0%,#0d7fe8 100%);padding:32px 40px;text-align:center;">
              <div style="font-size:32px;margin-bottom:8px;"></div>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">PostedIn</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Your daily LinkedIn post is ready to publish</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 6px;font-size:16px;color:#111827;">Hi <strong>${name || "there"}</strong>,</p>
              <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
                Your LinkedIn post for <strong style="color:#111827;">${postDate}</strong> has been generated and is ready to publish.
              </p>

              <!-- Best time box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:18px 22px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:1px;">⏰ Best Time to Post Today</p>
                    <p style="margin:0;font-size:20px;font-weight:800;color:#1e40af;">${bestTime.slot}</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#3b82f6;">${bestTime.note}</p>
                  </td>
                </tr>
              </table>

              <!-- Post preview -->
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.8px;">📝 Post Preview</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#f9fafb;border-left:4px solid #0A66C2;border-radius:0 10px 10px 0;padding:18px 22px;">
                    <p style="margin:0;font-size:14px;color:#374151;line-height:1.8;font-style:italic;">"${previewText}"</p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${appLink}" style="display:inline-block;background:#0A66C2;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:15px 44px;border-radius:50px;letter-spacing:0.2px;">
                      Open App &amp; Post Now →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Motivational note -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 22px;text-align:center;">
                    <p style="margin:0;font-size:14px;color:#15803d;font-weight:600;">💪 Consistent posting = consistent opportunities. Keep going!</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                You're receiving this because you enabled daily reminders in PostedIn.<br/>
                <a href="${appLink}" style="color:#0A66C2;text-decoration:none;font-weight:600;">Manage settings</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Sends the daily reminder email. Throws on failure.
export async function sendReminderMail({ toEmail, name, postPreview }) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailPass) {
    throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD not set in environment");
  }
  if (!toEmail) throw new Error("No destination email provided");

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const bestTime = getBestTime();
  const appLink = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const previewText = postPreview
    ? postPreview.slice(0, 200) + (postPreview.length > 200 ? "…" : "")
    : "Your AI-generated post is ready — open the app to see the full version.";

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  await transporter.sendMail({
    from: `"PostedIn" <${gmailUser}>`,
    to: toEmail,
    subject: ` Your LinkedIn post for ${today} is ready!`,
    html: buildReminderHtml({ name, previewText, bestTime, appLink, postDate: today }),
  });

  return { to: toEmail };
}
