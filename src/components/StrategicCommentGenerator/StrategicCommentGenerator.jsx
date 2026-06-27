"use client";
// Strategic Comment Generator — PRD §6.5

import { useState, useEffect } from "react";
import { MessageSquare, Check, Plus, X } from "lucide-react";

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-1.5">
              <MessageSquare size={16} /> Strategic Comment Generator
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">10-15 min/day replaces dead engagement pods</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-4">
          {["generate", "history"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2.5 px-4 text-xs font-medium border-b-2 -mb-px transition ${
                tab === t ? "border-linkedin text-linkedin" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "generate" ? "Generate Today's Comments" : `History (${history.length})`}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4">
          {tab === "generate" && (
            <>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-700">Add a specific post to comment on (optional)</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={customPost.author}
                    onChange={(e) => setCustomPost((p) => ({ ...p, author: e.target.value }))}
                    placeholder="Author name"
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-linkedin/30"
                  />
                  <input
                    value={customPost.topic}
                    onChange={(e) => setCustomPost((p) => ({ ...p, topic: e.target.value }))}
                    placeholder="Post topic / content"
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-linkedin/30"
                  />
                </div>
                <button
                  onClick={addCustomPost}
                  disabled={!customPost.author && !customPost.topic}
                  className="text-xs text-linkedin border border-linkedin/30 px-3 py-1 rounded-full hover:bg-linkedin/10 disabled:opacity-50 flex items-center gap-1"
                >
                  <Plus size={11} /> Add post
                </button>
                {customPosts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {customPosts.map((p, i) => (
                      <div key={i} className="flex items-center gap-1 bg-linkedin/10 text-linkedin text-[10px] px-2 py-0.5 rounded-full">
                        <span>{p.author || p.topic}</span>
                        <button onClick={() => setCustomPosts((prev) => prev.filter((_, j) => j !== i))}>
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                <p className="font-medium mb-1">Why strategic commenting works:</p>
                <p>• A good comment on a viral post = 10,000+ impressions</p>
                <p>• Gets your name in front of new audiences</p>
                <p>• LinkedIn now shows comment impression counts</p>
                <p>• Safe alternative to engagement pods (no shadowban risk)</p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                onClick={generate}
                disabled={loading}
                className="w-full bg-linkedin hover:bg-linkedin-hover text-white font-medium py-2.5 rounded-full text-sm disabled:opacity-50"
              >
                {loading ? "Generating comments…" : "Generate Today's 3 Comments"}
              </button>

              {comments.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-700">Today's strategic comments — review, copy, and post:</p>
                  {comments.map((c, i) => (
                    <div
                      key={i}
                      className={`border rounded-xl p-3 transition ${
                        postedIdx.has(i) ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-xs font-semibold text-gray-800">On: {c.author}&apos;s post</p>
                          <p className="text-[10px] text-gray-500">{c.topic || c.postContext}</p>
                        </div>
                        {c.estimatedImpression && (
                          <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded shrink-0">
                            {c.estimatedImpression}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-2.5 mb-2">
                        &ldquo;{c.comment}&rdquo;
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-gray-400 italic">Angle: {c.angle}</p>
                        <div className="flex gap-1.5">
                          {!postedIdx.has(i) && (
                            <>
                              <button
                                onClick={() => copyComment(c.comment, i)}
                                className="text-[10px] text-linkedin border border-linkedin/30 px-2 py-0.5 rounded-full hover:bg-linkedin/10 flex items-center gap-0.5"
                              >
                                {copied === i ? <><Check size={10} /> Copied</> : "Copy"}
                              </button>
                              <button
                                onClick={() => markPosted(i)}
                                className="text-[10px] text-green-700 border border-green-300 px-2 py-0.5 rounded-full hover:bg-green-50 flex items-center gap-0.5"
                              >
                                <Check size={10} /> Posted
                              </button>
                            </>
                          )}
                          {postedIdx.has(i) && (
                            <span className="text-[10px] text-green-700 font-medium flex items-center gap-0.5">
                              <Check size={10} /> Done
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
                <p className="text-xs text-gray-500 text-center py-6">
                  No comment history yet. Generate and mark comments as posted to track them here.
                </p>
              ) : (
                <div className="space-y-2">
                  {history.slice(0, 20).map((h) => (
                    <div key={h.id} className="border border-gray-200 rounded-lg p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-gray-700">On: {h.author}</p>
                        <p className="text-[10px] text-gray-400">{h.date}</p>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">&ldquo;{h.comment}&rdquo;</p>
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
