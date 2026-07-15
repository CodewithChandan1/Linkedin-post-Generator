"use client";

import { useEffect } from "react";
import { Flame, Lock, CheckCircle2 } from "lucide-react";

export const BADGE_TIERS = [
  {
    id: "apprentice",
    name: "Hook Apprentice",
    daysRequired: 3,
    emoji: "🦈",
    bg: "from-blue-600 to-indigo-500",
    border: "border-blue-300",
    bgColor: "bg-blue-50/30 border-blue-100",
    textColor: "text-blue-600",
    desc: "Start strong! Unlocked by writing and posting 3 days in a row.",
  },
  {
    id: "creator",
    name: "Content Creator",
    daysRequired: 7,
    emoji: "✍️",
    bg: "from-pink-500 via-purple-500 to-indigo-500",
    border: "border-purple-300",
    bgColor: "bg-purple-50/30 border-purple-100",
    textColor: "text-purple-605",
    desc: "A full week of sharing value! Unlocked by posting 7 days in a row.",
  },
  {
    id: "alchemist",
    name: "Viral Alchemist",
    daysRequired: 15,
    emoji: "🤠",
    bg: "from-amber-400 to-orange-500",
    border: "border-orange-300",
    bgColor: "bg-orange-50/30 border-orange-100",
    textColor: "text-orange-600",
    desc: "Optimizing reach and value! Unlocked by posting 15 days in a row.",
  },
  {
    id: "influencer",
    name: "LinkedIn Legend",
    daysRequired: 30,
    emoji: "👑",
    bg: "from-violet-600 to-fuchsia-600",
    border: "border-fuchsia-300",
    bgColor: "bg-violet-50/30 border-violet-100",
    textColor: "text-violet-600",
    desc: "Mastery of consistency & audience reach. Unlocked by posting 30 days in a row.",
  },
];

export default function StreakProgressModal({ open, onClose, streakData = {} }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const currentStreak = streakData.currentStreak || 0;
  const maxStreak = streakData.maxStreak || 0;
  const activeDays = streakData.activeDays || [];

  // 1. Weekly Checklist Calculation
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekList = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const dayLabel = daysOfWeek[d.getDay()];
    const dateStr = d.toISOString().split("T")[0];
    const isToday = idx === 6;
    const active = activeDays.includes(dateStr);
    return { dayLabel, active, isToday };
  });

  // 2. Heatmap Matrix Calculation (16 Weeks)
  const weeksCount = 16;
  const totalDays = weeksCount * 7;
  const today = new Date();
  const startOffset = today.getDay();
  const startDate = new Date();
  startDate.setDate(today.getDate() - (totalDays - 1 - (6 - startOffset)));

  const rows = [0, 1, 2, 3, 4, 5, 6];
  const columns = Array.from({ length: weeksCount });

  function getDayCell(weekIdx, dayIdx) {
    const d = new Date(startDate);
    const dayOffset = weekIdx * 7 + dayIdx;
    d.setDate(startDate.getDate() + dayOffset);
    const dateStr = d.toISOString().split("T")[0];
    const isToday = dateStr === new Date().toISOString().split("T")[0];
    const hasPosted = activeDays.includes(dateStr);
    
    return {
      dateStr,
      hasPosted,
      isToday,
    };
  }

  const monthLabels = [];
  let prevMonth = -1;
  for (let w = 0; w < weeksCount; w++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + w * 7);
    const m = d.getMonth();
    const monthName = d.toLocaleString("en-US", { month: "short" });
    if (m !== prevMonth) {
      monthLabels.push({ label: monthName, index: w });
      prevMonth = m;
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-[3px] z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[28px] w-full max-w-xl shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center border border-amber-100">
              <Flame size={16} className="animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">Creator Achievements</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Track consistency with weekly checks and contribution squares</p>
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
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
          {/* Flame Counter Widget */}
          <div className="text-center py-4 bg-amber-50/30 border border-amber-100/50 rounded-2xl space-y-2">
            <div className="relative inline-block">
              <Flame size={44} className="text-amber-500 fill-amber-400 mx-auto animate-bounce" />
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900">{currentStreak} Day Streak</h3>
              <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mt-0.5">Personal Best: {maxStreak} Days</p>
            </div>
          </div>

          {/* 1. 7-Day Activity Grid (Weekly Checklist) */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-700">Weekly Consistency Check</p>
            <div className="grid grid-cols-7 gap-2 bg-gray-50 border border-gray-200/50 p-3.5 rounded-2xl">
              {weekList.map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <span className={`text-[9px] font-extrabold uppercase ${item.isToday ? "text-linkedin font-black" : "text-gray-400"}`}>
                    {item.dayLabel}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
                      item.active
                        ? "bg-[#0A66C2] text-white border-[#0A66C2] shadow-sm"
                        : item.isToday
                        ? "bg-white text-gray-400 border-dashed border-gray-300"
                        : "bg-white text-gray-300 border-gray-200"
                    }`}
                  >
                    {item.active ? (
                      <CheckCircle2 size={13} className="stroke-[2.5]" />
                    ) : (
                      <span className="text-[9px] font-bold">{item.isToday ? "•" : ""}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. GitHub-style Contribution Heatmap */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-700">Long-term Contributions</p>
              <p className="text-[10px] text-gray-400 font-bold">{activeDays.length} posts in last 16 weeks</p>
            </div>
            
            <div className="border border-gray-200/60 rounded-2xl p-5 bg-white space-y-3.5 shadow-sm overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              <div className="min-w-[480px]">
                {/* Month headers row */}
                <div className="flex text-[9px] font-bold text-gray-400 select-none pb-1 relative h-4">
                  {monthLabels.map((ml, idx) => (
                    <span
                      key={idx}
                      className="absolute"
                      style={{ left: `${(ml.index * 26.5) + 32}px` }}
                    >
                      {ml.label}
                    </span>
                  ))}
                </div>

                {/* Heatmap grid */}
                <div className="flex gap-1.5">
                  {/* Row day labels */}
                  <div className="flex flex-col justify-between text-[9px] font-bold text-gray-400 select-none w-7 py-0.5">
                    <span>Sun</span>
                    <span>Wed</span>
                    <span>Sat</span>
                  </div>

                  {/* Grid cells mapped as columns of weeks */}
                  <div className="flex flex-1 justify-between">
                    {columns.map((_, wIdx) => (
                      <div key={wIdx} className="flex flex-col gap-1.5">
                        {rows.map((rIdx) => {
                          const cell = getDayCell(wIdx, rIdx);
                          return (
                            <div
                              key={rIdx}
                              className={`w-3.5 h-3.5 rounded-[3px] transition-all relative group cursor-pointer ${
                                cell.hasPosted
                                  ? "bg-[#0A66C2] border border-[#0A66C2]/80 shadow-[0_0_2px_#0A66C2]"
                                  : cell.isToday
                                  ? "bg-white border-2 border-dashed border-gray-300"
                                  : "bg-gray-100 hover:bg-gray-200 border border-gray-200/30"
                              }`}
                            >
                              {/* Hover Tooltip showing date */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-gray-900 text-white text-[8px] font-bold py-1 px-1.5 rounded shadow-lg pointer-events-none whitespace-nowrap z-30">
                                {cell.dateStr} {cell.hasPosted ? "(Posted)" : "(No posts)"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-between text-[9.5px] font-bold text-gray-400 border-t border-gray-50 pt-3">
                <a href="#" className="hover:underline text-[9px]" onClick={(e) => { e.preventDefault(); alert("Posting daily consistency feeds LinkedIn's algorithm to trigger maximum impressions!"); }}>
                  Learn how we count contributions
                </a>
                <div className="flex items-center gap-1 leading-none select-none">
                  <span>Less</span>
                  <div className="w-3 h-3 rounded-[3px] bg-gray-100 border border-gray-200/30" />
                  <div className="w-3 h-3 rounded-[3px] bg-[#0A66C2]/40" />
                  <div className="w-3 h-3 rounded-[3px] bg-[#0A66C2]/70" />
                  <div className="w-3 h-3 rounded-[3px] bg-[#0A66C2]" />
                  <span>More</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Progression Badges List */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-700">Progression Milestones</p>
            <div className="space-y-3">
              {BADGE_TIERS.map((badge) => {
                const isUnlocked = currentStreak >= badge.daysRequired;
                const progressPercentage = Math.min((currentStreak / badge.daysRequired) * 100, 100);

                return (
                  <div
                    key={badge.id}
                    className={`flex items-start gap-4 p-4 border rounded-2xl transition-all duration-200 ${
                      isUnlocked
                        ? `${badge.bgColor} shadow-sm`
                        : "bg-white border-gray-150 opacity-70"
                    }`}
                  >
                    {/* GitHub Style Circular Sticker Badge */}
                    <div
                      className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-xl shadow-md transition-all duration-300 relative shrink-0 ${
                        isUnlocked
                          ? `bg-gradient-to-br ${badge.bg} ${badge.border} scale-100 hover:scale-110`
                          : "bg-gray-100 border-gray-200 grayscale opacity-40"
                      }`}
                    >
                      <div className="absolute inset-0.5 rounded-full bg-white/10 pointer-events-none" />
                      <span>{badge.emoji}</span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 leading-none">{badge.name}</span>
                        <span className={`text-[9px] font-extrabold uppercase tracking-wider ${isUnlocked ? badge.textColor : "text-gray-400"}`}>
                          {isUnlocked ? "Unlocked 🎉" : `${badge.daysRequired} Days`}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-normal font-semibold">
                        {badge.desc}
                      </p>
                      {/* Progress bar for locked states */}
                      {!isUnlocked && (
                        <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden mt-1.5">
                          <div
                            className="bg-gray-300 h-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
          <button
            onClick={onClose}
            className="text-xs text-gray-600 font-bold px-5 py-2.5 rounded-full hover:bg-gray-100 transition"
          >
            Got it, Let's build!
          </button>
        </div>
      </div>
    </div>
  );
}
