import { getTodayTopic } from "@/lib/profile";
import { getBestTime, tierColor } from "@/lib/bestTime";
import { Lightbulb } from "lucide-react";

export default function StatsSidebar({ posts, settings, onOpenSettings }) {
  const total = posts.length;
  const posted = posts.filter((p) => p.status === "posted").length;
  const streak = computeStreak(posts);
  const today = getTodayTopic();
  const bestTime = getBestTime();

  return (
    <aside className="w-full space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-3">Your stats</h3>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Posts generated" value={total} />
          <Stat label="Published" value={posted} />
          <Stat label="Current streak" value={`${streak}d`} />
          <Stat label="Pending" value={total - posted} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-1">Today's focus</h3>
        <p className="text-linkedin font-medium text-sm">{today.topic}</p>
        <p className="text-xs text-gray-500 mt-1 italic">"{today.example}"</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm">Best time to post</h3>
          {onOpenSettings && (
            <button onClick={onOpenSettings} className="text-xs text-linkedin hover:underline">
              Settings
            </button>
          )}
        </div>
        <div className={`text-xs rounded-lg px-3 py-2 ${tierColor(bestTime.tier)}`}>
          <p className="font-medium">{bestTime.slot}</p>
          <p className="opacity-90">{bestTime.note}</p>
        </div>
        {settings && (
          <p className="text-xs text-gray-500 mt-2">
            {settings.reminderEnabled
              ? `Daily reminder at ${settings.reminderTime}`
              : "Reminders off"}
            {settings.pushEnabled ? " · push on" : ""}
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-1.5">
          <Lightbulb size={14} className="text-amber-500" /> Algorithm tip
        </h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          Reply to your first comment within 10 minutes of posting — author replies in the
          golden hour drive 64% more comments and 2.3x more views.
        </p>
      </div>
    </aside>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-linkedin-bg rounded-lg p-2.5">
      <p className="text-xl font-semibold text-gray-900">{value}</p>
      <p className="text-[11px] text-gray-500 leading-tight">{label}</p>
    </div>
  );
}

function computeStreak(posts) {
  if (posts.length === 0) return 0;
  const dates = new Set(posts.map((p) => p.date));
  let streak = 0;
  const d = new Date();
  // walk backwards from today while consecutive days exist
  // allow today to be missing without breaking the streak
  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().slice(0, 10);
    if (dates.has(key)) {
      streak++;
    } else if (i !== 0) {
      break;
    }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
