// Server-side email helper (nodemailer + Gmail).
// Shared by the manual /api/send-reminder route and the daily Vercel cron.

import nodemailer from "nodemailer";
import { getBestTime } from "./bestTime";

export function mailerConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function buildReminderHtml({ name, previewText, bestTime, appLink, appName }) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0; padding:0; background:#F3F2EF; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
        <tr><td align="center">
          <table width="440" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.06);">
            <tr><td style="height:4px; background:#0A66C2;"></td></tr>
            <tr><td style="padding:28px 28px 24px;">

              <p style="margin:0 0 14px; font-size:15px; color:#1D2226; line-height:1.5;">
                Hi ${name || "there"},<br>Your LinkedIn post for today is ready to publish! 🎉
              </p>

              <p style="margin:0 0 4px; font-size:11px; font-weight:600; color:#666; text-transform:uppercase; letter-spacing:0.5px;">Today's Post Preview</p>
              <div style="margin:0 0 18px; padding:12px 14px; background:#F8FAFC; border-radius:8px; border-left:3px solid #0A66C2;">
                <p style="margin:0; font-size:13px; color:#444; line-height:1.5; white-space:pre-wrap;">${previewText}</p>
              </div>

              <p style="margin:0 0 4px; font-size:11px; font-weight:600; color:#666; text-transform:uppercase; letter-spacing:0.5px;">Best Time to Post</p>
              <p style="margin:0 0 4px; font-size:14px; color:#0A66C2; font-weight:600;">Recommended Time: ${bestTime.slot}</p>
              <p style="margin:0 0 18px; font-size:12px; color:#666; line-height:1.4;">Posting during this time can help maximize engagement and reach among the Indian developer community.</p>

              <p style="margin:0 0 18px;">
                <a href="${appLink}" style="display:inline-block; background:#0A66C2; color:#fff; padding:11px 26px; border-radius:22px; text-decoration:none; font-size:13px; font-weight:600;">👉 Publish Now</a>
              </p>

              <p style="margin:0 0 0; font-size:13px; color:#555; line-height:1.5;">
                Stay consistent, grow your audience, and build your personal brand one post at a time.
              </p>
              <p style="margin:12px 0 0; font-size:13px; color:#555;">
                Happy posting!<br>
                <span style="color:#999;">Best regards, ${appName}</span>
              </p>

            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;
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
  const appName = "LinkedIn Auto-Post Generator";

  const previewText = postPreview
    ? postPreview.slice(0, 200) + (postPreview.length > 200 ? "…" : "")
    : "Your AI-generated post is ready — open the app to see the full version.";

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  await transporter.sendMail({
    from: `"LinkedIn AutoPost" <${gmailUser}>`,
    to: toEmail,
    subject: `🚀 Your LinkedIn post for ${today} is ready!`,
    html: buildReminderHtml({ name, previewText, bestTime, appLink, appName }),
  });

  return { to: toEmail };
}
