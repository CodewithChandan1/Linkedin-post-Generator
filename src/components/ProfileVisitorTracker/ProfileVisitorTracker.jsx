"use client";
// Profile Visitor Tracker — PRD §6.3

import { useState, useEffect } from "react";
import { loadVisits, logVisitCount, computeGrowth, getChartData } from "@/lib/profileVisits";
import { Eye, Check, TrendingUp, HelpCircle, ChevronRight, ClipboardList, Info, Calendar } from "lucide-react";

export default function ProfileVisitorTracker({ onClose }) {
  const [visits, setVisits] = useState([]);
  const [count, setCount] = useState("");
  const [note, setNote] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setVisits(loadVisits());
    fetch("/api/profile-visits")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.visits) {
          const formatted = data.visits.map((v) => ({
            id: Number(v.visitId),
            count: v.count,
            note: v.note,
            week: v.week,
            date: v.date,
            createdAt: v.createdAt,
          }));
          setVisits(formatted);
          const { saveVisits } = require("@/lib/profileVisits");
          saveVisits(formatted);
        }
      })
      .catch((err) => console.error("Failed to load profile visits from DB:", err));
  }, []);

  function handleLog() {
    if (!count || isNaN(Number(count))) return;
    const updated = logVisitCount(Number(count), note);
    setVisits(updated);
    setCount("");
    setNote("");
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const growth = computeGrowth(visits);
  const chartData = getChartData(visits);
  const latest = visits[0]?.count || 0;
  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[3px] z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-linkedin/10 text-linkedin rounded-xl flex items-center justify-center border border-linkedin/10">
              <Eye size={16} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">Profile Visitor Tracker</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Track how your LinkedIn content drives profile views</p>
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
          
          {/* Stats overview card */}
          {visits.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200/80 rounded-2xl p-4.5 text-center shadow-sm">
                <p className="text-3xl font-black text-linkedin leading-none">{latest}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-2">Views This Week</p>
              </div>
              <div className={`rounded-2xl p-4.5 text-center border shadow-sm ${
                growth === null ? "bg-white border-gray-200/80" :
                growth > 0 ? "bg-emerald-50/20 border-emerald-100" : "bg-rose-50/20 border-rose-100"
              }`}>
                <p className={`text-3xl font-black leading-none ${
                  growth === null ? "text-gray-400" :
                  growth > 0 ? "text-emerald-600" : "text-rose-600"
                }`}>
                  {growth === null ? "–" : `${growth > 0 ? "+" : ""}${growth}%`}
                </p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-2">vs Last Week</p>
              </div>
            </div>
          )}

          {/* Bar chart card */}
          {chartData.length > 1 && (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={12} className="text-linkedin" /> Weekly Views Trend
              </p>
              <div className="flex items-end gap-2.5 h-28 pt-4">
                {chartData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <p className="text-[9px] font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150">{d.count}</p>
                    <div
                      className="w-full bg-linkedin/85 hover:bg-linkedin rounded-t-lg transition-all duration-200 shadow-sm"
                      style={{ height: `${Math.max(6, Math.round((d.count / maxCount) * 80))}px` }}
                    />
                    <p className="text-[9px] font-extrabold text-gray-400 tracking-wider">
                      {d.week.split("-W")[1] ? `W${d.week.split("-W")[1]}` : d.week}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Log views form */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-700 mb-1">Log This Week's Profile Views</p>
              <p className="text-[11px] text-gray-400 flex items-center gap-1">
                <Info size={11} /> Find this under LinkedIn &rarr; Analytics &rarr; Profile views &rarr; This week
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                placeholder="Number of views (e.g. 248)"
                min="0"
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-linkedin/30 transition placeholder-gray-400"
              />
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note / Milestone (optional)"
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-linkedin/30 transition placeholder-gray-400"
              />
            </div>
            
            <button
              onClick={handleLog}
              disabled={!count || isNaN(Number(count))}
              className="w-full bg-linkedin hover:bg-linkedin-hover text-white font-bold py-3 rounded-full text-xs disabled:opacity-50 transition shadow-sm hover:shadow active:scale-[0.99] flex items-center justify-center gap-1.5"
            >
              {added ? <><Check size={14} /> Logged!</> : "Log Weekly Views"}
            </button>
          </div>

          {/* History feed */}
          {visits.length > 0 && (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold text-gray-700 mb-3.5">Logged View History</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {visits.slice(0, 12).map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 hover:bg-gray-100/50 transition">
                    <span className="font-bold text-linkedin">{v.count} views</span>
                    <span className="text-gray-400 text-[10px] font-semibold">{v.date}{v.note ? ` — ${v.note}` : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {visits.length === 0 && (
            <div className="text-center py-6 border border-dashed border-gray-200 rounded-2xl">
              <Eye size={28} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs text-gray-500">Log your first week's profile views above to start tracking growth</p>
            </div>
          )}

          <div className="bg-emerald-50/20 border border-emerald-100 rounded-2xl p-4 text-xs text-emerald-800 flex items-start gap-2.5">
            <Info size={14} className="shrink-0 mt-0.5 text-emerald-600" />
            <span>Consistent content creation leads to compounding profile visits. Track views weekly to analyze growth trends.</span>
          </div>

        </div>
      </div>
    </div>
  );
}
