import { getTodayTopic } from "@/lib/profile";
import { getBestTime, tierColor } from "@/lib/bestTime";
import { Lightbulb, Calendar, HelpCircle, Info, Target, Settings, Eye } from "lucide-react";

export default function StatsSidebar({ posts, settings, onOpenSettings }) {
  const total = posts.length;
  const posted = posts.filter((p) => p.status === "posted").length;
  const streak = computeStreak(posts);
  const today = getTodayTopic();
  const bestTime = getBestTime();

  return (
    <aside className="w-full space-y-4">
      {/* Stats summary card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
        <h3 className="font-bold text-gray-900 text-sm mb-3.5 flex items-center gap-1.5">
          <Target size={14} className="text-linkedin" /> Content Summary
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          <Stat label="Generated" value={total} />
          <Stat label="Published" value={posted} />
          <Stat label="Streak" value={`${streak}d`} />
          <Stat label="Pending" value={total - posted} />
        </div>
      </div>

      {/* Today's focus card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Today's Focus Topic</p>
        <h3 className="font-bold text-linkedin text-sm leading-tight">{today.topic}</h3>
        <p className="text-xs text-gray-500 mt-2.5 italic leading-relaxed border-l-2 border-gray-200 pl-3">"{today.example}"</p>
      </div>

      {/* Best time to post card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-shadow duration-200 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
            <Calendar size={14} className="text-linkedin" /> Best Time to Post
          </h3>
          {onOpenSettings && (
            <button 
              onClick={onOpenSettings} 
              className="text-[10px] font-bold text-linkedin hover:underline flex items-center gap-0.5"
            >
              <Settings size={10} /> Edit Settings
            </button>
          )}
        </div>
        <div className={`text-xs rounded-xl px-3.5 py-3 border leading-relaxed ${tierColor(bestTime.tier)}`}>
          <p className="font-bold">{bestTime.slot}</p>
          <p className="opacity-90 text-[11px] mt-0.5">{bestTime.note}</p>
        </div>
        {settings && (
          <p className="text-[10px] text-gray-400 font-semibold tracking-wide">
            {settings.reminderEnabled
              ? `✉️ Daily email reminder set at ${settings.reminderTime}`
              : "✉️ Email reminders disabled"}
            {settings.pushEnabled ? " • Push alerts on" : ""}
          </p>
        )}
      </div>

      {/* Algorithm tip card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
        <h3 className="font-bold text-gray-900 text-sm mb-2.5 flex items-center gap-1.5">
          <Lightbulb size={14} className="text-amber-500" /> Algorithm Tip
        </h3>
        <p className="text-xs text-gray-600 leading-relaxed font-medium">
          Reply to your first comment within 10 minutes of posting — author replies in the
          golden hour drive 64% more comments and 2.3x more views.
        </p>
      </div>
    </aside>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center flex flex-col justify-center items-center shadow-sm">
      <p className="text-lg font-black text-gray-900 leading-none">{value}</p>
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-tight mt-1">{label}</p>
    </div>
  );
}

function computeStreak(posts) {
  if (posts.length === 0) return 0;
  const dates = new Set(posts.map((p) => p.date));
  let streak = 0;
  const d = new Date();
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
