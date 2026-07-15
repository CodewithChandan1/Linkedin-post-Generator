"use client";

import { useState } from "react";
import { X, BookOpen, ChevronDown, ChevronRight, Search } from "lucide-react";
import { SECTIONS_EN, SECTIONS_HI, UI_TRANSLATIONS } from "./docsData";

export default function ProjectDocs({ onClose }) {
  const [lang, setLang] = useState("en"); // Default to English
  const [search, setSearch] = useState("");
  const [openSections, setOpenSections] = useState({ "post-generation": true });
  const [openFeature, setOpenFeature] = useState(null);

  const t = UI_TRANSLATIONS[lang];
  const sections = lang === "en" ? SECTIONS_EN : SECTIONS_HI;
  const query = search.toLowerCase().trim();

  const filtered = sections.map((section) => ({
    ...section,
    features: section.features.filter(
      (f) =>
        !query ||
        f.name.toLowerCase().includes(query) ||
        f.what.toLowerCase().includes(query) ||
        f.how.toLowerCase().includes(query)
    ),
  })).filter((s) => !query || s.features.length > 0);

  function toggleSection(id) {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleFeature(id) {
    setOpenFeature((prev) => (prev === id ? null : id));
  }

  const totalFeaturesCount = sections.reduce((a, s) => a + s.features.length, 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[3px] z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-linkedin/10 text-linkedin rounded-xl flex items-center justify-center border border-linkedin/10">
              <BookOpen size={16} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">{t.title}</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">{t.subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200 shrink-0">
              <button
                onClick={() => setLang("en")}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${
                  lang === "en" ? "bg-white text-linkedin shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLang("hi")}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${
                  lang === "hi" ? "bg-white text-linkedin shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                हिंदी
              </button>
            </div>

            <button 
              onClick={onClose} 
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-100 shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-linkedin/30 focus:border-linkedin/40"
            />
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">
              {t.noFeatureFound.replace("{search}", search)}
            </div>
          )}

          {filtered.map((section) => (
            <div key={section.id} className="border border-gray-100 rounded-xl overflow-hidden">
              {/* Section header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center border text-[11px] ${section.color}`}>
                    {section.icon}
                  </span>
                  <div className="text-left">
                    <p className="text-xs font-bold text-gray-800">{section.title}</p>
                    <p className="text-[10px] text-gray-500">{section.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-full">
                    {section.features.length}
                  </span>
                  {openSections[section.id]
                    ? <ChevronDown size={14} className="text-gray-400" />
                    : <ChevronRight size={14} className="text-gray-400" />
                  }
                </div>
              </button>

              {/* Features list */}
              {openSections[section.id] && (
                <div className="divide-y divide-gray-50">
                  {section.features.map((feature) => {
                    const featureId = `${section.id}-${feature.name}`;
                    const isOpen = openFeature === featureId;
                    return (
                      <div key={feature.name}>
                        {/* Feature row */}
                        <button
                          onClick={() => toggleFeature(featureId)}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">{feature.icon}</span>
                            <span className="text-xs font-semibold text-gray-800">{feature.name}</span>
                          </div>
                          {isOpen
                            ? <ChevronDown size={12} className="text-gray-400 shrink-0" />
                            : <ChevronRight size={12} className="text-gray-400 shrink-0" />
                          }
                        </button>

                        {/* Feature detail */}
                        {isOpen && (
                          <div className="px-4 pb-4 space-y-3 bg-gray-50/50">
                            <div>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{t.what}</p>
                              <p className="text-xs text-gray-700 leading-relaxed">{feature.what}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{t.how}</p>
                              <p className="text-xs text-gray-700 leading-relaxed">{feature.how}</p>
                            </div>
                            <div className="bg-linkedin/5 border border-linkedin/20 rounded-lg px-3 py-2">
                              <p className="text-[10px] font-bold text-linkedin uppercase tracking-wider mb-0.5">{t.tip}</p>
                              <p className="text-xs text-gray-700 leading-relaxed">{feature.tip}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 shrink-0 flex items-center justify-between">
          <p className="text-[10px] text-gray-400">
            {totalFeaturesCount} {t.featuresCount}
          </p>
          <button
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-50 transition"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
