// localStorage-backed user settings for reminders and topic relevance.
import { profile } from "./profile";

const SETTINGS_KEY = "linkedin_autopost_settings";

export const TOPIC_FILTERS = ["React", "Node", "Next.js", "Web3", "DevOps", "npm", "General"];

export const defaultSettings = {
  email: profile.email,
  reminderTime: "18:29", // 24h HH:MM, interpreted in the user's local time
  reminderEnabled: true,
  pushEnabled: true,
  topics: TOPIC_FILTERS.reduce((acc, t) => ({ ...acc, [t]: true }), {}),
};

export function loadSettings() {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    return {
      ...defaultSettings,
      ...parsed,
      topics: { ...defaultSettings.topics, ...(parsed.topics || {}) },
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}
