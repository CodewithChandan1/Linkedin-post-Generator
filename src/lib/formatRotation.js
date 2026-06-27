// Format Rotation Logic — avoids 20% consecutive-format penalty.
// Rotates between: text, carousel, poll.
// Every 7th post in the rotation gets a follower growth CTA appended.

const ROTATION_KEY = "linkedin_format_rotation";

export const POST_FORMATS = {
  TEXT: "text",
  CAROUSEL: "carousel",
  POLL: "poll",
};

// Rotation sequence: text, text, carousel, text, text, poll, text
// This mirrors PRD guidance — carousel 1–2x/week, poll max 1x/week
const ROTATION_SEQUENCE = [
  POST_FORMATS.TEXT,
  POST_FORMATS.TEXT,
  POST_FORMATS.CAROUSEL,
  POST_FORMATS.TEXT,
  POST_FORMATS.TEXT,
  POST_FORMATS.POLL,
  POST_FORMATS.TEXT,
];

// Follower CTA phrases — appended to every 7th post
export const FOLLOWER_CTAS = [
  "If this was useful, follow me — I post about React, Next.js, and Web3 building every day.",
  "Found this helpful? Follow along — I share practical dev insights daily.",
  "I post about Full Stack and Web3 development every day. Follow if you want more like this.",
  "Building and learning in public. Follow me if you're on the same journey.",
];

export function loadRotationState() {
  if (typeof window === "undefined") return { index: 0, postCount: 0 };
  try {
    const raw = localStorage.getItem(ROTATION_KEY);
    return raw ? JSON.parse(raw) : { index: 0, postCount: 0 };
  } catch {
    return { index: 0, postCount: 0 };
  }
}

export function saveRotationState(state) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ROTATION_KEY, JSON.stringify(state));
  } catch {}
}

// Get next format and whether this post gets a follower CTA
export function getNextFormat() {
  const state = loadRotationState();
  const format = ROTATION_SEQUENCE[state.index % ROTATION_SEQUENCE.length];
  const isFollowerCTAPost = (state.postCount + 1) % 7 === 0;
  const followerCTA = isFollowerCTAPost
    ? FOLLOWER_CTAS[Math.floor(state.postCount / 7) % FOLLOWER_CTAS.length]
    : null;

  return { format, isFollowerCTAPost, followerCTA };
}

// Advance the rotation counter (called after a post is generated)
export function advanceRotation() {
  const state = loadRotationState();
  saveRotationState({
    index: (state.index + 1) % ROTATION_SEQUENCE.length,
    postCount: state.postCount + 1,
  });
}

// Compute depth score for a post (0-100)
// Based on PRD §4.15 Depth Score Optimizer
export function computeDepthScore(content) {
  if (!content) return { score: 0, level: "Low", tips: [] };

  const tips = [];
  let score = 0;

  // Length check (target 1500+ chars)
  const len = content.length;
  if (len >= 1800) { score += 30; }
  else if (len >= 1500) { score += 25; }
  else if (len >= 1200) { score += 15; tips.push("Add more detail — target 1,500+ characters for higher dwell time"); }
  else { score += 5; tips.push("Post is too short — under 1,200 chars. Expand for better Depth Score"); }

  // Line breaks / paragraphs (readability)
  const paragraphs = content.split("\n").filter((l) => l.trim().length > 0).length;
  if (paragraphs >= 6) { score += 20; }
  else if (paragraphs >= 4) { score += 12; }
  else { score += 4; tips.push("Use more line breaks — short paragraphs keep readers scrolling"); }

  // Numbered list or clear structure
  if (/\d+\.|→|•|-\s/.test(content)) { score += 15; }
  else { tips.push("Add a numbered list or bullet points for structure"); }

  // Ends with open question
  const lastLines = content.split("\n").slice(-4).join(" ");
  if (/\?/.test(lastLines)) { score += 20; }
  else { tips.push("End with an open question to spark multi-reply threads"); }

  // Save CTA
  if (/save|bookmark/i.test(content)) { score += 10; }
  else { tips.push('Add "Save this post" CTA to boost Depth Score saves signal'); }

  // "See more" cliff-hanger (something compelling early)
  const firstThird = content.slice(0, Math.floor(content.length / 3));
  if (firstThird.split("\n").some((l) => l.trim().length > 0 && l.trim().length < 80)) {
    score += 5; // short punchy lines near the top
  }

  const level = score >= 75 ? "High" : score >= 50 ? "Medium" : "Low";
  return { score: Math.min(score, 100), level, tips };
}

// Poll format template
export function generatePollTemplate(topic) {
  return {
    question: `What's your biggest challenge with ${topic}?`,
    options: ["Performance optimization", "Code maintainability", "Team collaboration", "Keeping up with updates"],
    note: "Post this as a LinkedIn native poll for maximum engagement (8.9% avg rate)",
  };
}
