"use client";
// Profile Visitor Tracker — PRD §6.3

import { useState, useEffect } from "react";
import {
  loadVisits,
  logVisitCount,
  computeGrowth,
  getChartData,
} from "@/lib/profileVisits";

import { Eye, Check } from "lucide-react";

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-1.5">
              <Eye size={16} /> Profile Visitor Tracker
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Log weekly profile views — visualize growth</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Stats overview */}
          {visits.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-linkedin/5 border border-linkedin/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-linkedin">{latest}</p>
                <p className="text-xs text-gray-500">This week</p>
              </div>
              <div className={`rounded-xl p-3 text-center border ${
                growth === null ? "bg-gray-50 border-gray-200" :
                growth > 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              }`}>
                <p className={`text-2xl font-bold ${
                  growth === null ? "text-gray-500" :
                  growth > 0 ? "text-green-700" : "text-red-600"
                }`}>
                  {growth === null ? "–" : `${growth > 0 ? "+" : ""}${growth}%`}
                </p>
                <p className="text-xs text-gray-500">vs last week</p>
              </div>
            </div>
          )}

          {/* Bar chart */}
          {chartData.length > 1 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Last {chartData.length} weeks</p>
              <div className="flex items-end gap-1 h-24">
                {chartData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <p className="text-[9px] text-gray-500">{d.count}</p>
                    <div
                      className="w-full bg-linkedin rounded-t-sm transition-all"
                      style={{ height: `${Math.max(4, Math.round((d.count / maxCount) * 72))}px` }}
                    />
                    <p className="text-[8px] text-gray-400 text-center leading-tight">
                      {d.week.split("-W")[1] ? `W${d.week.split("-W")[1]}` : d.week}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Log new count */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-700">Log this week's profile views</p>
            <p className="text-[11px] text-gray-500">
              Find this in LinkedIn → Analytics → Profile views → This week
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                placeholder="e.g. 248"
                min="0"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/30"
              />
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note (optional)"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/30"
              />
            </div>
            <button
              onClick={handleLog}
              disabled={!count || isNaN(Number(count))}
              className="w-full bg-linkedin hover:bg-linkedin-hover text-white text-sm font-medium py-2 rounded-full disabled:opacity-50 transition flex items-center justify-center gap-1.5"
            >
              {added ? <><Check size={14} /> Logged!</> : "Log This Week's Views"}
            </button>
          </div>

          {/* History */}
          {visits.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">History</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {visits.slice(0, 12).map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                    <span className="font-medium">{v.count} views</span>
                    <span className="text-gray-400">{v.date}{v.note ? ` — ${v.note}` : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {visits.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">
              Log your first week's profile views above to start tracking growth
            </p>
          )}

          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">
            Consistent posting = compounding profile views. Track weekly to see the correlation.
          </div>
        </div>
      </div>
    </div>
  );
}
