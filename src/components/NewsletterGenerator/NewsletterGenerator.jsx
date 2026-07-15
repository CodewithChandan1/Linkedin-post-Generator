"use client";
// LinkedIn Newsletter Auto-Generator — PRD §6.4

import { useState } from "react";
import { Newspaper, CalendarDays, Megaphone, ClipboardList, Check, Copy, HelpCircle } from "lucide-react";

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[3px] z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-linkedin/10 text-linkedin rounded-xl flex items-center justify-center border border-linkedin/10">
              <Newspaper size={16} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">Newsletter Generator</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Bypasses the LinkedIn feed algorithm entirely</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-6 md:p-8 space-y-6">
          {!newsletter ? (
            <>
              {/* Featured post selector */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-700">Select Featured Post for this Edition</p>
                {weekPosts.length === 0 && (
                  <p className="text-xs text-amber-700 bg-amber-50/60 border border-amber-100 rounded-xl px-4 py-3 leading-relaxed">
                    No posts published this week yet. We'll use your most recent published post instead.
                  </p>
                )}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(weekPosts.length > 0 ? weekPosts : posts.filter((p) => p.status === "posted").slice(0, 3)).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPost(p)}
                      className={`w-full text-left rounded-xl border p-3 text-xs transition active:scale-[0.99] ${
                        (selectedPost?.id || bestPost?.id) === p.id
                          ? "border-linkedin bg-linkedin/10 text-linkedin font-semibold"
                          : "border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold">{p.topic}</span>
                        <span className="text-[9px] text-gray-400 font-semibold">{p.date}</span>
                      </div>
                      <p className="text-gray-500 line-clamp-1 leading-relaxed">{p.content.slice(0, 90)}…</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Informative Why Newsletters Win Card */}
              <div className="bg-blue-50/30 border border-blue-100 rounded-2xl p-5 text-xs text-blue-800 space-y-2.5">
                <p className="font-extrabold uppercase tracking-wider text-[10px] text-blue-900">Why newsletters win:</p>
                <div className="space-y-1.5 leading-relaxed">
                  <p>• Delivered directly to subscriber inboxes and via mobile push notifications.</p>
                  <p>• <strong>25-35% open rates</strong> vs 2% average organic feed reach.</p>
                  <p>• LinkedIn invites all of your connections to subscribe on your first newsletter publish.</p>
                </div>
              </div>

              {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">{error}</p>}

              {/* Tooltip Wrapper for Button */}
              <div className="relative group">
                <button
                  onClick={generate}
                  disabled={loading || !bestPost}
                  className="w-full bg-linkedin hover:bg-linkedin-hover text-white font-bold py-3 rounded-full text-xs disabled:opacity-50 transition shadow-sm hover:shadow active:scale-[0.99] flex items-center justify-center gap-1.5"
                >
                  {loading ? "Writing newsletter…" : "Generate Newsletter Edition"}
                </button>
                
                {!bestPost && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:flex flex-col items-center bg-gray-900 text-white text-[11px] font-semibold px-3.5 py-2.5 rounded-xl w-72 text-center shadow-2xl pointer-events-none z-30 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <span className="flex items-center gap-1 text-amber-400 mb-0.5"><HelpCircle size={12} /> Button Locked</span>
                    <span className="font-medium text-gray-300 leading-normal">Please publish at least one post on LinkedIn to generate a newsletter.</span>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-6 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Newsletter preview */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900">Newsletter ready!</p>
                <button
                  onClick={() => copy(buildFullNewsletter(), "full")}
                  className={`text-[10px] font-bold px-3.5 py-1.5 rounded-full border transition-all flex items-center gap-1 ${
                    copied === "full"
                      ? "bg-linkedin text-white border-linkedin"
                      : "bg-white text-linkedin border-linkedin/30 hover:bg-linkedin/5"
                  }`}
                >
                  {copied === "full" ? <Check size={11} /> : null}
                  {copied === "full" ? "Copied!" : "Copy Full Newsletter"}
                </button>
              </div>

              {/* Title & Subject */}
              <div className="bg-linkedin/5 border border-linkedin/20 rounded-2xl p-4.5 space-y-3.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-[9px] text-gray-400 uppercase tracking-wider font-extrabold">Title</p>
                    <p className="text-base font-bold text-gray-900">{newsletter.title}</p>
                  </div>
                  <button 
                    onClick={() => copy(newsletter.title, "title")} 
                    className="text-[10px] font-semibold text-linkedin shrink-0 border border-linkedin/20 hover:bg-linkedin/5 px-2.5 py-1 rounded-full transition-all"
                  >
                    {copied === "title" ? "✓ Copied" : "Copy"}
                  </button>
                </div>
                <div className="border-t border-linkedin/10 pt-3">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider font-extrabold">Subject line</p>
                  <p className="text-xs text-gray-700 leading-relaxed font-semibold">{newsletter.subject}</p>
                </div>
              </div>

              {/* Sections */}
              {[
                { key: "intro", label: "Introductory Paragraph", content: newsletter.intro },
                { key: "main", label: "Main Body Analysis", content: newsletter.mainSection },
              ].map(({ key, label, content }) => (
                <div key={key} className="border border-gray-200/80 bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4.5 py-3 bg-gray-50/50 border-b border-gray-100">
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">{label}</span>
                    <button 
                      onClick={() => copy(content, key)} 
                      className="text-[10px] font-semibold text-linkedin border border-linkedin/20 hover:bg-linkedin/5 px-2.5 py-1 rounded-full transition-all"
                    >
                      {copied === key ? "✓ Copied" : "Copy Section"}
                    </button>
                  </div>
                  <div className="p-4.5">
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">{content}</p>
                  </div>
                </div>
              ))}

              {/* Insights */}
              <div className="border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                <p className="text-xs font-bold text-gray-800">Additional Bullet Insights</p>
                <ul className="space-y-2.5">
                  {newsletter.additionalInsights.map((ins, i) => (
                    <li key={i} className="text-xs text-gray-600 flex gap-2 items-start leading-relaxed font-medium">
                      <span className="text-linkedin font-black mt-0.5">•</span>
                      <span>{ins}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What's next + CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-gray-200/80 rounded-2xl p-4.5 shadow-sm space-y-2">
                  <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <CalendarDays size={13} className="text-linkedin" /> Next Week Teaser
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed font-medium">{newsletter.whatsNext}</p>
                </div>
                <div className="border border-gray-200/80 rounded-2xl p-4.5 shadow-sm space-y-2">
                  <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Megaphone size={13} className="text-orange-500" /> Call to Action (CTA)
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed font-medium">{newsletter.cta}</p>
                </div>
              </div>

              {/* Step-by-step instructions */}
              <div className="bg-amber-50/20 border border-amber-100 rounded-2xl p-5 space-y-2.5">
                <p className="font-bold text-amber-800 text-xs flex items-center gap-1.5">
                  <ClipboardList size={13} /> How to Publish on LinkedIn:
                </p>
                <div className="space-y-1.5 text-xs text-amber-900 leading-relaxed">
                  <p>1. Go to LinkedIn feed &rarr; Click <strong>Write article</strong>.</p>
                  <p>2. Select <strong>Create newsletter</strong> if it's your first time (auto-invites connections).</p>
                  <p>3. Copy each section from above and paste them, then add a neat header cover image.</p>
                  <p>4. Publish consistently (e.g. every Sunday morning) for maximum open rates.</p>
                </div>
              </div>

              <button
                onClick={() => setNewsletter(null)}
                className="w-full border border-gray-200 text-gray-600 font-semibold text-xs py-3 rounded-full hover:bg-gray-50 hover:text-gray-800 transition active:scale-[0.99] mt-2"
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
