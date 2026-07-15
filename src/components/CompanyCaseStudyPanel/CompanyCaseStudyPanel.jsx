"use client";

import { useState, useEffect } from "react";
import { Sparkles, Building, Briefcase, Code, BarChart3, Copy, Check, Presentation } from "lucide-react";

const ANGLES = [
  { id: "founding", name: "Founding Story", icon: Building, description: "How they started, early struggles & zero-to-one scale" },
  { id: "marketing", name: "Growth Strategy", icon: Briefcase, description: "Marketing hacks, growth loops & viral loops" },
  { id: "tech", name: "Tech Architecture", icon: Code, description: "Tech stack, system design & concurrent scale" },
  { id: "business", name: "Business Model", icon: BarChart3, description: "Unit economics, monetization & competitive moats" },
];

export default function CompanyCaseStudyPanel({ onPostGenerated }) {
  const [companies, setCompanies] = useState([
    { name: "Zomato", emoji: "🛵" },
    { name: "Zerodha", emoji: "📈" },
    { name: "Swiggy", emoji: "🍔" },
    { name: "Paytm", emoji: "📱" },
    { name: "CRED", emoji: "💳" },
    { name: "Airbnb", emoji: "🏡" },
    { name: "Apple", emoji: "🍎" },
  ]);
  const [companyName, setCompanyName] = useState("");
  const [selectedAngle, setSelectedAngle] = useState("founding");
  const [selectedFormat, setSelectedFormat] = useState("text");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedPost, setGeneratedPost] = useState(null);
  const [copied, setCopied] = useState(false);

  // Fetch daily trending companies
  useEffect(() => {
    async function fetchTrending() {
      try {
        const res = await fetch("/api/case-study/trending-companies");
        const data = await res.json();
        if (data.success && data.companies?.length > 0) {
          setCompanies(data.companies);
        }
      } catch (err) {
        console.error("Failed to load daily trending companies:", err);
      }
    }
    fetchTrending();
  }, []);

  async function handleGenerate() {
    if (!companyName.trim()) {
      setError("Please select or enter a company name.");
      return;
    }

    setLoading(true);
    setError("");
    setGeneratedPost(null);

    try {
      const res = await fetch("/api/case-study/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          angle: selectedAngle,
          format: selectedFormat,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate case study");

      if (data.success && data.post) {
        setGeneratedPost(data.post);
        if (onPostGenerated) {
          onPostGenerated(data.post);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!generatedPost) return;
    navigator.clipboard.writeText(generatedPost.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Configuration Form */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-5 md:p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-50 text-linkedin rounded-xl flex items-center justify-center border border-blue-100">
            <Building size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">🏢 Company Case Study Builder</h3>
            <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">Generate viral business and tech teardowns</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 text-red-650 border border-red-100 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Company Picker */}
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            Select or Enter Company <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full border border-emerald-250 animate-pulse uppercase tracking-wider font-extrabold">Updates Daily</span>
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {companies.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setCompanyName(c.name)}
                className={`text-[10.5px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                  companyName.toLowerCase() === c.name.toLowerCase()
                    ? "bg-linkedin text-white border-linkedin shadow-sm"
                    : "bg-gray-50 border-gray-200 text-gray-650 hover:bg-gray-100"
                }`}
              >
                {c.emoji || "🏢"} {c.name}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Or type custom company (e.g. Swiggy, Zerodha)"
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-linkedin/30 focus:border-linkedin bg-gray-50/20"
          />
        </div>

        {/* Narrative Angle */}
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider">Choose Analysis Angle</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ANGLES.map((angle) => {
              const IconComp = angle.icon;
              const isSelected = selectedAngle === angle.id;
              return (
                <button
                  key={angle.id}
                  type="button"
                  onClick={() => setSelectedAngle(angle.id)}
                  className={`flex items-start gap-3 p-3.5 border rounded-2xl text-left transition-all ${
                    isSelected
                      ? "border-linkedin bg-blue-50/30 ring-1 ring-linkedin shadow-sm"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-linkedin text-white" : "bg-gray-50 text-gray-400"
                  }`}>
                    <IconComp size={15} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">{angle.name}</p>
                    <p className="text-[9.5px] text-gray-400 font-semibold mt-0.5 leading-normal">{angle.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Post Format Options */}
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider">Format</label>
          <div className="flex gap-3">
            {[
              { id: "text", label: "Standard LinkedIn Post" },
              { id: "carousel", label: "Structured Slide Deck (Carousel)" }
            ].map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setSelectedFormat(fmt.id)}
                className={`flex-1 text-[11px] font-bold py-2.5 px-4 rounded-xl border text-center transition-all ${
                  selectedFormat === fmt.id
                    ? "bg-[#0A66C2]/10 text-linkedin border-linkedin font-black"
                    : "bg-white border-gray-200 text-gray-650 hover:bg-gray-50"
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-linkedin hover:bg-linkedin-hover disabled:opacity-50 text-white font-bold py-3 px-6 rounded-2xl shadow transition-all flex items-center justify-center gap-2 text-xs"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Analyzing & Writing Case Study Teardown...</span>
            </>
          ) : (
            <>
              <Sparkles size={13} />
              <span>Generate Viral Case Study</span>
            </>
          )}
        </button>
      </div>

      {/* Generated Preview Card */}
      {generatedPost && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm space-y-0.5 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <span className="text-[10px] bg-linkedin/10 text-linkedin border border-linkedin/10 px-2.5 py-1 rounded-xl font-bold uppercase tracking-wider">
              Draft Post Ready 🎯
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg transition"
              >
                {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                <span>{copied ? "Copied!" : "Copy Post"}</span>
              </button>
            </div>
          </div>
          <div className="p-5 md:p-6 space-y-4">
            {/* Post Content preview */}
            <div className="bg-gray-50/50 border border-gray-200/50 rounded-2xl p-4.5 font-sans text-xs text-gray-700 leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto font-semibold">
              {generatedPost.content}
            </div>

            {/* If Carousel Slide layout was generated, show structured slides section */}
            {generatedPost.metadata?.slides && generatedPost.metadata.slides.length > 0 && (
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Presentation size={13} className="text-linkedin" /> Visual Slide Deck Layout
                </p>
                <div className="flex gap-3.5 overflow-x-auto pb-3 select-none" style={{ scrollbarWidth: "none" }}>
                  {generatedPost.metadata.slides.map((s, idx) => (
                    <div key={idx} className="w-[180px] h-[130px] border border-slate-200/70 rounded-xl p-3 bg-gradient-to-br from-slate-50 to-white flex flex-col justify-between shrink-0 shadow-sm">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-linkedin">Slide {idx + 1}</span>
                      <p className="text-[10px] font-extrabold text-slate-800 line-clamp-1">{s.title}</p>
                      <p className="text-[8.5px] text-slate-400 leading-normal line-clamp-3">{s.content}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-gray-400 italic">
                  💡 This layout is automatically converted to PDF format inside our Carousel Generator!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
