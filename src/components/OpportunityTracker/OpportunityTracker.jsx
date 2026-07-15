"use client";
// Opportunity Tracker — PRD §4.18

import { useState, useEffect } from "react";
import { Briefcase, DollarSign, Handshake, Mic, Target, Flame, Check, Mail, Copy, Info, RefreshCw, ChevronRight } from "lucide-react";
import {
  loadOpportunities,
  addOpportunity,
  getCurrentMonthSummary,
  OPPORTUNITY_TYPES,
} from "@/lib/opportunities";

// Map opportunity keys to lucide icons
const OPP_ICONS = {
  recruiter_dm: <Briefcase size={14} />,
  freelance: <DollarSign size={14} />,
  collaboration: <Handshake size={14} />,
  speaking: <Mic size={14} />,
  follower_milestone: <Target size={14} />,
  viral_post: <Flame size={14} />,
};

export default function OpportunityTracker({ onClose }) {
  const [opps, setOpps] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [note, setNote] = useState("");
  const [added, setAdded] = useState(false);

  // Email sync details
  const [userId, setUserId] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOpps(loadOpportunities());
    
    // Fetch opportunities from DB
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

    // Fetch user details to get unique ID
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.user) {
          setUserId(data.user.id);
        }
      })
      .catch((err) => console.error("Failed to fetch user:", err));
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

  function handleCopy() {
    const email = `sync-${userId}@sync.postedin.ai`;
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const { summary, total, month } = getCurrentMonthSummary(opps);
  const monthLabel = new Date(month + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const syncEmail = userId ? `sync-${userId}@sync.postedin.ai` : "Loading your email...";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[3px] z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-linkedin/10 text-linkedin rounded-xl flex items-center justify-center border border-linkedin/10">
              <Target size={16} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">Opportunity Tracker</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Track your LinkedIn ROI automatically</p>
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
        <div className="overflow-y-auto p-6 md:p-8 space-y-6">
          
          {/* This month summary */}
          <div className="bg-gradient-to-r from-linkedin/10 to-blue-50/30 rounded-2xl border border-linkedin/10 p-5">
            <p className="text-[11px] font-extrabold text-linkedin uppercase tracking-wider mb-3">
              {monthLabel} — {total} logged opportunit{total === 1 ? "y" : "ies"}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {OPPORTUNITY_TYPES.map(({ key, label }) =>
                summary[key] > 0 ? (
                  <div key={key} className="flex items-center gap-2 bg-white/60 border border-white rounded-xl p-3 shadow-sm">
                    <div className="w-8 h-8 bg-linkedin/10 text-linkedin rounded-lg flex items-center justify-center shrink-0">
                      {OPP_ICONS[key]}
                    </div>
                    <div>
                      <p className="text-base font-black text-gray-900 leading-none">{summary[key]}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1">{label}</p>
                    </div>
                  </div>
                ) : null
              )}
            </div>
            {total === 0 && (
              <p className="text-xs text-gray-500 leading-relaxed">
                No opportunities logged this month yet. Results typically compound and appear after 30–45 days of consistent content creation.
              </p>
            )}
          </div>

          {/* 100% Automated Email Sync Setup */}
          <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50/50 border-b border-gray-100">
              <div className="flex items-center gap-1.5 text-blue-900">
                <Mail size={14} className="text-blue-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider">100% Automated Email Sync</span>
              </div>
              <button
                onClick={handleCopy}
                disabled={!userId}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 ${
                  copied
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy Address</>}
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                Auto-forward LinkedIn alert emails to your personal sync address. Our AI parses details and logs them instantly.
              </p>

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center justify-between">
                <code className="text-xs text-gray-700 font-mono select-all truncate mr-2">{syncEmail}</code>
              </div>

              <div className="bg-blue-50/30 rounded-xl p-4 text-xs text-gray-600 space-y-2.5 border border-blue-100/50">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                  <span>Go to Gmail Settings &rarr; <strong>Forwarding</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                  <span>Create a filter: From <strong>linkedin.com</strong> containing "message" or "inquiry".</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                  <span>Set action to <strong>Forward</strong> to your personal sync email above.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Log new opportunity manually */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <p className="text-xs font-bold text-gray-700">Or Log Opportunity Manually</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {OPPORTUNITY_TYPES.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSelectedType(key)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs text-left transition active:scale-[0.99] ${
                    selectedType === key
                      ? "border-linkedin bg-linkedin/10 text-linkedin font-semibold"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="shrink-0">{OPP_ICONS[key]}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note (optional)"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-linkedin/30"
              />
              <button
                onClick={handleAdd}
                disabled={!selectedType}
                className="bg-linkedin hover:bg-linkedin-hover text-white text-xs font-bold px-6 py-2.5 rounded-xl disabled:opacity-50 transition active:scale-[0.98] flex items-center justify-center gap-1.5 shrink-0"
              >
                {added ? <><Check size={14} /> Logged!</> : "Log Opportunity"}
              </button>
            </div>
          </div>

          {/* Recent history */}
          {opps.length > 0 && (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold text-gray-700 mb-3.5">Recent Opportunity Feed</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {opps.slice(0, 10).map((o) => {
                  const type = OPPORTUNITY_TYPES.find((t) => t.key === o.type);
                  return (
                    <div key={o.id} className="flex items-center gap-3 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 hover:bg-gray-100/50 transition">
                      <span className="text-gray-400 shrink-0">{OPP_ICONS[o.type]}</span>
                      <span className="flex-1 font-medium">{type?.label}{o.note ? ` — ${o.note}` : ""}</span>
                      <span className="text-gray-400 text-[10px] shrink-0 font-semibold">{o.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-emerald-50/20 border border-emerald-100 rounded-2xl p-4 text-xs text-emerald-800 flex items-start gap-2.5">
            <Info size={14} className="shrink-0 mt-0.5 text-emerald-600" />
            <span>Active personal brands receive <strong>47% more inbound opportunities</strong>. Results compound over 12+ months.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
