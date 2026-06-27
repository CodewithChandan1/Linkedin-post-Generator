"use client";
// Opportunity Tracker — PRD §4.18

import { useState, useEffect } from "react";
import { Briefcase, DollarSign, Handshake, Mic, Target, Flame, Check } from "lucide-react";
import {
  loadOpportunities,
  addOpportunity,
  getCurrentMonthSummary,
  OPPORTUNITY_TYPES,
} from "@/lib/opportunities";

// Map opportunity keys to lucide icons
const OPP_ICONS = {
  recruiter_dm: <Briefcase size={16} />,
  freelance: <DollarSign size={16} />,
  collaboration: <Handshake size={16} />,
  speaking: <Mic size={16} />,
  follower_milestone: <Target size={16} />,
  viral_post: <Flame size={16} />,
};

export default function OpportunityTracker({ onClose }) {
  const [opps, setOpps] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [note, setNote] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setOpps(loadOpportunities());
    fetch("/api/opportunities")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.opportunities) {
          const formatted = data.opportunities.map((o) => ({
            id: Number(o.oppId),
            type: o.type,
            note: o.note,
            date: o.date,
            createdAt: o.createdAt,
          }));
          setOpps(formatted);
          const { saveOpportunities } = require("@/lib/opportunities");
          saveOpportunities(formatted);
        }
      })
      .catch((err) => console.error("Failed to load opportunities from DB:", err));
  }, []);

  function handleAdd() {
    if (!selectedType) return;
    const updated = addOpportunity(selectedType, note);
    setOpps(updated);
    setNote("");
    setSelectedType("");
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const { summary, total, month } = getCurrentMonthSummary(opps);
  const monthLabel = new Date(month + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-1.5">
              <Target size={16} /> Opportunity Tracker
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Log inbound results from your LinkedIn presence</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-4 space-y-4">
          {/* This month summary */}
          <div className="bg-gradient-to-r from-linkedin/10 to-blue-50 rounded-xl border border-linkedin/20 p-4">
            <p className="text-xs font-semibold text-linkedin mb-2">
              {monthLabel} — {total} opportunit{total === 1 ? "y" : "ies"}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {OPPORTUNITY_TYPES.map(({ key, label }) =>
                summary[key] > 0 ? (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className="text-linkedin">{OPP_ICONS[key]}</span>
                    <div>
                      <p className="text-lg font-bold text-gray-900 leading-none">{summary[key]}</p>
                      <p className="text-[10px] text-gray-500">{label}</p>
                    </div>
                  </div>
                ) : null
              )}
            </div>
            {total === 0 && (
              <p className="text-xs text-gray-500">
                No opportunities logged this month yet. Results typically appear 30–45 days after consistent posting.
              </p>
            )}
          </div>

          {/* Log new opportunity */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">Log a new opportunity</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {OPPORTUNITY_TYPES.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSelectedType(key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs text-left transition ${
                    selectedType === key
                      ? "border-linkedin bg-linkedin/10 text-linkedin"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="shrink-0">{OPP_ICONS[key]}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note (optional)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/30 mb-2"
            />

            <button
              onClick={handleAdd}
              disabled={!selectedType}
              className="w-full bg-linkedin hover:bg-linkedin-hover text-white text-sm font-medium py-2.5 rounded-full disabled:opacity-50 transition flex items-center justify-center gap-1.5"
            >
              {added ? <><Check size={14} /> Logged!</> : "Log Opportunity"}
            </button>
          </div>

          {/* Recent history */}
          {opps.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Recent history</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {opps.slice(0, 10).map((o) => {
                  const type = OPPORTUNITY_TYPES.find((t) => t.key === o.type);
                  return (
                    <div key={o.id} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-gray-500">{OPP_ICONS[o.type]}</span>
                      <span className="flex-1">{type?.label}{o.note ? ` — ${o.note}` : ""}</span>
                      <span className="text-gray-400 shrink-0">{o.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">
            Active personal brands receive <strong>47% more inbound opportunities</strong>. Results compound over 12+ months.
          </div>
        </div>
      </div>
    </div>
  );
}
