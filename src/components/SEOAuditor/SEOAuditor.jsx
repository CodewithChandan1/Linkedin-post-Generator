"use client";
// LinkedIn Profile SEO Auditor — PRD §4.17

import { useState } from "react";
import { Sparkles, AlertTriangle, Pin, Lightbulb, FileText, Search, ChevronRight } from "lucide-react";

const SEO_AUDIT_KEY = "linkedin_seo_audit";

function loadAudit() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SEO_AUDIT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveAudit(audit) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(SEO_AUDIT_KEY, JSON.stringify(audit)); } catch {}
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
      setResult(data);
      saveAudit(data);
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
    s >= 75 ? "text-green-700" : s >= 50 ? "text-amber-700" : "text-red-600";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-1.5">
              <Search size={16} /> LinkedIn Profile SEO Auditor
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Run once — optimized profiles get 40% more views</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-4 space-y-4">
          {!result ? (
            <>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Current Headline</label>
                <input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/30"
                  placeholder="Your current LinkedIn headline"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">About section (first 300 chars)</label>
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/30 resize-none"
                  placeholder="Paste the first 300 characters of your About section"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Current Skills (comma separated)</label>
                <input
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/30"
                  placeholder="React, Node.js, Next.js"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                onClick={runAudit}
                disabled={loading || !headline.trim()}
                className="w-full bg-linkedin hover:bg-linkedin-hover text-white font-medium py-2.5 rounded-full text-sm disabled:opacity-50 transition"
              >
                {loading ? "Analyzing…" : "Run SEO Audit"}
              </button>
            </>
          ) : (
            <>
              {/* Overall score */}
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="text-center">
                  <p className={`text-3xl font-bold ${scoreColor(result.overallScore)}`}>
                    {result.overallScore}
                  </p>
                  <p className="text-[10px] text-gray-500">/ 100</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Overall SEO Score</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Headline: <span className={scoreColor(result.headlineScore)}>{result.headlineScore}/100</span>
                    {" · "}
                    About: <span className={scoreColor(result.aboutScore)}>{result.aboutScore}/100</span>
                  </p>
                </div>
              </div>

              {/* Optimized headline */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-green-800 flex items-center gap-1">
                    <Sparkles size={12} /> Optimized Headline
                  </p>
                  <button
                    onClick={() => copy(result.headlineSuggestion, "headline")}
                    className="text-[10px] text-green-700 border border-green-300 px-2 py-0.5 rounded-full hover:bg-green-100"
                  >
                    {copied === "headline" ? "✓ Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-sm text-gray-800 leading-snug">{result.headlineSuggestion}</p>
                <p className="text-[10px] text-gray-500 mt-1">{result.headlineSuggestion?.length} chars (target: 150+)</p>
              </div>

              {/* Optimized About opener */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-blue-800 flex items-center gap-1">
                    <FileText size={12} /> Optimized About Opener
                  </p>
                  <button
                    onClick={() => copy(result.aboutOpener, "about")}
                    className="text-[10px] text-blue-700 border border-blue-300 px-2 py-0.5 rounded-full hover:bg-blue-100"
                  >
                    {copied === "about" ? "✓ Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed">{result.aboutOpener}</p>
              </div>

              {/* Skills to pin */}
              {result.skillsToPin?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                    <Pin size={12} /> Pin these 3 skills (highest SEO weight)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.skillsToPin.map((s) => (
                      <span key={s} className="text-xs bg-linkedin/10 text-linkedin px-2.5 py-1 rounded-full font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing keywords */}
              {result.missingKeywords?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                    <AlertTriangle size={12} className="text-amber-500" /> Missing keywords recruiters search for
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missingKeywords.map((k) => (
                      <span key={k} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvements */}
              {result.improvements?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                    <Lightbulb size={12} className="text-amber-500" /> Improvements
                  </p>
                  <ul className="space-y-1.5">
                    {result.improvements.map((imp, i) => (
                      <li key={i} className="text-xs text-gray-600 flex gap-2 leading-snug">
                        <ChevronRight size={12} className="shrink-0 text-linkedin mt-0.5" />
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => setResult(null)}
                className="w-full border border-gray-200 text-gray-600 text-sm py-2 rounded-full hover:bg-gray-50"
              >
                Re-run Audit
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
