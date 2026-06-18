// Client-side reminders: EmailJS email + browser push notifications.
import emailjs from "@emailjs/browser";
import { profile } from "./profile";

// EmailJS public config (safe to expose; these are publishable keys).
const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

export function emailConfigured() {
  return Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);
}

export async function sendReminderEmail({ email, post, bestTime }) {
  if (!emailConfigured()) {
    throw new Error(
      "EmailJS isn't configured. Add NEXT_PUBLIC_EMAILJS_* keys to .env.local."
    );
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const preview = post?.content ? post.content.slice(0, 100) + "…" : "Your post is ready.";

  const params = {
    to_email: email,
    to_name: profile.name,
    subject: `🚀 Your LinkedIn post for ${today} is ready!`,
    post_date: today,
    best_time: bestTime ? `${bestTime.slot} (${bestTime.note})` : "8:30 AM IST",
    post_preview: preview,
    app_link: typeof window !== "undefined" ? window.location.origin : "",
  };

  return emailjs.send(SERVICE_ID, TEMPLATE_ID, params, { publicKey: PUBLIC_KEY });
}

// ---- Browser push notifications ----

export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission() {
  return notificationsSupported() ? Notification.permission : "unsupported";
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
}

export function showNotification(title, body) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  new Notification(title, {
    body,
    icon: "/favicon.ico",
    tag: "linkedin-autopost-reminder",
  });
}
