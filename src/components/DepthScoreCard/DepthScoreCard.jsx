"use client";
// Depth Score Optimizer — PRD §4.15

import { useMemo } from "react";
import { computeDepthScore } from "@/lib/formatRotation";
import { BarChart2, ChevronRight, Check } from "lucide-react";

export default function DepthScoreCard({ post }) {
  const { score, level, tips } = useMemo(
    () => computeDepthScore(post?.content || ""),
    [post?.content]
  );

  const color =
    level === "High"
      ? { bar: "bg-emerald-500", badge: "text-emerald-700 bg-emerald-50 border-emerald-100/50", text: "text-emerald-700" }
      : level === "Medium"
      ? { bar: "bg-amber-500", badge: "text-amber-700 bg-amber-50 border-amber-100/50", text: "text-amber-700" }
      : { bar: "bg-rose-500", badge: "text-rose-700 bg-rose-50 border-rose-100/50", text: "text-rose-700" };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500">
            <BarChart2 size={13} />
          </div>
          <p className="text-xs font-bold text-gray-800">LinkedIn Depth Score</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-gray-900">{score}/100</span>
          <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold border uppercase tracking-wider ${color.badge}`}>
            {level}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div
          className={`${color.bar} h-1.5 rounded-full transition-all duration-300`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Tips */}
      {tips.length > 0 && (
        <div className="space-y-2 border-t border-gray-100 pt-3">
          {tips.slice(0, 2).map((tip, i) => (
            <p key={i} className="text-xs text-gray-600 leading-relaxed flex gap-2 items-start font-medium">
              <span className="text-linkedin font-black select-none">•</span>
              <span>{tip}</span>
            </p>
          ))}
        </div>
      )}

      {tips.length === 0 && (
        <div className="text-xs text-emerald-700 bg-emerald-50/50 border border-emerald-100/30 rounded-xl px-3 py-2 flex items-center gap-1.5 font-semibold">
          <Check size={12} className="stroke-[3]" /> Post is optimized for maximum LinkedIn Depth Score
        </div>
      )}

      <div className="text-[10px] text-gray-400 font-semibold border-t border-gray-50 pt-2">
        * Higher Depth Score yields more dwell time, which pushes your post to wider audiences.
      </div>
    </div>
  );
}
