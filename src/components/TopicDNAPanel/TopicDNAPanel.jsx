"use client";
// Topic DNA Tracker — PRD §4.10

import { useMemo } from "react";
import {
  computeTopicDNA,
  getAuthorityScore,
  getTopicWarnings,
  TOPIC_LIST,
} from "@/lib/topicDNA";
import { Dna, AlertTriangle } from "lucide-react";

export default function TopicDNAPanel({ posts }) {
  const counts = useMemo(() => computeTopicDNA(posts), [posts]);
  const warnings = useMemo(() => getTopicWarnings(counts, posts), [counts, posts]);

  // Only show topics that have at least 1 post in last 30 days OR are core topics
  const coreTopics = ["React.js", "Next.js", "Node.js", "Web3", "Blockchain", "Career"];
  const displayTopics = TOPIC_LIST.filter(
    (t) => counts[t] > 0 || coreTopics.includes(t)
  ).filter((t) => !["Trending", "Custom"].includes(t));

  const maxCount = Math.max(...displayTopics.map((t) => counts[t]), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
          <Dna size={14} className="text-linkedin" /> Topic DNA
        </h3>
        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Last 30 days</span>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {warnings.slice(0, 2).map((w, i) => (
            <div key={i} className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 leading-snug flex items-start gap-1.5">
              <AlertTriangle size={11} className="shrink-0 mt-0.5" /> {w.message}
            </div>
          ))}
        </div>
      )}

      {/* Topic bars */}
      <div className="space-y-2">
        {displayTopics.map((topic) => {
          const count = counts[topic] || 0;
          const { level, color } = getAuthorityScore(count);
          const barWidth = maxCount > 0 ? Math.max(4, Math.round((count / maxCount) * 100)) : 4;

          return (
            <div key={topic}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-gray-700 font-medium">{topic}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${color}`}>
                    {level}
                  </span>
                  <span className="text-[11px] text-gray-400">{count}p</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    count === 0
                      ? "bg-gray-200"
                      : count >= 5
                      ? "bg-linkedin"
                      : count >= 3
                      ? "bg-blue-400"
                      : "bg-amber-400"
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
        Post consistently on same topics — LinkedIn rewards topic experts with broader distribution.
        Target 3+ posts/topic per month.
      </p>
    </div>
  );
}
