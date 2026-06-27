import { useState, useEffect } from "react";
import { Flame, Trophy, Star, TrendingUp, Heart, ArrowLeft, RefreshCw } from "lucide-react";

export default function TrendingPage({ onGenerateFromTrending, onClose }) {
  const [trending, setTrending] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchTrending();
  }, []);

  async function fetchTrending() {
    setLoading(true);
    try {
      const res = await fetch("/api/trending");
      if (!res.ok) throw new Error("Failed");
      setTrending(await res.json());
    } catch {
      setTrending({ relevant: [], other: [], total: 0, sources: {} });
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate(item) {
    setGenerating(item.title);
    try {
      const res = await fetch("/api/trending/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          description: item.description,
          source: item.source,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      onGenerateFromTrending(data);
      onClose();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    } finally {
      setGenerating(null);
    }
  }

  const allItems = [...(trending?.relevant || []), ...(trending?.other || [])];
  const filtered =
    filter === "all"
      ? allItems
      : allItems.filter((item) => item.source.toLowerCase().includes(filter));

  const topRecommended = getTopRecommended(
    trending?.relevant || [],
    trending?.other || []
  );

  const SOURCE_FILTERS = [
    { key: "all", label: "All" },
    { key: "github", label: "GitHub" },
    { key: "hacker", label: "Hacker News" },
    { key: "dev.to", label: "dev.to" },
    { key: "npm", label: "npm" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Flame size={18} className="text-orange-500" /> Trending Tech News
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchTrending}
              disabled={loading}
              className="text-xs text-linkedin border border-linkedin/30 px-3 py-1.5 rounded-full hover:bg-linkedin/10 disabled:opacity-50 flex items-center gap-1"
            >
              <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
              {loading ? "Loading…" : "Refresh"}
            </button>
            <button
              onClick={onClose}
              className="text-xs text-gray-600 border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-50 flex items-center gap-1"
            >
              <ArrowLeft size={11} /> Feed
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Click "Write Post" to generate a LinkedIn post from any trending topic
        </p>
      </div>

      {/* Source filters */}
      <div className="flex flex-wrap gap-2">
        {SOURCE_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-xs px-3 py-1 rounded-full border transition ${
              filter === key
                ? "bg-linkedin text-white border-linkedin"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
        {trending?.sources && (
          <span className="text-[10px] text-gray-400 self-center ml-2">
            {trending.total} items found
          </span>
        )}
      </div>

      {/* Top 3 Recommended */}
      {!loading && topRecommended.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200 p-4">
          <h2 className="text-sm font-semibold text-orange-900 mb-3 flex items-center gap-1.5">
            <Trophy size={14} /> Top 3 Recommended for You
          </h2>
          <div className="space-y-3">
            {topRecommended.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-white rounded-lg p-3 border border-orange-100"
              >
                <span className="shrink-0 w-7 h-7 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">
                  {item.isBreaking ? <Flame size={12} /> : `#${item.rank}`}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <SourceBadge source={item.source} />
                    {item.isBreaking && (
                      <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium animate-pulse">
                        BREAKING
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 leading-snug">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleGenerate(item)}
                  disabled={generating === item.title}
                  className="shrink-0 text-xs text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-full font-medium disabled:opacity-50"
                >
                  {generating === item.title ? "Writing…" : "Write"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-xl shimmer" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500 text-sm">No trending items found for this filter.</p>
        </div>
      )}

      {/* Items */}
      {!loading &&
        filtered.map((item, i) => (
          <article
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <SourceBadge source={item.source} />
                  {item.relevant && (
                    <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
                      Relevant to your stack
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-gray-900 text-sm leading-snug">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400 flex-wrap">
                  {item.stars > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Star size={10} /> {item.stars}
                    </span>
                  )}
                  {item.score > 0 && (
                    <span className="flex items-center gap-0.5">
                      <TrendingUp size={10} /> {item.score} pts
                    </span>
                  )}
                  {item.reactions > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Heart size={10} /> {item.reactions}
                    </span>
                  )}
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-linkedin hover:underline"
                    >
                      View source
                    </a>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleGenerate(item)}
                disabled={generating === item.title}
                className="shrink-0 text-xs text-white bg-linkedin hover:bg-linkedin-hover px-3 py-1.5 rounded-full font-medium disabled:opacity-50 transition"
              >
                {generating === item.title ? "Writing…" : "Write Post"}
              </button>
            </div>
          </article>
        ))}
    </div>
  );
}

function SourceBadge({ source }) {
  const colors = {
    "GitHub Trending": "bg-gray-900 text-white",
    "Hacker News": "bg-orange-500 text-white",
    "dev.to": "bg-black text-white",
    npm: "bg-red-600 text-white",
  };
  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
        colors[source] || "bg-gray-200 text-gray-700"
      }`}
    >
      {source}
    </span>
  );
}

function getTopRecommended(relevant, other) {
  if (relevant.length === 0 && other.length === 0) return [];
  const all = [...relevant, ...other];
  const scored = all.map((item) => {
    const engagement =
      (item.score || 0) + (item.stars || 0) * 2 + (item.reactions || 0) * 3;
    const relevanceBoost = item.relevant ? 50 : 0;
    return { ...item, totalScore: engagement + relevanceBoost };
  });
  const avgScore =
    scored.reduce((sum, s) => sum + s.totalScore, 0) / scored.length || 1;
  const breaking = scored.filter((s) => s.totalScore > avgScore * 3);
  const sorted = scored.sort((a, b) => b.totalScore - a.totalScore);
  return sorted.slice(0, 3).map((item, i) => ({
    ...item,
    isBreaking: breaking.some((b) => b.title === item.title),
    rank: i + 1,
  }));
}
