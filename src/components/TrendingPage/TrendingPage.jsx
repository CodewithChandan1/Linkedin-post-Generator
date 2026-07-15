import { useState, useEffect } from "react";
import { Flame, Trophy, Star, TrendingUp, Heart, ArrowLeft, RefreshCw, BookOpen, ExternalLink } from "lucide-react";

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
    { key: "all", label: "All Topics" },
    { key: "github", label: "GitHub" },
    { key: "hacker", label: "Hacker News" },
    { key: "dev.to", label: "dev.to" },
    { key: "npm", label: "NPM Registry" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Flame size={16} className="text-linkedin" /> Trending Tech Insights
          </h1>
          <p className="text-[11px] text-gray-400 mt-1 leading-normal font-semibold">
            Monitor real-time hot developer updates and write optimized LinkedIn posts in 1 click
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchTrending}
            disabled={loading}
            className="text-xs font-bold text-linkedin border border-linkedin/10 hover:bg-linkedin/5 px-4 py-2 rounded-xl transition disabled:opacity-50 flex items-center gap-1.5 bg-white shadow-sm"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            {loading ? "Loading…" : "Refresh"}
          </button>
          <button
            onClick={onClose}
            className="text-xs font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 bg-white px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <ArrowLeft size={12} /> Back to Feed
          </button>
        </div>
      </div>

      {/* Source filters */}
      <div className="flex flex-wrap items-center gap-2 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100">
        {SOURCE_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-xs px-3.5 py-1.5 rounded-xl transition-all font-bold ${
              filter === key
                ? "bg-white text-linkedin shadow-sm border border-gray-200/80"
                : "text-gray-500 hover:text-gray-900 border border-transparent"
            }`}
          >
            {label}
          </button>
        ))}
        {trending?.sources && (
          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider ml-auto pr-3 hidden md:inline">
            {trending.total} items discovered
          </span>
        )}
      </div>

      <style>{`
        @keyframes snake-border {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-snake-border {
          animation: snake-border 5s linear infinite;
        }
      `}</style>

      {/* Top 3 Recommended */}
      {!loading && topRecommended.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-gray-50">
            <Trophy size={13} className="text-linkedin" /> Recommended trending topics for you
          </h2>
          <div className="space-y-3.5">
            {topRecommended.map((item, i) => (
              <div
                key={i}
                className="relative p-[1.5px] overflow-hidden rounded-[18px] shadow-sm hover:shadow-md transition-all duration-300"
              >
                {/* Snake Border Background */}
                <div className="absolute inset-[-400%] bg-[conic-gradient(from_90deg_at_50%_50%,#0A66C2_0%,#a5b4fc_35%,#0A66C2_50%,#a5b4fc_85%,#0A66C2_100%)] animate-snake-border" />
                
                {/* Inner Content Card */}
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between bg-white rounded-[17px] p-5 w-full h-full z-10">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <SourceBadge source={item.source} />
                      <span className="text-[9px] font-extrabold bg-[#0A66C2]/10 text-[#0A66C2] px-2 py-0.5 rounded-md uppercase tracking-wider">
                        ★ Top {item.rank} Recommended
                      </span>
                      {item.isBreaking && (
                        <span className="text-[8px] font-extrabold bg-rose-50 border border-rose-100 text-rose-600 px-2 py-0.5 rounded-md tracking-wider uppercase">
                          BREAKING
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-900 leading-relaxed">
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-xs text-gray-500 leading-relaxed font-medium">{item.description}</p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleGenerate(item)}
                    disabled={generating === item.title}
                    className="w-full sm:w-auto shrink-0 text-xs text-white bg-linkedin hover:bg-linkedin-hover px-5 py-2.5 rounded-xl font-bold transition shadow-sm active:scale-[0.99]"
                  >
                    {generating === item.title ? "Writing..." : "Write AI Post"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl shimmer" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-10 text-center shadow-sm">
          <BookOpen size={28} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 text-xs font-semibold">No trending items found for this filter.</p>
        </div>
      )}

      {/* Items List */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((item, i) => (
             <article
              key={i}
              className="bg-white rounded-2xl border border-gray-200/80 p-6 hover:shadow-md transition duration-200 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <SourceBadge source={item.source} />
                    {item.relevant && (
                      <span className="text-[9px] font-extrabold bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Matched Stack
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm leading-relaxed">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">{item.description}</p>
                  )}
                  <div className="flex items-center gap-4 pt-2 border-t border-gray-55 text-[10px] text-gray-400 font-bold uppercase tracking-wider flex-wrap">
                    {item.stars > 0 && (
                      <span className="flex items-center gap-1">
                        <Star size={11} className="text-amber-500 fill-amber-500" /> {item.stars} Stars
                      </span>
                    )}
                    {item.score > 0 && (
                      <span className="flex items-center gap-1">
                        <TrendingUp size={11} className="text-linkedin" /> {item.score} Points
                      </span>
                    )}
                    {item.reactions > 0 && (
                      <span className="flex items-center gap-1">
                        <Heart size={11} className="text-rose-500 fill-rose-500" /> {item.reactions} Likes
                      </span>
                    )}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-linkedin hover:underline flex items-center gap-0.5 font-bold"
                      >
                        Source <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleGenerate(item)}
                  disabled={generating === item.title}
                  className="w-full sm:w-auto shrink-0 text-xs text-white bg-linkedin hover:bg-linkedin-hover px-5 py-2.5 rounded-xl font-bold transition shadow-sm active:scale-[0.99]"
                >
                  {generating === item.title ? "Writing..." : "Write Post"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function SourceBadge({ source }) {
  const colors = {
    "GitHub Trending": "bg-gray-100 text-gray-800 border-gray-200",
    "Hacker News": "bg-orange-50 text-orange-700 border-orange-200/50",
    "dev.to": "bg-gray-50 text-gray-900 border-gray-200/40",
    npm: "bg-red-50 text-red-700 border-red-200/50",
  };
  return (
    <span
      className={`text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded border ${
        colors[source] || "bg-gray-100 text-gray-700 border-gray-200"
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
