"use client";
// LinkedIn Newsletter Auto-Generator — PRD §6.4

import { useState } from "react";
import { Newspaper, CalendarDays, Megaphone, ClipboardList } from "lucide-react";
export default function NewsletterGenerator({ posts, onClose }) {
  const [loading, setLoading] = useState(false);
  const [newsletter, setNewsletter] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);

  // Get this week's posted posts
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStr = weekAgo.toISOString().slice(0, 10);
  const weekPosts = posts.filter((p) => p.status === "posted" && p.date >= weekStr);
  const bestPost = selectedPost || weekPosts[0] || posts.find((p) => p.status === "posted") || null;

  async function generate() {
    if (!bestPost) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post: bestPost, weekPosts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setNewsletter(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function copy(text, key) {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  }

  function buildFullNewsletter() {
    if (!newsletter) return "";
    return `${newsletter.title}\n\n${newsletter.intro}\n\n${newsletter.mainSection}\n\n${newsletter.additionalInsights.map((i) => `• ${i}`).join("\n")}\n\nNext week: ${newsletter.whatsNext}\n\n${newsletter.cta}`;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-1.5"><Newspaper size={16} /> Newsletter Generator</h2>
            <p className="text-xs text-gray-500 mt-0.5">25-35% open rate vs 2% feed reach — bypasses algorithm</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-4 space-y-4">
          {!newsletter ? (
            <>
              {/* Featured post selector */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Featured post this week</p>
                {weekPosts.length === 0 && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                    No posts this week yet — will use your most recent post instead.
                  </p>
                )}
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(weekPosts.length > 0 ? weekPosts : posts.filter((p) => p.status === "posted").slice(0, 3)).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPost(p)}
                      className={`w-full text-left rounded-lg border px-3 py-2 text-xs transition ${
                        (selectedPost?.id || bestPost?.id) === p.id
                          ? "border-linkedin bg-linkedin/10"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <p className="font-medium text-gray-800">{p.topic}</p>
                      <p className="text-gray-500 mt-0.5 line-clamp-1">{p.content.slice(0, 80)}…</p>
                      <p className="text-gray-400 mt-0.5">{p.date}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1">
                <p className="font-medium">Why newsletters win:</p>
                <p>• Delivered directly to subscriber inbox + push notification</p>
                <p>• 25-35% open rate vs 2% feed reach</p>
                <p>• LinkedIn invites ALL your connections to subscribe on first publish</p>
                <p>• Bypasses the feed algorithm entirely</p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                onClick={generate}
                disabled={loading || !bestPost}
                className="w-full bg-linkedin hover:bg-linkedin-hover text-white font-medium py-2.5 rounded-full text-sm disabled:opacity-50"
              >
                {loading ? "Writing newsletter…" : "Generate Newsletter Edition"}
              </button>
            </>
          ) : (
            <>
              {/* Newsletter preview */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Newsletter ready!</p>
                <button
                  onClick={() => copy(buildFullNewsletter(), "full")}
                  className="text-xs text-linkedin border border-linkedin/30 px-3 py-1 rounded-full hover:bg-linkedin/10"
                >
                  {copied === "full" ? "✓ Copied!" : "Copy full newsletter"}
                </button>
              </div>

              {/* Title & Subject */}
              <div className="bg-linkedin/5 border border-linkedin/20 rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-medium">Title</p>
                    <p className="text-base font-bold text-gray-900">{newsletter.title}</p>
                  </div>
                  <button onClick={() => copy(newsletter.title, "title")} className="text-[10px] text-linkedin shrink-0 border border-linkedin/30 px-2 py-0.5 rounded-full">
                    {copied === "title" ? "✓" : "Copy"}
                  </button>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-medium">Subject line</p>
                  <p className="text-sm text-gray-700">{newsletter.subject}</p>
                </div>
              </div>

              {/* Sections */}
              {[
                { key: "intro", label: "Intro", content: newsletter.intro },
                { key: "main", label: "Main section", content: newsletter.mainSection },
              ].map(({ key, label, content }) => (
                <div key={key} className="border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-700">{label}</p>
                    <button onClick={() => copy(content, key)} className="text-[10px] text-linkedin border border-linkedin/30 px-2 py-0.5 rounded-full">
                      {copied === key ? "✓" : "Copy"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{content}</p>
                </div>
              ))}

              {/* Insights */}
              <div className="border border-gray-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-700 mb-2">Additional insights</p>
                <ul className="space-y-1.5">
                  {newsletter.additionalInsights.map((ins, i) => (
                    <li key={i} className="text-xs text-gray-600 flex gap-2">
                      <span className="text-linkedin shrink-0">•</span>{ins}
                    </li>
                  ))}
                </ul>
              </div>

              {/* What's next + CTA */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-gray-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1"><CalendarDays size={12} /> Next week teaser</p>
                  <p className="text-xs text-gray-600">{newsletter.whatsNext}</p>
                </div>
                <div className="border border-gray-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1"><Megaphone size={12} /> CTA</p>
                  <p className="text-xs text-gray-600">{newsletter.cta}</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                <p className="font-medium mb-1 flex items-center gap-1"><ClipboardList size={12} /> How to publish:</p>
                <p>1. Go to LinkedIn → Write article / Newsletter</p>
                <p>2. Create newsletter on first time (auto-invites all connections)</p>
                <p>3. Paste each section, add your header image</p>
                <p>4. Publish every Sunday for maximum traction</p>
              </div>

              <button
                onClick={() => setNewsletter(null)}
                className="w-full border border-gray-200 text-gray-600 text-sm py-2 rounded-full hover:bg-gray-50"
              >
                Regenerate
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
