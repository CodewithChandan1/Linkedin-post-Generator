// Content Calendar — 7-day ahead topic planning
// PRD §6.8

import { topicRotation } from "./profile";

const CALENDAR_KEY = "linkedin_content_calendar";

export function loadCalendar() {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CALENDAR_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCalendar(calendar) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CALENDAR_KEY, JSON.stringify(calendar));
  } catch {}
}

// Get the next 7 days with planned topics
export function getCalendarDays(overrides = {}) {
  const days = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateKey = d.toISOString().slice(0, 10);
    const dayOfWeek = d.getDay();
    const defaultTopic = topicRotation[dayOfWeek];

    days.push({
      dateKey,
      dayName: d.toLocaleDateString("en-US", { weekday: "long" }),
      shortDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      isToday: i === 0,
      topic: overrides[dateKey]?.topic || defaultTopic.topic,
      example: overrides[dateKey]?.example || defaultTopic.example,
      customPrompt: overrides[dateKey]?.customPrompt || "",
      format: overrides[dateKey]?.format || "text",
      overridden: Boolean(overrides[dateKey]),
    });
  }

  return days;
}

export function updateCalendarDay(dateKey, updates) {
  const cal = loadCalendar();
  cal[dateKey] = { ...cal[dateKey], ...updates };
  saveCalendar(cal);
  return cal;
}

export function resetCalendarDay(dateKey) {
  const cal = loadCalendar();
  delete cal[dateKey];
  saveCalendar(cal);
  return cal;
}

export const AVAILABLE_TOPICS = [
  "Career/Journey",
  "Tech Deep Dive",
  "Project Story",
  "Coding Tip",
  "Web3/Blockchain",
  "Tools & Workflow",
  "Motivation/Reflection",
  "Trending",
  "Custom",
];

export const AVAILABLE_FORMATS = [
  { value: "text", label: "📝 Text Post" },
  { value: "carousel", label: "📑 PDF Carousel" },
  { value: "poll", label: "📊 Poll" },
];
