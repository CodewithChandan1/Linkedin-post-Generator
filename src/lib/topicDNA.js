// Topic DNA Tracker — tracks posts per topic in last 30 days
// and calculates authority scores with warnings.

const DNA_KEY = "linkedin_topic_dna";

export const TOPIC_LIST = [
  "React.js",
  "Next.js",
  "Node.js",
  "Web3",
  "Blockchain",
  "ICP",
  "MongoDB",
  "DevOps",
  "Career",
  "Trending",
  "Custom",
];

// Map post topic/category to a canonical DNA topic
export function mapToTopic(postTopic) {
  if (!postTopic) return "Custom";
  const t = postTopic.toLowerCase();
  if (t.includes("react")) return "React.js";
  if (t.includes("next")) return "Next.js";
  if (t.includes("node")) return "Node.js";
  if (t.includes("web3") || t.includes("web 3")) return "Web3";
  if (t.includes("blockchain") || t.includes("icp")) return "Blockchain";
  if (t.includes("mongo")) return "MongoDB";
  if (t.includes("devops") || t.includes("docker") || t.includes("workflow") || t.includes("tools")) return "DevOps";
  if (t.includes("career") || t.includes("motivation") || t.includes("reflection") || t.includes("journey")) return "Career";
  if (t.includes("trending")) return "Trending";
  if (t.includes("tech") || t.includes("coding tip") || t.includes("project story") || t.includes("deep dive")) return "React.js"; // default tech posts to React
  return "Custom";
}

// Compute topic counts from posts array (last 30 days)
export function computeTopicDNA(posts) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const recent = posts.filter((p) => p.date >= cutoffStr && p.status === "posted");

  const counts = {};
  TOPIC_LIST.forEach((t) => (counts[t] = 0));

  recent.forEach((p) => {
    const topic = mapToTopic(p.topic);
    counts[topic] = (counts[topic] || 0) + 1;
  });

  return counts;
}

// Get authority score (0-100) per topic based on post frequency
export function getAuthorityScore(count) {
  if (count >= 8) return { score: 90, level: "Expert", color: "text-green-700 bg-green-50" };
  if (count >= 5) return { score: 70, level: "Growing", color: "text-blue-700 bg-blue-50" };
  if (count >= 3) return { score: 50, level: "Emerging", color: "text-amber-700 bg-amber-50" };
  if (count >= 1) return { score: 25, level: "Weak", color: "text-orange-700 bg-orange-50" };
  return { score: 0, level: "None", color: "text-gray-500 bg-gray-100" };
}

// Generate warnings for topics with gaps
export function getTopicWarnings(counts, posts) {
  const warnings = [];

  // Find last post date per topic
  const lastPosted = {};
  posts.forEach((p) => {
    const topic = mapToTopic(p.topic);
    if (!lastPosted[topic] || p.date > lastPosted[topic]) {
      lastPosted[topic] = p.date;
    }
  });

  const today = new Date().toISOString().slice(0, 10);

  TOPIC_LIST.filter((t) => !["Trending", "Custom"].includes(t)).forEach((topic) => {
    const last = lastPosted[topic];
    if (!last) return;
    const daysSince = Math.floor(
      (new Date(today) - new Date(last)) / (1000 * 60 * 60 * 24)
    );
    if (daysSince >= 14) {
      warnings.push({
        topic,
        daysSince,
        message: `No ${topic} post in ${daysSince} days — LinkedIn may reduce your authority in this topic`,
      });
    }
  });

  return warnings;
}

// Get top performing topic (by post count)
export function getTopTopic(counts) {
  return Object.entries(counts)
    .filter(([t]) => !["Trending", "Custom"].includes(t))
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

// Persist / load extended DNA data (for future engagement correlation)
export function loadDNAData() {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DNA_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveDNAData(data) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DNA_KEY, JSON.stringify(data));
  } catch {}
}
