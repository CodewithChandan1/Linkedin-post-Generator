import { useEffect, useRef } from "react";
import { showNotification, sendReminderEmail, emailConfigured } from "./reminders";
import { getBestTime } from "./bestTime";

const FIRED_KEY = "linkedin_autopost_last_reminder"; // YYYY-MM-DD of last fire

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// While the app is open, checks every minute whether it's time to remind.
// Fires at most once per calendar day at/after the chosen HH:MM (local time).
export function useReminderScheduler({ settings, todaysPost }) {
  const firingRef = useRef(false);

  useEffect(() => {
    if (!settings?.reminderEnabled) return;

    async function check() {
      if (firingRef.current) return;

      const lastFired = window.localStorage.getItem(FIRED_KEY);
      const today = todayKey();
      if (lastFired === today) return; // already reminded today

      const now = new Date();
      const [h, m] = (settings.reminderTime || "08:00").split(":").map(Number);
      const due = now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
      if (!due) return;

      firingRef.current = true;
      // mark first to avoid double-fire across rapid intervals
      window.localStorage.setItem(FIRED_KEY, today);

      const bestTime = getBestTime();

      console.log("[Reminder] 🔔 Firing reminder at", new Date().toLocaleTimeString());

      if (settings.pushEnabled) {
        showNotification(
          "Time to post on LinkedIn! 🚀",
          `Your ${bestTime.dayName} post is ready. Best window: ${bestTime.slot}.`
        );
      }

      if (settings.email && emailConfigured()) {
        try {
          await sendReminderEmail({ email: settings.email, post: todaysPost, bestTime });
          await fetch("/api/settings/increment-emails", { method: "POST" }).catch(() => {});
        } catch {
          // email failed silently; push already delivered if enabled
        }
      }

      firingRef.current = false;
    }

    check();
    const id = setInterval(check, 10 * 1000); // check every 10s for quick testing
    return () => clearInterval(id);
  }, [settings, todaysPost]);
}
