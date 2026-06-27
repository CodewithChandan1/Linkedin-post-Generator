// Opportunity Tracker — logs inbound opportunities resulting from LinkedIn posting.
// PRD §4.18

const OPP_KEY = "linkedin_opportunities";

export const OPPORTUNITY_TYPES = [
  { key: "recruiter_dm", label: "Recruiter DM", icon: "💼" },
  { key: "freelance", label: "Freelance Inquiry", icon: "💰" },
  { key: "collaboration", label: "Collaboration Request", icon: "🤝" },
  { key: "speaking", label: "Speaking / Mentoring Invite", icon: "🎤" },
  { key: "follower_milestone", label: "Follower Milestone", icon: "🎯" },
  { key: "viral_post", label: "Post Went Viral (100+ likes)", icon: "🔥" },
];

export function loadOpportunities() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(OPP_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOpportunities(opps) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(OPP_KEY, JSON.stringify(opps));
  } catch {}
}

export function addOpportunity(type, note = "") {
  const opps = loadOpportunities();
  const newOpp = {
    id: Date.now(),
    type,
    note,
    date: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  };
  const updated = [newOpp, ...opps];
  saveOpportunities(updated);

  if (typeof window !== "undefined") {
    fetch("/api/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        oppId: String(newOpp.id),
        type,
        note,
        date: newOpp.date,
        createdAt: newOpp.createdAt,
      }),
    }).catch((err) => console.error("Failed to sync opportunity to DB:", err));
  }

  return updated;
}

// Group opportunities by month for the ROI dashboard
export function groupByMonth(opps) {
  const grouped = {};
  opps.forEach((o) => {
    const month = o.date.slice(0, 7); // YYYY-MM
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(o);
  });
  return grouped;
}

// Get summary counts per type for current month
export function getCurrentMonthSummary(opps) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonth = opps.filter((o) => o.date.startsWith(currentMonth));
  const summary = {};
  OPPORTUNITY_TYPES.forEach(({ key }) => {
    summary[key] = thisMonth.filter((o) => o.type === key).length;
  });
  return { summary, total: thisMonth.length, month: currentMonth };
}
