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
      ? { bar: "bg-green-500", badge: "text-green-700 bg-green-50 border-green-200", text: "text-green-700" }
      : level === "Medium"
      ? { bar: "bg-amber-500", badge: "text-amber-700 bg-amber-50 border-amber-200", text: "text-amber-700" }
      : { bar: "bg-red-400", badge: "text-red-700 bg-red-50 border-red-200", text: "text-red-700" };

  return (
    <div className={`rounded-xl border p-3 ${color.badge}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BarChart2 size={14} className="text-gray-600" />
          <p className="text-xs font-semibold text-gray-800">Depth Score</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-bold ${color.text}`}>{score}/100</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${color.badge}`}>
            {level}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
        <div
          className={`${color.bar} h-1.5 rounded-full transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Tips */}
      {tips.length > 0 && (
        <div className="space-y-1">
          {tips.slice(0, 2).map((tip, i) => (
            <p key={i} className="text-[11px] text-gray-600 leading-snug flex gap-1.5 items-start">
              <ChevronRight size={11} className="shrink-0 mt-0.5" />
              {tip}
            </p>
          ))}
        </div>
      )}

      {tips.length === 0 && (
        <p className="text-[11px] text-green-700 flex items-center gap-1">
          <Check size={11} /> Post is optimized for maximum LinkedIn Depth Score
        </p>
      )}

      <p className="text-[10px] text-gray-400 mt-2">
        Higher Depth Score = more dwell time = algorithm pushes post to more people
      </p>
    </div>
  );
}
