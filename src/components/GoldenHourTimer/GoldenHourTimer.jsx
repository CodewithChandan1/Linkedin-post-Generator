"use client";
import { useState, useEffect, useRef } from "react";
import { Rocket, Clock, Zap, CheckCircle, MessageSquare, Check } from "lucide-react";

const MILESTONES = [
  {
    at: 0,
    Icon: Rocket,
    title: "Post is live!",
    message: "Go reply to the FIRST comment within 10 minutes — it signals the algorithm that you're an active author.",
    urgency: "high",
  },
  {
    at: 30,
    Icon: Clock,
    title: "30 minutes in",
    message: "45 mins left in the golden window — how many comments have you replied to? Author replies = 64% more total comments.",
    urgency: "medium",
  },
  {
    at: 60,
    Icon: Zap,
    title: "60 minutes in",
    message: "30 mins left — add a thoughtful follow-up in the comments to boost dwell time and keep the thread alive.",
    urgency: "medium",
  },
  {
    at: 90,
    Icon: CheckCircle,
    title: "Golden window closed",
    message: "Check back in 24 hrs to see if it's getting late traction. Great work posting today!",
    urgency: "low",
  },
];

function generateReplyTemplates(postContent) {
  const topic = postContent?.split("\n")[0]?.slice(0, 60) || "this topic";
  return [
    `Thanks for reading! What's been your experience with ${topic.length > 30 ? "this" : topic}? Would love to hear your take`,
    `Appreciate the engagement! If you found this useful, I post about React, Next.js and Web3 daily — follow along for more like this.`,
    `Great point! I actually ran into something similar while building my project — happy to share more details if you're interested. Drop a comment!`,
  ];
}

export default function GoldenHourTimer({ post, onDismiss }) {
  const [elapsedMins, setElapsedMins] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [reachedMilestones, setReachedMilestones] = useState(new Set([0]));
  const [copiedIdx, setCopiedIdx] = useState(null);
  const intervalRef = useRef(null);

  const postedAt = post?.postedAt ? new Date(post.postedAt) : null;
  const replyTemplates = generateReplyTemplates(post?.content);

  useEffect(() => {
    if (!postedAt) return;
    const now = new Date();
    const initialMins = Math.floor((now - postedAt) / 60000);
    setElapsedMins(initialMins);
    const passed = new Set();
    MILESTONES.forEach((m) => { if (initialMins >= m.at) passed.add(m.at); });
    setReachedMilestones(passed);

    intervalRef.current = setInterval(() => {
      const mins = Math.floor((new Date() - postedAt) / 60000);
      setElapsedMins(mins);
      setReachedMilestones((prev) => {
        const next = new Set(prev);
        MILESTONES.forEach((m) => { if (mins >= m.at) next.add(m.at); });
        return next;
      });
    }, 30000);

    return () => clearInterval(intervalRef.current);
  }, [post?.postedAt]);

  if (dismissed || !postedAt) return null;

  const remaining = Math.max(0, 90 - elapsedMins);
  const progress = Math.min(100, (elapsedMins / 90) * 100);
  const isOver = elapsedMins >= 90;
  const currentMilestone =
    [...MILESTONES].reverse().find((m) => elapsedMins >= m.at) || MILESTONES[0];
  const MilestoneIcon = currentMilestone.Icon;

  async function copyTemplate(text, idx) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {}
  }

  return (
    <div
      className={`rounded-xl border-2 p-4 ${
        isOver
          ? "border-gray-200 bg-gray-50"
          : currentMilestone.urgency === "high"
          ? "border-red-300 bg-red-50"
          : "border-amber-300 bg-amber-50"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MilestoneIcon
            size={18}
            className={isOver ? "text-gray-400" : "text-amber-600"}
          />
          <div>
            <p className={`text-sm font-semibold ${isOver ? "text-gray-700" : "text-amber-900"}`}>
              {isOver
                ? "Golden window closed"
                : `Golden Hour — ${remaining} min left`}
            </p>
            <p className="text-[11px] text-gray-500">
              {isOver
                ? "Post published — check back for late traction"
                : "Author replies in 90 min = 2.3x more views"}
            </p>
          </div>
        </div>
        <button
          onClick={() => { setDismissed(true); onDismiss?.(); }}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>

      {/* Progress bar */}
      {!isOver && (
        <div className="w-full bg-amber-200 rounded-full h-1.5 mb-3">
          <div
            className="bg-amber-500 h-1.5 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <p className="text-xs text-gray-700 leading-relaxed mb-3">
        {currentMilestone.message}
      </p>

      {/* Milestone timeline */}
      <div className="flex items-center mb-4">
        {MILESTONES.map((m, i) => {
          const Icon = m.Icon;
          return (
            <div key={m.at} className="flex items-center flex-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  reachedMilestones.has(m.at)
                    ? "bg-amber-500 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
                title={`T+${m.at} min`}
              >
                {reachedMilestones.has(m.at) ? (
                  <Check size={12} />
                ) : (
                  <Icon size={11} />
                )}
              </div>
              {i < MILESTONES.length - 1 && (
                <div
                  className={`flex-1 h-0.5 ${
                    reachedMilestones.has(MILESTONES[i + 1].at)
                      ? "bg-amber-400"
                      : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Reply templates */}
      {!isOver && (
        <div>
          <p className="text-[11px] font-semibold text-gray-600 mb-2 flex items-center gap-1">
            <MessageSquare size={11} /> Reply templates — copy and use on LinkedIn:
          </p>
          <div className="space-y-2">
            {replyTemplates.map((t, i) => (
              <div
                key={i}
                className="flex items-start gap-2 bg-white rounded-lg p-2.5 border border-amber-100"
              >
                <p className="text-xs text-gray-700 flex-1 leading-relaxed">{t}</p>
                <button
                  onClick={() => copyTemplate(t, i)}
                  className="shrink-0 text-[10px] text-amber-700 border border-amber-300 px-2 py-0.5 rounded-full hover:bg-amber-50"
                >
                  {copiedIdx === i ? "Copied" : "Copy"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
