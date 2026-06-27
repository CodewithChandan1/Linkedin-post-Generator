import { useState, useEffect } from "react";
import { Flame, Star, RefreshCw } from "lucide-react";

export default function TrendingPanel({ onGenerateFromTrending }) {
  const [trending, setTrending] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(null);
  const [expanded, setExpanded] = useState(false);

  async function fetchTrending() {
    setLoading(true);
    try {
      const res = await fetch("/api/trending");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTrending(data);
    } catch {
      setTrending({ relevant: [], other: [], total: 0, sources: {} });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTrending();
  }, []);

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
    } catch (err) {
      alert(`Failed: ${err.message}`);
    } finally {
      setGenerating(null);
    }
  }

  const items = trending?.relevant || [];
  const displayItems = expanded ? items : items.slice(0, 4);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
          <Flame size={14} className="text-orange-500" /> Trending Now
        </h3>
        <button
          onClick={fetchTrending}
          disabled={loading}
          className="text-xs text-linkedin hover:underline disabled:opacity-50 flex items-center gap-1"
        >
          <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {loading && !trending && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded shimmer" />
          ))}
        </div>
      )}

      {trending && items.length === 0 && (
        <p className="text-xs text-gray-500">No relevant trending topics right now.</p>
      )}

      {displayItems.map((item, i) => (
        <div key={i} className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800 leading-tight truncate">
              {item.title}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>{item.source}</span>
              {item.stars > 0 && <span className="flex items-center gap-0.5"><Star size={9} /> {item.stars}</span>}
              {item.score > 0 && <span>{item.score}pts</span>}
            </p>
          </div>
          <button
            onClick={() => handleGenerate(item)}
            disabled={generating === item.title}
            className="shrink-0 text-[10px] text-linkedin border border-linkedin/30 px-2 py-0.5 rounded-full hover:bg-linkedin/10 disabled:opacity-50"
          >
            {generating === item.title ? "…" : "Write"}
          </button>
        </div>
      ))}

      {items.length > 4 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-linkedin hover:underline mt-2"
        >
          {expanded ? "Show less" : `+${items.length - 4} more`}
        </button>
      )}

      {trending?.sources && (
        <p className="text-[10px] text-gray-400 mt-2">
          GH {trending.sources.github} · HN {trending.sources.hn} · dev.to {trending.sources.devto} · npm {trending.sources.npm}
        </p>
      )}
    </div>
  );
}
