// Profile Visitor Tracker — manual weekly log with growth tracking
// PRD §6.3

const VISITS_KEY = "linkedin_profile_visits";

export function loadVisits() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(VISITS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveVisits(visits) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(VISITS_KEY, JSON.stringify(visits));
  } catch {}
}

export function logVisitCount(count, note = "") {
  const visits = loadVisits();
  const entry = {
    id: Date.now(),
    count: Number(count),
    note,
    week: getWeekKey(),
    date: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  };
  const updated = [entry, ...visits];
  saveVisits(updated);

  if (typeof window !== "undefined") {
    fetch("/api/profile-visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitId: String(entry.id),
        count: entry.count,
        note: entry.note,
        week: entry.week,
        date: entry.date,
        createdAt: entry.createdAt,
      }),
    }).catch((err) => console.error("Failed to sync profile visit to DB:", err));
  }

  return updated;
}

// YYYY-WNN format for week key
export function getWeekKey(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

// Compute week-over-week growth %
export function computeGrowth(visits) {
  if (visits.length < 2) return null;
  const latest = visits[0].count;
  const prev = visits[1].count;
  if (prev === 0) return null;
  return Math.round(((latest - prev) / prev) * 100);
}

// Get chart data — last 8 weeks
export function getChartData(visits) {
  return visits
    .slice(0, 8)
    .reverse()
    .map((v) => ({ week: v.week, count: v.count, date: v.date }));
}
