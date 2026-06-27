// Pre-post Comment Seeding — stores trusted connections list and
// generates DM templates to prime early engagement.
// PRD §4.11

const SEEDS_KEY = "linkedin_seed_connections";

export function loadSeedConnections() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SEEDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSeedConnections(connections) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SEEDS_KEY, JSON.stringify(connections));
  } catch {}
}

// Generate personalized DM templates for a post
export function generateSeedDMs(postTopic, connections) {
  if (!connections || connections.length === 0) return [];

  const templates = [
    (name, topic) =>
      `Hey ${name}, posting something in 10 mins about ${topic} — would love your honest take when it's live 👀`,
    (name, topic) =>
      `${name}! About to drop a post on ${topic}. Would mean a lot if you shared your thoughts when it's up 🙏`,
    (name, topic) =>
      `Hey ${name} — publishing a post on ${topic} soon. Your perspective would add a lot to the thread, let me know what you think!`,
  ];

  return connections.slice(0, 5).map((conn, i) => ({
    name: conn.name,
    dm: templates[i % templates.length](conn.name, postTopic || "my latest project"),
  }));
}
