"use client";
// LinkedIn Profile SEO Auditor — PRD §4.17

import { useState } from "react";
import { Sparkles, AlertTriangle, Pin, Lightbulb, FileText, Search, ChevronRight, Copy, Check, RefreshCw, ArrowRight } from "lucide-react";

const SEO_AUDIT_KEY = "linkedin_seo_audit";

function loadAudit() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SEO_AUDIT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveAudit(audit, originalData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SEO_AUDIT_KEY, JSON.stringify({ ...audit, originalData }));
  } catch {}
}

export default function SEOAuditor({ profile, onClose }) {
  const saved = typeof window !== "undefined" ? loadAudit() : null;

  const [headline, setHeadline] = useState(profile?.headline || "");
  const [about, setAbout] = useState("");
  const [skills, setSkills] = useState((profile?.stack || []).join(", ") || "React, Next.js, Node.js, MongoDB");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(saved);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  async function runAudit() {
    setLoading(true);
    setError("");
    const originalData = { headline, about };
    try {
      const res = await fetch("/api/seo-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline,
          about,
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit failed");
      const completeResult = { ...data, originalData };
      setResult(completeResult);
      saveAudit(data, originalData);
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

  const scoreColor = (s) =>
    s >= 75 ? "text-emerald-700 bg-emerald-50 border-emerald-100" : s >= 50 ? "text-amber-700 bg-amber-50 border-amber-100" : "text-rose-700 bg-rose-50 border-rose-100";

  const scoreTextOnly = (s) =>
    s >= 75 ? "text-emerald-600" : s >= 50 ? "text-amber-500" : "text-rose-500";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[3px] z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-linkedin/10 text-linkedin rounded-xl flex items-center justify-center border border-linkedin/10">
              <Search size={16} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">LinkedIn Profile SEO Auditor</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Optimize profile SEO to get discovered by recruiters</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 md:p-8 space-y-6">
          {!result ? (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Current Headline</label>
                <input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-linkedin/30 transition placeholder-gray-400"
                  placeholder="e.g. Software Engineer at Company"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">About Section (first 300 characters)</label>
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-linkedin/30 resize-none transition placeholder-gray-400"
                  placeholder="Paste the beginning of your LinkedIn About summary..."
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Current Skills (comma separated)</label>
                <input
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-linkedin/30 transition placeholder-gray-400"
                  placeholder="React, Next.js, Node.js, TypeScript"
                />
              </div>

              {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">{error}</p>}

              <button
                onClick={runAudit}
                disabled={loading || !headline.trim()}
                className="w-full bg-linkedin hover:bg-linkedin-hover text-white font-bold py-3 rounded-full text-xs disabled:opacity-50 transition shadow-sm hover:shadow-md active:scale-[0.99] flex items-center justify-center gap-1.5 mt-2"
              >
                {loading ? <><RefreshCw size={14} className="animate-spin" /> Analyzing Profile...</> : "Run SEO Audit"}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Premium Score Dashboard */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border font-black shadow-sm ${scoreColor(result.overallScore)}`}>
                    <span className="text-2xl leading-none">{result.overallScore}</span>
                    <span className="text-[8px] opacity-75 uppercase tracking-wider mt-0.5">Score</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Overall SEO Score</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Based on LinkedIn search crawler ranking weight</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6 shrink-0 text-xs">
                  <div className="space-y-0.5">
                    <p className="text-gray-400">Headline Score</p>
                    <p className={`font-bold ${scoreTextOnly(result.headlineScore)}`}>{result.headlineScore} / 100</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-gray-400">About Score</p>
                    <p className={`font-bold ${scoreTextOnly(result.aboutScore)}`}>{result.aboutScore} / 100</p>
                  </div>
                </div>
              </div>

              {/* Optimized Cards Container */}
              <div className="space-y-6">
                
                {/* Unified Optimized Headline Card */}
                <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50/50 border-b border-gray-100">
                    <div className="flex items-center gap-1.5 text-emerald-800">
                      <Sparkles size={14} className="text-emerald-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Headline Comparison</span>
                    </div>
                    <button
                      onClick={() => copy(result.headlineSuggestion, "headline")}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 ${
                        copied === "headline"
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {copied === "headline" ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy Optimized</>}
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    {/* Original */}
                    <div>
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">Your Original Headline</span>
                      <p className="text-xs text-gray-500 line-through bg-gray-50/50 px-3 py-2 rounded-lg border border-gray-100 leading-relaxed">{result.originalData?.headline || headline || "N/A"}</p>
                    </div>
                    
                    {/* Arrow Divider */}
                    <div className="flex justify-center text-emerald-500/60 my-1">
                      <ArrowRight size={16} className="rotate-90 sm:rotate-0" />
                    </div>

                    {/* Optimized */}
                    <div>
                      <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-widest block mb-1">AI Optimized Suggestion</span>
                      <p className="text-sm text-gray-800 font-semibold bg-emerald-50/20 px-3 py-2.5 rounded-lg border border-emerald-100/50 leading-relaxed">{result.headlineSuggestion}</p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-400 pt-3 border-t border-gray-100">
                      <span>Target length: 150+ chars</span>
                      <span>Current: {result.headlineSuggestion?.length} chars</span>
                    </div>
                  </div>
                </div>

                {/* Unified Optimized About Opener Card */}
                <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50/50 border-b border-gray-100">
                    <div className="flex items-center gap-1.5 text-blue-800">
                      <FileText size={14} className="text-blue-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">About Opener Comparison</span>
                    </div>
                    <button
                      onClick={() => copy(result.aboutOpener, "about")}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 ${
                        copied === "about"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {copied === "about" ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy Optimized</>}
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    {/* Original */}
                    <div>
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">Your Original About Section</span>
                      <p className="text-xs text-gray-500 bg-gray-50/50 px-3 py-2 rounded-lg border border-gray-100 leading-relaxed max-h-24 overflow-y-auto">{result.originalData?.about || about || "(Not provided)"}</p>
                    </div>

                    {/* Arrow Divider */}
                    <div className="flex justify-center text-blue-500/60 my-1">
                      <ArrowRight size={16} className="rotate-90 sm:rotate-0" />
                    </div>

                    {/* Optimized */}
                    <div>
                      <span className="text-[9px] font-extrabold text-blue-600 uppercase tracking-widest block mb-1">AI Optimized Opener</span>
                      <p className="text-sm text-gray-800 bg-blue-50/20 px-3 py-2.5 rounded-lg border border-blue-100/50 leading-relaxed">{result.aboutOpener}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tag Badges Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Skills to pin */}
                {result.skillsToPin?.length > 0 && (
                  <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                      <Pin size={12} className="text-linkedin" /> Pin these 3 skills
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.skillsToPin.map((s) => (
                        <span key={s} className="text-xs bg-linkedin/10 text-linkedin border border-linkedin/10 px-3 py-1.5 rounded-xl font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing keywords */}
                {result.missingKeywords?.length > 0 && (
                  <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                      <AlertTriangle size={12} className="text-amber-500" /> Missing keywords
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.missingKeywords.map((k) => (
                        <span key={k} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-xl font-medium">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Improvements Bullet List */}
              {result.improvements?.length > 0 && (
                <div className="bg-amber-50/20 border border-amber-100 rounded-2xl p-5">
                  <p className="text-xs font-bold text-amber-800 mb-3 flex items-center gap-1.5">
                    <Lightbulb size={13} className="text-amber-600" /> Actionable Improvements
                  </p>
                  <ul className="space-y-2.5">
                    {result.improvements.map((imp, i) => (
                      <li key={i} className="text-xs text-gray-700 flex gap-2 items-start leading-relaxed">
                        <ChevronRight size={12} className="shrink-0 text-amber-600 mt-1" />
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => setResult(null)}
                className="w-full border border-gray-200 text-gray-600 font-semibold text-xs py-3 rounded-full hover:bg-gray-50 hover:text-gray-800 transition active:scale-[0.99] mt-2"
              >
                Re-run Audit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
