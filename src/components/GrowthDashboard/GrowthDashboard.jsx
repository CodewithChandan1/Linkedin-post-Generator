"use client";
// Growth Dashboard — Phase 6 hub
// Streak, best post analyzer, evergreen recycler, all Phase 6 tools
// PRD §6

import { useState, useMemo } from "react";
import { getBestTopics, getEvergreenCandidates, loadAnalytics, updatePostAnalytics, getTopPosts, engagementScore } from "@/lib/analytics";
import { getCurrentMonthSummary, OPPORTUNITY_TYPES } from "@/lib/opportunities";
import { loadOpportunities } from "@/lib/opportunities";
import {
  Trophy, BarChart2, RefreshCw, Newspaper, MessageSquare,
  Eye, Calendar, ThumbsUp, Share2, Flame, Lightbulb, TrendingUp, Mail
} from "lucide-react";

function computeStreak(posts) {
  if (posts.length === 0) return 0;
  const dates = new Set(posts.map((p) => p.date));
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().slice(0, 10);
    if (dates.has(key)) { streak++; }
    else if (i !== 0) { break; }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export default function GrowthDashboard({
  posts,
  onClose,
  onOpenNewsletterGenerator,
  onOpenStrategicComments,
  onOpenProfileVisitor,
  onOpenContentCalendar,
  onRefreshPost,
  onUpdatePostMetrics,
  onSyncLinkedInStats,
  settings,
}) {
  const [analyticsData, setAnalyticsData] = useState(() => loadAnalytics());
  const [editingId, setEditingId] = useState(null);
  const [editMetrics, setEditMetrics] = useState({});
  const [tab, setTab] = useState("overview"); // overview | analytics | analyzer | evergreen
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null); // { count, timestamp }

  const streak = useMemo(() => computeStreak(posts), [posts]);
  const postedPosts = posts.filter((p) => p.status === "posted");
  const topPosts = useMemo(() => getTopPosts(posts, analyticsData, 3), [posts, analyticsData]);
  const bestTopics = useMemo(() => getBestTopics(posts, analyticsData), [posts, analyticsData]);
  const evergreen = useMemo(() => getEvergreenCandidates(posts, analyticsData), [posts, analyticsData]);
  const opps = useMemo(() => loadOpportunities(), []);
  const { summary: oppSummary, total: oppTotal } = useMemo(() => getCurrentMonthSummary(opps), [opps]);

  // Aggregate analytics computations
  const isDemoData = useMemo(() => {
    return !posts.some((p) => p.status === "posted");
  }, [posts]);

  const publishedPostsSorted = useMemo(() => {
    const published = [...posts]
      .filter((p) => p.status === "posted")
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-10);
    
    if (published.length > 0) return published;

    // High-fidelity fallback/demo data for initial preview
    return [
      { id: "mock-1", date: "06-20", topic: "Next.js", content: "Optimizing Next.js App Router for production...", impressions: 450, clicks: 12 },
      { id: "mock-2", date: "06-21", topic: "React", content: "Understanding React Server Components vs Client Components...", impressions: 780, clicks: 35 },
      { id: "mock-3", date: "06-22", topic: "Node.js", content: "Scaling Node.js APIs to 10k requests per second...", impressions: 620, clicks: 22 },
      { id: "mock-4", date: "06-23", topic: "Web3", content: "Building decentralized apps on ICP blockchain...", impressions: 980, clicks: 58 },
      { id: "mock-5", date: "06-24", topic: "MongoDB", content: "Index optimization tips for large MongoDB databases...", impressions: 1100, clicks: 42 },
      { id: "mock-6", date: "06-25", topic: "TypeScript", content: "Advanced TypeScript type gymnastics you should know...", impressions: 850, clicks: 29 },
      { id: "mock-7", date: "06-26", topic: "DevOps", content: "Dockerizing your Next.js application for development...", impressions: 1300, clicks: 75 },
    ];
  }, [posts]);

  const totalImpressions = useMemo(() => {
    if (!isDemoData) {
      return posts.reduce((sum, p) => sum + (p.impressions || p.views || 0), 0);
    }
    return publishedPostsSorted.reduce((sum, p) => sum + (p.impressions || 0), 0);
  }, [posts, isDemoData, publishedPostsSorted]);

  const totalClicks = useMemo(() => {
    if (!isDemoData) {
      return posts.reduce((sum, p) => sum + (p.clicks || 0), 0);
    }
    return publishedPostsSorted.reduce((sum, p) => sum + (p.clicks || 0), 0);
  }, [posts, isDemoData, publishedPostsSorted]);

  const ctr = useMemo(() => {
    if (totalImpressions === 0) return 0;
    return ((totalClicks / totalImpressions) * 100).toFixed(1);
  }, [totalImpressions, totalClicks]);

  const maxImpressions = useMemo(() => {
    const vals = publishedPostsSorted.map((p) => p.impressions || p.views || 0);
    return vals.length > 0 ? Math.max(...vals, 10) : 10;
  }, [publishedPostsSorted]);

  const maxClicks = useMemo(() => {
    const vals = publishedPostsSorted.map((p) => p.clicks || 0);
    return vals.length > 0 ? Math.max(...vals, 10) : 10;
  }, [publishedPostsSorted]);

  function saveMetrics(postId) {
    const updated = updatePostAnalytics(postId, editMetrics);
    setAnalyticsData(updated);
    setEditingId(null);
    setEditMetrics({});
    onUpdatePostMetrics?.(postId, editMetrics);
  }

  async function handleSyncStats() {
    if (!onSyncLinkedInStats) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const count = await onSyncLinkedInStats();
      setSyncResult({ count: count || 0, timestamp: new Date().toLocaleTimeString() });
    } catch {
      setSyncResult({ count: 0, error: true, timestamp: new Date().toLocaleTimeString() });
    } finally {
      setSyncing(false);
    }
  }

  const TABS = [
    { key: "overview", label: "Overview", icon: <BarChart2 size={13} /> },
    { key: "analytics", label: "Analytics", icon: <TrendingUp size={13} /> },
    { key: "analyzer", label: "Best Posts", icon: <Trophy size={13} /> },
    { key: "evergreen", label: "Evergreen", icon: <RefreshCw size={13} /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Trophy size={16} className="text-linkedin" /> Growth Dashboard
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Phase 6 — analytics, evergreen, and growth tools</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`py-2.5 px-3 text-xs font-medium border-b-2 -mb-px transition whitespace-nowrap flex items-center gap-1.5 ${
                tab === t.key ? "border-linkedin text-linkedin" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4">
          {/* OVERVIEW TAB */}
          {tab === "overview" && (
            <>
              {/* Streak + key stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBox
                  value={streak}
                  suffix="d"
                  label="Posting streak"
                  color={streak >= 7 ? "text-green-700" : streak >= 3 ? "text-amber-700" : "text-gray-700"}
                  bg={streak >= 7 ? "bg-green-50 border-green-200" : streak >= 3 ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"}
                />
                <StatBox value={postedPosts.length} label="Total published" />
                <StatBox value={posts.length - postedPosts.length} label="In draft" />
                <StatBox value={oppTotal} label="Opportunities this month" color="text-linkedin" bg="bg-linkedin/5 border-linkedin/20" />
              </div>

              {/* Streak milestone message */}
              {streak > 0 && (
                <div className={`rounded-xl border p-3 text-sm font-medium ${
                  streak >= 30 ? "bg-green-50 border-green-300 text-green-800" :
                  streak >= 14 ? "bg-blue-50 border-blue-300 text-blue-800" :
                  streak >= 7 ? "bg-amber-50 border-amber-300 text-amber-800" :
                  "bg-gray-50 border-gray-200 text-gray-700"
                }`}>
                  {streak >= 30 ? <><Trophy size={14} className="inline mr-1" /> Day {streak} of consistent posting — you're in the top 1% of LinkedIn creators!</> :
                   streak >= 14 ? <><Flame size={14} className="inline mr-1" /> Day {streak} streak! 2 weeks of daily posting — LinkedIn algorithm is starting to recognize your authority.</> :
                   streak >= 7 ? <>Day {streak} streak! One full week — keep going, results compound from here.</> :
                   <>Day {streak} of your posting journey. Results start showing after 30+ consistent days.</>}
                </div>
              )}

              {/* Opportunities this month */}
              {oppTotal > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">This month's opportunities</p>
                  <div className="grid grid-cols-2 gap-2">
                    {OPPORTUNITY_TYPES.filter(({ key }) => oppSummary[key] > 0).map(({ key, label, icon }) => (
                      <div key={key} className="flex items-center gap-2 bg-linkedin/5 border border-linkedin/10 rounded-lg px-3 py-2">
                        <span className="text-lg">{icon}</span>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{oppSummary[key]}</p>
                          <p className="text-[10px] text-gray-500">{label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Phase 6 Quick Access */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Phase 6 Tools</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Newsletter", icon: <Newspaper size={13} />, action: onOpenNewsletterGenerator },
                    { label: "Strategic Comments", icon: <MessageSquare size={13} />, action: onOpenStrategicComments },
                    { label: "Profile Visits", icon: <Eye size={13} />, action: onOpenProfileVisitor },
                    { label: "Content Calendar", icon: <Calendar size={13} />, action: onOpenContentCalendar },
                  ].map(({ label, icon, action }) => (
                    <button
                      key={label}
                      onClick={() => { action?.(); onClose(); }}
                      className="text-left text-xs text-gray-700 bg-gray-50 hover:bg-linkedin/10 hover:text-linkedin border border-gray-200 rounded-lg px-3 py-2.5 transition flex items-center gap-2"
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ANALYTICS TAB */}
          {tab === "analytics" && (
            <>
              {/* LinkedIn Stats Sync */}
              <div className="flex items-center justify-between bg-linkedin/5 border border-linkedin/20 rounded-xl p-3">
                <div>
                  <p className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-linkedin" /> Auto-sync from LinkedIn
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Pulls reactions &amp; comments for posts with a LinkedIn post ID.
                    {syncResult && !syncResult.error && (
                      <span className="text-green-600 ml-1">
                        ✓ Synced {syncResult.count} post{syncResult.count !== 1 ? "s" : ""} at {syncResult.timestamp}
                      </span>
                    )}
                    {syncResult?.error && (
                      <span className="text-red-500 ml-1">Sync failed — check LinkedIn connection.</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={handleSyncStats}
                  disabled={syncing || !onSyncLinkedInStats}
                  className="text-xs text-linkedin border border-linkedin/30 px-3 py-1.5 rounded-full hover:bg-linkedin/10 disabled:opacity-40 flex items-center gap-1.5 shrink-0 transition"
                >
                  <RefreshCw size={11} className={syncing ? "animate-spin" : ""} />
                  {syncing ? "Syncing…" : "Sync Now"}
                </button>
              </div>

              {isDemoData && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs flex items-start gap-2 mb-1">
                  <span className="text-base mt-0.5">💡</span>
                  <div>
                    <span className="font-semibold">Showing Demo Performance Data:</span> Since you don't have published posts yet, we are showing sample metrics. Generate posts, publish them, or log metrics manually in the <button className="font-bold underline text-linkedin hover:text-linkedin-dark" onClick={() => setTab("analyzer")}>Best Posts</button> tab to see your live growth chart!
                  </div>
                </div>
              )}

              {/* Key analytics stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBox
                  value={settings?.emailsSentCount || 0}
                  label="Automated reminders sent"
                  color="text-purple-700"
                  bg="bg-purple-50 border-purple-200"
                />
                <StatBox
                  value={totalImpressions}
                  label="Total Impressions"
                  color="text-linkedin"
                  bg="bg-sky-50 border-sky-200"
                />
                <StatBox
                  value={totalClicks}
                  label="Total Link Clicks"
                  color="text-orange-700"
                  bg="bg-orange-50 border-orange-200"
                />
                <StatBox
                  value={`${ctr}%`}
                  label="Click-Through Rate (CTR)"
                  color="text-emerald-700"
                  bg="bg-emerald-50 border-emerald-200"
                />
              </div>

              {/* Chart block */}
              {publishedPostsSorted.length > 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-800">LinkedIn Performance Trend</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {isDemoData ? "Showing mock growth progression" : "Showing last 10 posted updates"}
                      </p>
                    </div>
                    <div className="flex gap-3 text-[10px] font-semibold">
                      <span className="flex items-center gap-1.5 text-linkedin">
                        <span className="w-2.5 h-2.5 bg-[#0077b5] rounded-full"></span> Impressions
                      </span>
                      <span className="flex items-center gap-1.5 text-orange-600">
                        <span className="w-2.5 h-2.5 bg-[#ea580c] rounded-full"></span> Clicks
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    <svg viewBox="0 0 500 200" className="w-full h-auto overflow-visible">
                      {/* Gridlines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                        const y = 20 + ratio * 130;
                        return (
                          <line
                            key={ratio}
                            x1="45"
                            y1={y}
                            x2="455"
                            y2={y}
                            stroke="#e5e7eb"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                        );
                      })}

                      {/* X and Y Axes */}
                      <line x1="45" y1="20" x2="45" y2="150" stroke="#9ca3af" strokeWidth="1" />
                      <line x1="45" y1="150" x2="455" y2="150" stroke="#9ca3af" strokeWidth="1" />

                      {/* Left Y Axis Labels (Impressions) */}
                      <text x="38" y="24" textAnchor="end" className="text-[9px] fill-gray-400 font-semibold">
                        {maxImpressions}
                      </text>
                      <text x="38" y="85" textAnchor="end" className="text-[9px] fill-gray-400 font-semibold">
                        {Math.round(maxImpressions / 2)}
                      </text>
                      <text x="38" y="150" textAnchor="end" className="text-[9px] fill-gray-400 font-semibold">
                        0
                      </text>

                      {/* Right Y Axis Labels (Clicks) */}
                      <text x="462" y="24" textAnchor="start" className="text-[9px] fill-gray-400 font-semibold">
                        {maxClicks}
                      </text>
                      <text x="462" y="85" textAnchor="start" className="text-[9px] fill-gray-400 font-semibold">
                        {Math.round(maxClicks / 2)}
                      </text>
                      <text x="462" y="150" textAnchor="start" className="text-[9px] fill-gray-400 font-semibold">
                        0
                      </text>

                      {/* X Axis Labels */}
                      {publishedPostsSorted.map((p, i) => {
                        const x = 45 + (i * (410 / Math.max(1, publishedPostsSorted.length - 1)));
                        return (
                          <text
                            key={`x-label-${p.id}`}
                            x={x}
                            y="168"
                            textAnchor="middle"
                            className="text-[9px] fill-gray-400 font-semibold"
                          >
                            {p.date}
                          </text>
                        );
                      })}

                      {/* Impression path */}
                      {(() => {
                        const points = publishedPostsSorted.map((p, i) => {
                          const x = 45 + (i * (410 / Math.max(1, publishedPostsSorted.length - 1)));
                          const val = p.impressions || p.views || 0;
                          const y = 150 - (val / maxImpressions * 130);
                          return `${x},${y}`;
                        }).join(" ");
                        return (
                          <polyline
                            fill="none"
                            stroke="#0077b5"
                            strokeWidth="2.5"
                            points={points}
                            className="transition-all duration-300"
                          />
                        );
                      })()}

                      {/* Clicks path */}
                      {(() => {
                        const points = publishedPostsSorted.map((p, i) => {
                          const x = 45 + (i * (410 / Math.max(1, publishedPostsSorted.length - 1)));
                          const val = p.clicks || 0;
                          const y = 150 - (val / maxClicks * 130);
                          return `${x},${y}`;
                        }).join(" ");
                        return (
                          <polyline
                            fill="none"
                            stroke="#ea580c"
                            strokeWidth="2"
                            points={points}
                            className="transition-all duration-300"
                          />
                        );
                      })()}

                      {/* Interactive Areas/Hover Dots */}
                      {publishedPostsSorted.map((p, i) => {
                        const x = 45 + (i * (410 / Math.max(1, publishedPostsSorted.length - 1)));
                        const impVal = p.impressions || p.views || 0;
                        const yImp = 150 - (impVal / maxImpressions * 130);
                        const clkVal = p.clicks || 0;
                        const yClk = 150 - (clkVal / maxClicks * 130);

                        return (
                          <g key={p.id}>
                            {/* Hover detection column */}
                            <rect
                              x={x - 15}
                              y="20"
                              width="30"
                              height="130"
                              fill="transparent"
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredIndex(i)}
                              onMouseLeave={() => setHoveredIndex(null)}
                            />

                            {/* Guideline on hover */}
                            {hoveredIndex === i && (
                              <line
                                x1={x}
                                y1="20"
                                x2={x}
                                y2="150"
                                stroke="#cbd5e1"
                                strokeWidth="1.5"
                                strokeDasharray="2 2"
                              />
                            )}

                            {/* Impression Dot */}
                            <circle
                              cx={x}
                              cy={yImp}
                              r={hoveredIndex === i ? 5.5 : 3.5}
                              fill="#0077b5"
                              stroke="#ffffff"
                              strokeWidth={hoveredIndex === i ? 2 : 1}
                              className="transition-all duration-200 pointer-events-none"
                            />

                            {/* Clicks Dot */}
                            <circle
                              cx={x}
                              cy={yClk}
                              r={hoveredIndex === i ? 5.5 : 3.5}
                              fill="#ea580c"
                              stroke="#ffffff"
                              strokeWidth={hoveredIndex === i ? 2 : 1}
                              className="transition-all duration-200 pointer-events-none"
                            />
                          </g>
                        );
                      })}
                    </svg>

                    {/* Tooltip Overlay */}
                    {hoveredIndex !== null && publishedPostsSorted[hoveredIndex] && (
                      <div
                        className="absolute bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-2.5 shadow-lg text-[11px] pointer-events-none z-20 transition-all duration-200"
                        style={{
                          left: `${45 + (hoveredIndex * (90 / Math.max(1, publishedPostsSorted.length - 1)))}%`,
                          top: "10px",
                          transform: hoveredIndex > publishedPostsSorted.length / 2 ? "translateX(-105%)" : "translateX(5%)",
                        }}
                      >
                        <p className="font-bold text-gray-800 border-b border-gray-100 pb-1 mb-1 flex justify-between gap-4">
                          <span>📅 {publishedPostsSorted[hoveredIndex].date}</span>
                          <span className="text-gray-400 capitalize">{publishedPostsSorted[hoveredIndex].topic || "Post"}</span>
                        </p>
                        <p className="text-gray-600 line-clamp-2 max-w-[180px] mb-1.5 italic">
                          "{publishedPostsSorted[hoveredIndex].content}"
                        </p>
                        <div className="flex gap-3 font-semibold pt-1 border-t border-gray-50">
                          <span className="text-linkedin">
                            👀 Views: {publishedPostsSorted[hoveredIndex].impressions || publishedPostsSorted[hoveredIndex].views || 0}
                          </span>
                          <span className="text-orange-600">
                            🖱️ Clicks: {publishedPostsSorted[hoveredIndex].clicks || 0}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 border border-dashed border-gray-200 rounded-xl">
                  <BarChart2 className="mx-auto mb-2 text-gray-300" size={24} />
                  <p className="text-xs font-semibold">No published posts yet</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Post metrics will appear here after publishing.</p>
                </div>
              )}
            </>
          )}

          {/* BEST POSTS ANALYZER TAB */}
          {tab === "analyzer" && (
            <>
              <p className="text-xs text-gray-500">Log engagement metrics from LinkedIn Analytics to surface your best-performing posts and topics.</p>

              {/* Best topics */}
              {bestTopics.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">Top performing topics</p>
                  <div className="space-y-1.5">
                    {bestTopics.slice(0, 5).map((t, i) => (
                      <div key={t.topic} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                        <span className={`text-xs font-bold w-5 ${i === 0 ? "text-amber-500" : "text-gray-400"}`}>#{i + 1}</span>
                        <span className="flex-1 text-xs text-gray-800">{t.topic}</span>
                        <span className="text-xs text-gray-500">{t.postCount} posts</span>
                        <span className="text-xs font-medium text-linkedin">{t.avgScore} avg score</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Log engagement per post */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Log engagement from LinkedIn Analytics</p>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {postedPosts.slice(0, 10).map((p) => {
                    const m = {
                      likes: p.likes || 0,
                      comments: p.comments || 0,
                      shares: p.shares || 0,
                      views: p.views || 0,
                      impressions: p.impressions || 0,
                      clicks: p.clicks || 0,
                      ...(analyticsData[p.id] || {})
                    };
                    const score = engagementScore(m);
                    return (
                      <div key={p.id} className="border border-gray-200 rounded-xl p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{p.topic} — {p.date}</p>
                            <p className="text-[11px] text-gray-500 line-clamp-1">{p.content?.slice(0, 60)}…</p>
                          </div>
                          {score > 0 && (
                            <span className="text-[10px] text-linkedin bg-linkedin/10 px-1.5 py-0.5 rounded shrink-0">
                              score: {score}
                            </span>
                          )}
                        </div>

                        {editingId === p.id ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                              {["likes", "comments", "shares", "views", "impressions", "clicks"].map((field) => (
                                <div key={field}>
                                  <label className="text-[9px] text-gray-500 uppercase block mb-0.5">{field}</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={editMetrics[field] ?? m[field] ?? ""}
                                    onChange={(e) => setEditMetrics((prev) => ({ ...prev, [field]: Number(e.target.value) }))}
                                    className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-linkedin/30"
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-1.5">
                              <button onClick={() => saveMetrics(p.id)} className="flex-1 bg-linkedin text-white text-xs py-1 rounded-full">Save</button>
                              <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 px-3 py-1 rounded-full border border-gray-200">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500 max-w-[80%]">
                              {score > 0 || m.impressions > 0 || m.clicks > 0 ? (
                                <>
                                  <span className="flex items-center gap-0.5" title="Likes"><ThumbsUp size={11} /> {m.likes || 0}</span>
                                  <span className="flex items-center gap-0.5" title="Comments"><MessageSquare size={11} /> {m.comments || 0}</span>
                                  <span className="flex items-center gap-0.5" title="Shares"><Share2 size={11} /> {m.shares || 0}</span>
                                  <span className="flex items-center gap-0.5" title="Views"><Eye size={11} /> {m.views || 0}</span>
                                  <span className="flex items-center gap-0.5" title="Impressions"><BarChart2 size={11} /> {m.impressions || 0}</span>
                                  <span className="flex items-center gap-0.5" title="Clicks"><TrendingUp size={11} /> {m.clicks || 0}</span>
                                </>
                              ) : (
                                <span className="text-gray-400 italic">No data yet</span>
                              )}
                            </div>
                            <button
                              onClick={() => { setEditingId(p.id); setEditMetrics(m); }}
                              className="text-[10px] text-linkedin border border-linkedin/30 px-2 py-0.5 rounded-full hover:bg-linkedin/10"
                            >
                              {score > 0 || m.impressions > 0 || m.clicks > 0 ? "Update" : "Log"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* EVERGREEN TAB */}
          {tab === "evergreen" && (
            <>
              <p className="text-xs text-gray-500">
                Posts older than 90 days with high engagement — LinkedIn resurfaces old high-performing content.
                Repost with a fresh hook for zero ideation effort.
              </p>

              {evergreen.length === 0 ? (
                <div className="text-center py-8">
                  <RefreshCw size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-600">No evergreen candidates yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Log engagement metrics in the "Best Posts" tab — posts older than 90 days with high scores appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {evergreen.map((p) => (
                    <div key={p.id} className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                              <RefreshCw size={10} /> Evergreen
                            </span>
                            <span className="text-xs text-gray-500">{p.date}</span>
                          </div>
                          <p className="text-sm font-medium text-gray-900">{p.topic}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold text-amber-700">{p.score}</p>
                          <p className="text-[10px] text-gray-500">eng. score</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-700 line-clamp-3 mb-3">{p.content?.slice(0, 200)}…</p>
                      <div className="flex gap-3 text-[11px] text-gray-500 mb-3">
                        <span className="flex items-center gap-0.5"><ThumbsUp size={11} /> {p.metrics?.likes || 0}</span>
                        <span className="flex items-center gap-0.5"><MessageSquare size={11} /> {p.metrics?.comments || 0}</span>
                        <span className="flex items-center gap-0.5"><Share2 size={11} /> {p.metrics?.shares || 0}</span>
                        <span className="flex items-center gap-0.5"><Eye size={11} /> {p.metrics?.views || 0}</span>
                      </div>
                      <div className="bg-white border border-amber-200 rounded-lg p-2.5 mb-3">
                        <p className="text-[11px] text-amber-800 flex items-start gap-1.5">
                          <Lightbulb size={11} className="shrink-0 mt-0.5" />
                          This post got strong engagement. Repost with an updated hook — 60% of your current followers haven't seen it.
                        </p>
                      </div>
                      <button
                        onClick={() => { onRefreshPost?.(p); onClose(); }}
                        className="text-xs text-white bg-amber-500 hover:bg-amber-600 px-4 py-1.5 rounded-full font-medium transition flex items-center gap-1.5"
                      >
                        <RefreshCw size={12} /> Refresh &amp; Repost
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ value, suffix = "", label, color = "text-gray-900", bg = "bg-gray-50 border-gray-200" }) {
  return (
    <div className={`rounded-xl border p-3 text-center ${bg}`}>
      <p className={`text-2xl font-bold ${color}`}>{value}{suffix}</p>
      <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{label}</p>
    </div>
  );
}
