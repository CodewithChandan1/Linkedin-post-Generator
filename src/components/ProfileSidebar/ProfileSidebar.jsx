import { Edit3 } from "lucide-react";

export default function ProfileSidebar({ profile, onEdit, streakData, onStreakClick }) {
  if (!profile) {
    return (
      <aside className="w-full">
        <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden animate-pulse shadow-sm">
          <div className="h-16 bg-gray-100" />
          <div className="px-5 pb-5 -mt-8">
            <div className="w-14 h-14 rounded-2xl bg-gray-200 border-4 border-white" />
            <div className="h-4 bg-gray-200 rounded w-2/3 mt-3.5" />
            <div className="h-3 bg-gray-100 rounded w-full mt-2" />
            <div className="h-3 bg-gray-100 rounded w-1/2 mt-1.5" />
          </div>
        </div>
      </aside>
    );
  }

  const initials = profile.initials || profile.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  return (
    <aside className="w-full">
      <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 relative">
        {/* Cover banner - Solid LinkedIn Blue */}
        <div className="h-16 bg-[#0A66C2] relative">
          {onEdit && (
            <button
              id="tour-profile-edit"
              onClick={onEdit}
              className="absolute top-3.5 right-3.5 w-7 h-7 bg-white/20 hover:bg-white/30 text-white rounded-lg flex items-center justify-center transition-all border border-white/10 active:scale-95 shadow-sm"
              aria-label="Edit Profile"
              title="Edit Profile"
            >
              <Edit3 size={12} />
            </button>
          )}
        </div>
        
        {/* Avatar */}
        <div className="px-5 pb-4 -mt-7 flex items-end">
          <div className="w-14 h-14 bg-white text-[#0A66C2] flex items-center justify-center text-lg font-black border-4 border-white rounded-2xl shadow-md relative z-10">
            {initials}
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-5 pb-5">
          <h2 className="font-bold text-gray-900 text-sm md:text-base leading-tight">{profile.name}</h2>
          <p className="text-xs text-gray-500 mt-1 leading-normal font-medium">{profile.headline}</p>
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">{profile.location}</span>
            {streakData && (
              <button
                onClick={onStreakClick}
                className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 hover:bg-amber-100/70 transition px-2.5 py-1 rounded-full shadow-sm active:scale-95 shrink-0"
                title="View Creator Streak Details"
              >
                🔥 {streakData.currentStreak || 0} Day Streak
              </button>
            )}
          </div>
        </div>
        {/* Achievements Section — GitHub style */}
        {streakData && (
          <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/10 space-y-2.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Achievements</p>
            <div className="flex gap-3">
              {[
                { id: "apprentice", name: "Hook Apprentice", days: 3, emoji: "🦈", bg: "from-blue-600 to-indigo-500", border: "border-blue-300" },
                { id: "creator", name: "Content Creator", days: 7, emoji: "✍️", bg: "from-pink-500 via-purple-500 to-indigo-500", border: "border-purple-300" },
                { id: "alchemist", name: "Viral Alchemist", days: 15, emoji: "🤠", bg: "from-amber-400 to-orange-500", border: "border-orange-300" },
                { id: "influencer", name: "LinkedIn Legend", days: 30, emoji: "👑", bg: "from-violet-600 to-fuchsia-600", border: "border-fuchsia-300" },
              ].map((b) => {
                const currentStreak = streakData.currentStreak || 0;
                const isUnlocked = currentStreak >= b.days;
                return (
                  <div key={b.id} className="relative group cursor-pointer" onClick={onStreakClick}>
                    <div
                      className={`w-11 h-11 rounded-full border-2 flex items-center justify-center text-lg shadow-sm transition-all duration-300 relative ${
                        isUnlocked
                          ? `bg-gradient-to-br ${b.bg} ${b.border} scale-100 hover:scale-105 active:scale-95`
                          : "bg-gray-100 border-gray-250 grayscale opacity-30 hover:opacity-50"
                      }`}
                    >
                      <div className="absolute inset-0.5 rounded-full bg-white/10 pointer-events-none" />
                      <span>{b.emoji}</span>
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-28 bg-gray-900 text-white text-[9px] font-bold py-1.5 px-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center shadow-lg z-20 leading-tight">
                      {b.name}
                      <div className="text-[7.5px] text-gray-400 mt-0.5">{isUnlocked ? "Unlocked 🎉" : `${b.days}d streak`}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {profile.achievements && profile.achievements.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-2 bg-gray-50/20">
            {profile.achievements.slice(0, 3).map((a) => (
              <div key={a} className="flex items-start gap-2 text-xs text-gray-600">
                <span className="text-linkedin font-black mt-0.5">•</span>
                <span className="font-medium">{a}</span>
              </div>
            ))}
          </div>
        )}
        {profile.stack && profile.stack.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/20">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Tech stack</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.stack.map((s) => (
                <span key={s} className="text-[10px] bg-linkedin/10 text-linkedin border border-linkedin/10 px-2.5 py-1 rounded-xl font-bold">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
