// Post Analytics — manual engagement tracking per post
// Since LinkedIn API analytics access is restricted, user inputs manually.
// PRD §6.11

const ANALYTICS_KEY = "linkedin_post_analytics";

export function loadAnalytics() {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveAnalytics(data) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
  } catch {}
}

export function updatePostAnalytics(postId, metrics) {
  const all = loadAnalytics();
  all[postId] = { ...all[postId], ...metrics, updatedAt: new Date().toISOString() };
  saveAnalytics(all);
  return all;
}

export function getPostAnalytics(postId) {
  return loadAnalytics()[postId] || { likes: 0, comments: 0, shares: 0, views: 0, impressions: 0, clicks: 0 };
}

// Compute engagement score: likes + comments*3 + shares*5 + views*0.1
export function engagementScore(metrics) {
  const { likes = 0, comments = 0, shares = 0, views = 0 } = metrics;
  return Math.round(likes + comments * 3 + shares * 5 + views * 0.1);
}

// Get top N posts by engagement score
export function getTopPosts(posts, analyticsData, n = 3) {
  return posts
    .map((p) => {
      const metrics = {
        likes: p.likes || 0,
        comments: p.comments || 0,
        shares: p.shares || 0,
        views: p.views || 0,
        impressions: p.impressions || 0,
        clicks: p.clicks || 0,
        ...(analyticsData[p.id] || {})
      };
      return { ...p, metrics, score: engagementScore(metrics) };
    })
    .filter((p) => p.status === "posted" && p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

// Best performing topic analysis
export function getBestTopics(posts, analyticsData) {
  const topicScores = {};
  const topicCounts = {};

  posts.forEach((p) => {
    if (p.status !== "posted") return;
    const topic = p.topic || "Unknown";
    const metrics = {
      likes: p.likes || 0,
      comments: p.comments || 0,
      shares: p.shares || 0,
      views: p.views || 0,
      impressions: p.impressions || 0,
      clicks: p.clicks || 0,
      ...(analyticsData[p.id] || {})
    };
    const score = engagementScore(metrics);
    topicScores[topic] = (topicScores[topic] || 0) + score;
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
  });

  return Object.entries(topicScores)
    .map(([topic, total]) => ({
      topic,
      avgScore: topicCounts[topic] > 0 ? Math.round(total / topicCounts[topic]) : 0,
      postCount: topicCounts[topic],
    }))
    .sort((a, b) => b.avgScore - a.avgScore);
}

// Evergreen recycler — posts older than 90 days with high engagement
export function getEvergreenCandidates(posts, analyticsData) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  return posts
    .filter((p) => p.status === "posted" && p.date <= cutoffStr)
    .map((p) => {
      const metrics = {
        likes: p.likes || 0,
        comments: p.comments || 0,
        shares: p.shares || 0,
        views: p.views || 0,
        impressions: p.impressions || 0,
        clicks: p.clicks || 0,
        ...(analyticsData[p.id] || {})
      };
      return { ...p, metrics, score: engagementScore(metrics) };
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
