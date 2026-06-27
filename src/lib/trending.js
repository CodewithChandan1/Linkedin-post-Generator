// Trending tech news scanner — fetches from free, no-key-needed sources.
// Sources: GitHub Trending, Hacker News, dev.to, npm

const RELEVANT_TAGS = [
  "react", "nextjs", "next.js", "nodejs", "node.js", "javascript", "typescript",
  "web3", "blockchain", "mongodb", "tailwind", "vercel", "npm", "devops",
  "docker", "api", "frontend", "backend", "fullstack", "rust", "ai", "llm",
];

function isRelevant(text) {
  const lower = (text || "").toLowerCase();
  return RELEVANT_TAGS.some((tag) => lower.includes(tag));
}

// GitHub Trending — scrapes the trending page (no API key needed)
export async function fetchGitHubTrending() {
  try {
    const res = await fetch(
      "https://api.gitterapp.com/repositories?language=javascript&since=daily",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const repos = await res.json();
    return (repos || []).slice(0, 10).map((r) => ({
      source: "GitHub Trending",
      title: r.name || r.repository,
      description: r.description || "",
      url: r.url || `https://github.com/${r.repository}`,
      stars: r.stars || r.currentPeriodStars || 0,
      relevant: isRelevant(`${r.name} ${r.description} ${r.language}`),
    }));
  } catch {
    return [];
  }
}

// Hacker News — top stories (free, no key)
export async function fetchHackerNews() {
  try {
    const res = await fetch(
      "https://hacker-news.firebaseio.com/v0/topstories.json"
    );
    if (!res.ok) return [];
    const ids = (await res.json()).slice(0, 15);

    const stories = await Promise.all(
      ids.map(async (id) => {
        const r = await fetch(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`
        );
        return r.ok ? r.json() : null;
      })
    );

    return stories
      .filter(Boolean)
      .map((s) => {
        let domain = "";
        try { domain = s.url ? new URL(s.url).hostname : ""; } catch {}
        return {
          source: "Hacker News",
          title: s.title || "",
          description: [
            domain ? `Source: ${domain}` : "",
            s.descendants ? `${s.descendants} comments` : "",
            s.by ? `by ${s.by}` : "",
          ].filter(Boolean).join(" · "),
          url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
          score: s.score || 0,
          relevant: isRelevant(s.title),
        };
      })
      .filter((s) => s.score > 50);
  } catch {
    return [];
  }
}

// dev.to — trending articles by relevant tags (free, no key)
export async function fetchDevTo() {
  try {
    const tags = ["react", "nodejs", "nextjs", "webdev", "javascript"];
    const results = await Promise.all(
      tags.map(async (tag) => {
        const res = await fetch(
          `https://dev.to/api/articles?tag=${tag}&top=1&per_page=3`
        );
        if (!res.ok) return [];
        return res.json();
      })
    );

    const articles = results.flat();
    const seen = new Set();

    return articles
      .filter((a) => {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      })
      .slice(0, 10)
      .map((a) => ({
        source: "dev.to",
        title: a.title || "",
        description: [
          a.description || "",
          a.tag_list?.length ? `Tags: ${a.tag_list.join(", ")}` : "",
          a.reading_time_minutes ? `${a.reading_time_minutes} min read` : "",
          a.user?.name ? `by ${a.user.name}` : "",
        ].filter(Boolean).join(" · "),
        url: a.url || "",
        reactions: a.public_reactions_count || 0,
        relevant: true,
      }));
  } catch {
    return [];
  }
}

// npm — recently trending packages (using npm registry search)
export async function fetchNpmTrending() {
  try {
    const res = await fetch(
      "https://registry.npmjs.org/-/v1/search?text=keywords:react,next,node&popularity=1.0&size=10"
    );
    if (!res.ok) return [];
    const data = await res.json();

    return (data.objects || []).map((o) => ({
      source: "npm",
      title: o.package?.name || "",
      description: o.package?.description || "",
      url: o.package?.links?.npm || "",
      score: Math.round((o.score?.final || 0) * 100),
      relevant: isRelevant(`${o.package?.name} ${o.package?.description}`),
    }));
  } catch {
    return [];
  }
}

// Fetch all sources and combine
export async function fetchAllTrending() {
  const [github, hn, devto, npm] = await Promise.all([
    fetchGitHubTrending(),
    fetchHackerNews(),
    fetchDevTo(),
    fetchNpmTrending(),
  ]);

  const all = [...github, ...hn, ...devto, ...npm];
  const relevant = all.filter((item) => item.relevant);
  const other = all.filter((item) => !item.relevant);

  return {
    relevant,
    other,
    total: all.length,
    sources: { github: github.length, hn: hn.length, devto: devto.length, npm: npm.length },
  };
}
