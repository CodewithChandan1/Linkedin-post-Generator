"use client";
// Strategic Comment Generator — PRD §6.5

import { useState, useEffect } from "react";
import { MessageSquare, Check, Plus, X, Search, ChevronRight, Copy, Info, Sparkles, RefreshCw } from "lucide-react";

const HISTORY_KEY = "linkedin_comment_history";

function loadHistory() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}

function saveHistory(history) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch {}
}

export default function StrategicCommentGenerator({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(null);
  const [postedIdx, setPostedIdx] = useState(new Set());
  const [history, setHistory] = useState([]);
  const [customPost, setCustomPost] = useState({ author: "", topic: "" });
  const [customPosts, setCustomPosts] = useState([]);
  const [tab, setTab] = useState("generate");

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/comment-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customPosts: customPosts.length > 0 ? customPosts : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setComments(data.comments || []);
      setPostedIdx(new Set());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyComment(text, idx) {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  }

  function markPosted(idx) {
    const comment = comments[idx];
    const entry = {
      id: Date.now(),
      author: comment.author,
      topic: comment.topic,
      comment: comment.comment,
      date: new Date().toISOString().slice(0, 10),
    };
    const updated = [entry, ...loadHistory()];
    saveHistory(updated);
    setHistory(updated);
    setPostedIdx((prev) => new Set([...prev, idx]));
  }

  function addCustomPost() {
    if (!customPost.author && !customPost.topic) return;
    setCustomPosts((prev) => [...prev, { ...customPost }]);
    setCustomPost({ author: "", topic: "" });
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[3px] z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-linkedin/10 text-linkedin rounded-xl flex items-center justify-center border border-linkedin/10">
              <MessageSquare size={16} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">Strategic Comment Generator</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Steal viral post traffic organically through insightful replies</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 border-b border-gray-100 px-6 py-2.5 bg-gray-50/20 shrink-0">
          <button
            onClick={() => setTab("generate")}
            className={`py-2 px-4 text-xs font-bold rounded-xl transition-all ${
              tab === "generate" 
                ? "bg-linkedin/10 text-linkedin border border-linkedin/10" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 border border-transparent"
            }`}
          >
            Generate Today's Comments
          </button>
          <button
            onClick={() => setTab("history")}
            className={`py-2 px-4 text-xs font-bold rounded-xl transition-all ${
              tab === "history" 
                ? "bg-linkedin/10 text-linkedin border border-linkedin/10" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 border border-transparent"
            }`}
          >
            History ({history.length})
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6 md:p-8 space-y-6">
          {tab === "generate" && (
            <>
              {/* Add Custom Post Card */}
              <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                <p className="text-xs font-bold text-gray-700">Add a Specific Post to Target (Optional)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    value={customPost.author}
                    onChange={(e) => setCustomPost((p) => ({ ...p, author: e.target.value }))}
                    placeholder="Author / Influencer name"
                    className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-linkedin/30 transition placeholder-gray-400"
                  />
                  <input
                    value={customPost.topic}
                    onChange={(e) => setCustomPost((p) => ({ ...p, topic: e.target.value }))}
                    placeholder="Post topic or main keywords"
                    className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-linkedin/30 transition placeholder-gray-400"
                  />
                </div>
                <button
                  onClick={addCustomPost}
                  disabled={!customPost.author && !customPost.topic}
                  className="text-xs text-linkedin border border-linkedin/20 px-4 py-2 rounded-full hover:bg-linkedin/5 disabled:opacity-50 flex items-center justify-center gap-1.5 transition active:scale-[0.99] font-bold"
                >
                  <Plus size={13} /> Add target post
                </button>
                {customPosts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 border-t border-gray-100 pt-3">
                    {customPosts.map((p, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-linkedin/10 text-linkedin text-[10px] font-bold px-3 py-1 rounded-full border border-linkedin/10">
                        <span>{p.author || p.topic}</span>
                        <button onClick={() => setCustomPosts((prev) => prev.filter((_, j) => j !== i))} className="hover:text-red-600 transition">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Informative Why Comments Work Card */}
              <div className="bg-blue-50/30 border border-blue-100 rounded-2xl p-5 text-xs text-blue-800 space-y-2.5">
                <p className="font-extrabold uppercase tracking-wider text-[10px] text-blue-900">Why commenting works:</p>
                <div className="space-y-1.5 leading-relaxed">
                  <p>• A highly insightful comment on a viral post routinely gathers **10,000+ views**.</p>
                  <p>• Places your brand and face in front of massive, pre-qualified audiences.</p>
                  <p>• LinkedIn algorithm now ranks and rewards active commentators with organic reach.</p>
                </div>
              </div>

              {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">{error}</p>}

              <button
                onClick={generate}
                disabled={loading}
                className="w-full bg-linkedin hover:bg-linkedin-hover text-white font-bold py-3 rounded-full text-xs disabled:opacity-50 transition shadow-sm hover:shadow active:scale-[0.99] flex items-center justify-center gap-1.5 mt-2"
              >
                {loading ? <><RefreshCw size={14} className="animate-spin" /> Generating Comments...</> : "Generate Today's 3 Comments"}
              </button>

              {/* Suggestions List */}
              {comments.length > 0 && (
                <div className="space-y-4 pt-3 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-700">Today's Strategic Comments</p>
                  {comments.map((c, i) => (
                    <div
                      key={i}
                      className={`border rounded-2xl p-5 shadow-sm hover:shadow transition duration-200 ${
                        postedIdx.has(i) ? "border-green-200 bg-green-50/20" : "border-gray-200/80 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3.5">
                        <div>
                          <p className="text-xs font-bold text-gray-800">Target: {c.author}&apos;s post</p>
                          <p className="text-[10px] font-semibold text-gray-400 mt-0.5">{c.topic || c.postContext}</p>
                        </div>
                        {c.estimatedImpression && (
                          <span className="text-[9px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200/50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {c.estimatedImpression}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 border border-gray-100 rounded-xl p-4 mb-3.5 font-medium">
                        &ldquo;{c.comment}&rdquo;
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100/60">
                        <p className="text-[10px] text-gray-400 font-semibold italic">Angle: {c.angle}</p>
                        <div className="flex gap-2">
                          {!postedIdx.has(i) && (
                            <>
                              <button
                                onClick={() => copyComment(c.comment, i)}
                                className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition flex items-center gap-1 ${
                                  copied === i
                                    ? "bg-linkedin text-white border-linkedin"
                                    : "bg-white text-linkedin border-linkedin/30 hover:bg-linkedin/5"
                                }`}
                              >
                                {copied === i ? <><Check size={11} /> Copied</> : "Copy"}
                              </button>
                              <button
                                onClick={() => markPosted(i)}
                                className="text-[10px] font-bold text-green-700 bg-white border border-green-200 hover:bg-green-50 px-3.5 py-1.5 rounded-full transition flex items-center gap-1"
                              >
                                <Check size={11} /> Mark Posted
                              </button>
                            </>
                          )}
                          {postedIdx.has(i) && (
                            <span className="text-[10px] text-green-700 font-extrabold flex items-center gap-1 uppercase tracking-wider bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                              <Check size={11} className="stroke-[2.5]" /> Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === "history" && (
            <>
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare size={36} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-xs text-gray-500">No comment history logged yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.slice(0, 20).map((h) => (
                    <div key={h.id} className="border border-gray-200/80 bg-white rounded-2xl p-4.5 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-gray-800">Target: {h.author}</p>
                        <p className="text-[10px] font-semibold text-gray-400">{h.date}</p>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium bg-gray-50/50 p-3 rounded-xl border border-gray-100">&ldquo;{h.comment}&rdquo;</p>
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
