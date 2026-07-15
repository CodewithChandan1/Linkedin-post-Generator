"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Bookmark, BookOpen, ExternalLink, Edit3, Check, Save } from "lucide-react";
import Drawer from "@/components/Drawer/Drawer";

const TAGS = [
  { id: "webdev", label: "Web Dev 🌐" },
  { id: "javascript", label: "JavaScript 🟨" },
  { id: "react", label: "React ⚛️" },
  { id: "ai", label: "AI & ML 🤖" },
  { id: "startup", label: "Startups 🚀" },
];

export default function BlogReader({ open, onClose, onPostGenerated }) {
  const [activeTab, setActiveTab] = useState("trending"); // trending | saved
  const [selectedTag, setSelectedTag] = useState("webdev");
  const [articles, setArticles] = useState([]);
  const [savedBlogs, setSavedBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Reader view state
  const [activeArticleId, setActiveArticleId] = useState(null);
  const [fullArticle, setFullArticle] = useState(null);
  const [articleLoading, setArticleLoading] = useState(false);
  
  // Creator review notes state
  const [userNotes, setUserNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaveStatus, setNotesSaveStatus] = useState(""); // saved | error
  const [summarizing, setSummarizing] = useState(false);

  // Fetch trending blogs
  useEffect(() => {
    if (!open || activeTab !== "trending") return;
    async function loadTrending() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/blog/fetch?tag=${selectedTag}`);
        const data = await res.json();
        if (data.success) {
          setArticles(data.articles || []);
        } else {
          throw new Error(data.error || "Failed to load trending blogs");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadTrending();
  }, [open, activeTab, selectedTag]);

  // Fetch saved blogs
  const loadSavedBlogs = async () => {
    if (!open) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/blog/saved");
      const data = await res.json();
      if (data.success) {
        setSavedBlogs(data.saved || []);
      } else {
        throw new Error(data.error || "Failed to load saved blogs");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && activeTab === "saved") {
      loadSavedBlogs();
    }
  }, [open, activeTab]);

  // Load single full article
  useEffect(() => {
    if (!activeArticleId) {
      setFullArticle(null);
      return;
    }

    async function loadFullArticle() {
      setArticleLoading(true);
      try {
        const locallySaved = savedBlogs.find((b) => b.articleId === activeArticleId);
        
        const res = await fetch(`/api/blog/fetch?id=${activeArticleId}`);
        const data = await res.json();
        if (data.success) {
          setFullArticle(data.article);
          setUserNotes(locallySaved?.notes || "");
        } else {
          throw new Error(data.error || "Failed to load full article body");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setArticleLoading(false);
      }
    }
    loadFullArticle();
  }, [activeArticleId, savedBlogs]);

  // Bookmark / Save toggle
  async function toggleBookmark(article) {
    const isAlreadySaved = savedBlogs.some((b) => b.articleId === article.id?.toString());

    try {
      if (isAlreadySaved) {
        // Remove bookmark
        const res = await fetch(`/api/blog/saved?articleId=${article.id}`, { method: "DELETE" });
        if (res.ok) {
          setSavedBlogs((prev) => prev.filter((b) => b.articleId !== article.id?.toString()));
        }
      } else {
        // Add bookmark
        const res = await fetch("/api/blog/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            articleId: article.id?.toString(),
            title: article.title,
            description: article.description,
            coverImage: article.coverImage,
            author: article.author,
            url: article.url,
            readableContent: "",
            notes: "",
          }),
        });
        const data = await res.json();
        if (data.success) {
          setSavedBlogs((prev) => [data.saved, ...prev]);
        }
      }
    } catch (err) {
      console.error("Bookmark toggle failed:", err);
    }
  }

  // Save creator notes
  async function saveCreatorNotes() {
    if (!activeArticleId) return;
    setSavingNotes(true);
    setNotesSaveStatus("");
    try {
      setSavedBlogs((prev) =>
        prev.map((b) => (b.articleId === activeArticleId ? { ...b, notes: userNotes } : b))
      );

      const res = await fetch("/api/blog/saved", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: activeArticleId,
          notes: userNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotesSaveStatus("saved");
        setTimeout(() => setNotesSaveStatus(""), 2000);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setNotesSaveStatus("error");
    } finally {
      setSavingNotes(false);
    }
  }

  // Summarize to LinkedIn Post
  async function handleSummarize() {
    if (!fullArticle) return;
    setSummarizing(true);
    try {
      await saveCreatorNotes();

      const res = await fetch("/api/generate/blog-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fullArticle.title,
          content: fullArticle.bodyHtml.replace(/<[^>]*>/g, ""),
          notes: userNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate post");

      if (data.success && data.post) {
        onPostGenerated(data.post);
        onClose();
      }
    } catch (err) {
      alert(`Summarizer failed: ${err.message}`);
    } finally {
      setSummarizing(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      widthClass="w-[80vw]"
      zClass="z-50"
      bodyClassName="flex flex-col h-full bg-white overflow-hidden"
    >
      <div className="flex flex-col h-full overflow-hidden select-none">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-7 pb-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 text-linkedin rounded-xl flex items-center justify-center border border-blue-100">
              <BookOpen size={16} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Tech Blog Reader & Curator</h2>
              <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">Review global tech blogs and convert them to LinkedIn posts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-650 hover:bg-gray-100 rounded-xl transition text-2xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-100 px-6 shrink-0 bg-white">
          <button
            onClick={() => { setActiveTab("trending"); setActiveArticleId(null); }}
            className={`py-3 text-xs font-bold border-b-2 mr-6 transition-all ${
              activeTab === "trending" ? "border-linkedin text-linkedin font-black" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            🌐 Trending Feeds
          </button>
          <button
            onClick={() => { setActiveTab("saved"); setActiveArticleId(null); }}
            className={`py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === "saved" ? "border-linkedin text-linkedin font-black" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            🔖 Saved Blogs ({savedBlogs.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative flex">
          
          {/* Main Grid View */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            
            {/* Tag Pills (Only for Trending) */}
            {activeTab === "trending" && (
              <div className="flex flex-wrap gap-1.5 shrink-0">
                {TAGS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTag(t.id)}
                    className={`text-[10.5px] font-bold px-3.5 py-1.5 rounded-full border transition-all ${
                      selectedTag === t.id
                        ? "bg-linkedin text-white border-linkedin shadow-sm"
                        : "bg-gray-55 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 text-red-650 border border-red-100 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="border border-gray-200/80 rounded-2xl h-[340px] bg-white flex flex-col justify-between overflow-hidden p-0 animate-pulse shadow-sm">
                    <div className="h-32 bg-slate-100/85 w-full" />
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2.5">
                        <div className="h-3.5 bg-slate-100 rounded w-5/6" />
                        <div className="h-3 bg-slate-100 rounded w-2/3" />
                        <div className="h-2.5 bg-slate-100 rounded w-full" />
                        <div className="h-2.5 bg-slate-100 rounded w-11/12" />
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100" />
                          <div className="h-2 bg-slate-100 rounded w-16" />
                        </div>
                        <div className="h-2 bg-slate-100 rounded w-10" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {(activeTab === "trending" ? articles : savedBlogs).map((article) => {
                  const artId = article.id || article.articleId;
                  const isSaved = savedBlogs.some((b) => b.articleId === artId?.toString());
                  return (
                    <div
                      key={artId}
                      className="border border-gray-250/70 hover:border-linkedin/30 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow transition-all duration-200 flex flex-col h-[340px] group cursor-pointer relative"
                      onClick={() => setActiveArticleId(artId)}
                    >
                      <div className="h-32 bg-slate-105 relative shrink-0 overflow-hidden">
                        {article.coverImage ? (
                          <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                            <BookOpen size={24} className="text-slate-350" />
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(article);
                          }}
                          className={`absolute top-2.5 right-2.5 w-7.5 h-7.5 rounded-full flex items-center justify-center border shadow-sm transition-all active:scale-90 ${
                            isSaved
                              ? "bg-linkedin text-white border-linkedin"
                              : "bg-white/80 hover:bg-white text-gray-400 hover:text-gray-600 border-white"
                          }`}
                        >
                          <Bookmark size={12} className={isSaved ? "fill-white" : ""} />
                        </button>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
                        <div className="space-y-1.5 min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-linkedin transition-colors">
                            {article.title}
                          </h4>
                          <p className="text-[10px] text-gray-400 line-clamp-2 font-semibold">
                            {article.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-50 pt-2.5 mt-2 shrink-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {article.author?.profileImage && (
                              <img src={article.author.profileImage} alt={article.author.name} className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-100" />
                            )}
                            <span className="text-[9.5px] font-bold text-gray-600 truncate">{article.author?.name || "Anonymous"}</span>
                          </div>
                          <span className="text-[9px] text-gray-400 font-bold shrink-0">⏱️ {article.readingTime || 3} min</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {activeTab === "saved" && savedBlogs.length === 0 && (
                  <div className="col-span-full py-16 text-center space-y-3">
                    <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-350">
                      <Bookmark size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-700">No saved articles yet</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Click the bookmark icon on any trending article to save it here</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Detailed Reader Panel Overlay */}
          {activeArticleId && (
            <div className="absolute inset-0 bg-white z-20 flex flex-col animate-in slide-in-from-right duration-300">
              
              <div className="px-6 py-3.5 border-b border-gray-100 bg-gray-55 flex items-center justify-between shrink-0">
                <button
                  onClick={() => { setActiveArticleId(null); setFullArticle(null); }}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 font-bold"
                >
                  ← Back to List
                </button>
                {fullArticle && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleBookmark(fullArticle)}
                      className={`flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-full border transition-all ${
                        savedBlogs.some((b) => b.articleId === activeArticleId?.toString())
                          ? "bg-linkedin text-white border-linkedin shadow-sm"
                          : "bg-white border-gray-200 text-gray-650 hover:bg-gray-50"
                      }`}
                    >
                      <Bookmark size={11} className={savedBlogs.some((b) => b.articleId === activeArticleId?.toString()) ? "fill-white" : ""} />
                      <span>{savedBlogs.some((b) => b.articleId === activeArticleId?.toString()) ? "Saved 🔖" : "Save for Later"}</span>
                    </button>

                    <button
                      onClick={handleSummarize}
                      disabled={summarizing}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white flex items-center gap-1.5 text-xs font-extrabold px-4 py-1.5 rounded-full shadow-sm"
                    >
                      {summarizing ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>AI Summarizing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={11} />
                          <span>Summarize to LinkedIn Post</span>
                        </>
                      )}
                    </button>
                    <a
                      href={fullArticle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg border border-gray-250 flex items-center justify-center text-gray-500 bg-white hover:text-gray-700 hover:bg-gray-50"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                )}
              </div>

              <div className="flex-1 flex overflow-hidden">
                {articleLoading ? (
                  <div className="flex-1 flex overflow-hidden animate-pulse">
                    {/* Left: Article skeleton */}
                    <div className="w-[68%] border-r border-gray-100 px-8 py-8 space-y-6 overflow-y-auto">
                      <div className="max-w-2xl mx-auto space-y-6">
                        <div className="rounded-2xl bg-slate-100 h-60 w-full" />
                        <div className="space-y-3">
                          <div className="h-6 bg-slate-100 rounded w-11/12" />
                          <div className="h-6 bg-slate-100 rounded w-2/3" />
                        </div>
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                          <div className="w-8 h-8 rounded-full bg-slate-100" />
                          <div className="space-y-1.5 flex-1">
                            <div className="h-2.5 bg-slate-100 rounded w-24" />
                            <div className="h-2 bg-slate-100 rounded w-32" />
                          </div>
                        </div>
                        <div className="space-y-3 pt-2">
                          <div className="h-3 bg-slate-100 rounded w-full" />
                          <div className="h-3 bg-slate-100 rounded w-full" />
                          <div className="h-3 bg-slate-100 rounded w-11/12" />
                          <div className="h-3 bg-slate-100 rounded w-5/6" />
                          <div className="h-3 bg-slate-100 rounded w-2/3" />
                        </div>
                      </div>
                    </div>
                    {/* Right: Cockpit skeleton */}
                    <div className="w-[32%] bg-slate-50/50 p-6 flex flex-col justify-between border-l border-gray-100">
                      <div className="space-y-4">
                        <div className="h-3.5 bg-slate-100 rounded w-1/3" />
                        <div className="h-24 bg-slate-100 rounded-2xl w-full" />
                      </div>
                      <div className="space-y-3 pt-4">
                        <div className="h-10 bg-slate-100 rounded-xl w-full" />
                        <div className="h-11 bg-slate-100 rounded-xl w-full" />
                      </div>
                    </div>
                  </div>
                ) : fullArticle ? (
                  <>
                    <div className="w-[68%] border-r border-gray-100 overflow-y-auto px-8 py-8 select-text">
                      <div className="max-w-2xl mx-auto space-y-6">
                        {fullArticle.coverImage && (
                          <div className="rounded-2xl overflow-hidden h-60 bg-gray-55 shadow-sm mb-6 select-none">
                            <img src={fullArticle.coverImage} alt={fullArticle.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <h1 className="text-2xl font-black text-gray-900 leading-tight">
                          {fullArticle.title}
                        </h1>

                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 shrink-0 select-none">
                          {fullArticle.author?.profileImage && (
                            <img src={fullArticle.author.profileImage} alt={fullArticle.author.name} className="w-8 h-8 rounded-full border border-slate-100" />
                          )}
                          <div>
                            <p className="text-xs font-bold text-gray-850">{fullArticle.author?.name}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Published on {new Date(fullArticle.publishedAt).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <style>{`
                          .blog-content-body h1 {
                            font-size: 1.45rem !important;
                            font-weight: 800 !important;
                            color: #111827 !important;
                            margin-top: 1.75rem !important;
                            margin-bottom: 0.75rem !important;
                            line-height: 1.35 !important;
                          }
                          .blog-content-body h2 {
                            font-size: 1.25rem !important;
                            font-weight: 800 !important;
                            color: #1f2937 !important;
                            margin-top: 1.5rem !important;
                            margin-bottom: 0.75rem !important;
                            line-height: 1.35 !important;
                          }
                          .blog-content-body h3 {
                            font-size: 1.1rem !important;
                            font-weight: 700 !important;
                            color: #374151 !important;
                            margin-top: 1.25rem !important;
                            margin-bottom: 0.5rem !important;
                            line-height: 1.35 !important;
                          }
                          .blog-content-body p {
                            margin-bottom: 1.15rem !important;
                            line-height: 1.65 !important;
                            color: #4b5563 !important;
                          }
                          .blog-content-body ul {
                            list-style-type: disc !important;
                            padding-left: 1.5rem !important;
                            margin-bottom: 1.15rem !important;
                          }
                          .blog-content-body ol {
                            list-style-type: decimal !important;
                            padding-left: 1.5rem !important;
                            margin-bottom: 1.15rem !important;
                          }
                          .blog-content-body li {
                            margin-bottom: 0.5rem !important;
                            line-height: 1.6 !important;
                          }
                          .blog-content-body pre {
                            background-color: #f8fafc !important;
                            border: 1px border #e2e8f0 !important;
                            padding: 1.25rem !important;
                            border-radius: 12px !important;
                            overflow-x: auto !important;
                            margin: 1.5rem 0 !important;
                            font-family: monospace !important;
                          }
                          .blog-content-body code {
                            background-color: #f1f5f9 !important;
                            padding: 0.2rem 0.4rem !important;
                            border-radius: 6px !important;
                            font-family: monospace !important;
                            font-size: 0.9em !important;
                            color: #0f172a !important;
                          }
                          .blog-content-body pre code {
                            background-color: transparent !important;
                            padding: 0 !important;
                            border-radius: 0 !important;
                            font-size: 0.85em !important;
                          }
                          .blog-content-body a {
                            color: #0A66C2 !important;
                            font-weight: 700 !important;
                            text-decoration: underline !important;
                          }
                          .blog-content-body a:hover {
                            color: #004182 !important;
                          }
                        `}</style>

                        <div
                          className="blog-content-body select-text py-2 font-medium"
                          dangerouslySetInnerHTML={{ __html: fullArticle.bodyHtml }}
                          style={{
                            fontFamily: "var(--font-outfit), sans-serif",
                            fontSize: "13.5px",
                          }}
                        />
                      </div>
                    </div>

                    <div className="w-[32%] bg-slate-50/50 p-6 overflow-y-auto flex flex-col justify-between border-l border-gray-100 select-none">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                          <p className="text-xs font-extrabold text-gray-700 flex items-center gap-1.5">
                            <Edit3 size={12} className="text-linkedin" /> Creator Notes & Review
                          </p>
                          {notesSaveStatus === "saved" && (
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Auto-saved</span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 leading-normal font-semibold">
                          💡 Write your opinion, key ideas, or reviews here. The AI will weave these thoughts directly into your generated LinkedIn post!
                        </p>
                        <textarea
                          value={userNotes}
                          onChange={(e) => setUserNotes(e.target.value)}
                          onBlur={saveCreatorNotes}
                          className="w-full h-56 border border-slate-200 rounded-2xl p-4 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-linkedin/30 bg-white shadow-inner resize-none leading-relaxed"
                          placeholder="What did you think of this article? What are the key lessons you want to highlight for your network? (e.g. 'Highly agree with Section 3, let's focus on query caching pros')"
                        />
                      </div>

                      <div className="border-t border-slate-200 pt-4 mt-6 space-y-3">
                        <button
                          onClick={saveCreatorNotes}
                          disabled={savingNotes}
                          className="w-full bg-white hover:bg-slate-50 border border-slate-250 text-slate-650 font-bold py-2.5 px-4 rounded-xl text-[10.5px] transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Save size={12} />
                          <span>{savingNotes ? "Saving Notes..." : "Save Notes"}</span>
                        </button>
                        <button
                          onClick={handleSummarize}
                          disabled={summarizing}
                          className="w-full bg-linkedin hover:bg-linkedin-hover disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow"
                        >
                          <Sparkles size={12} />
                          <span>{summarizing ? "AI Generating Draft..." : "Create LinkedIn Draft"}</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">
                    Could not load article body.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
