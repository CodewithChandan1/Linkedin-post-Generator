import { Edit3 } from "lucide-react";

export default function ProfileSidebar({ profile, onEdit }) {
  if (!profile) {
    return (
      <aside className="w-full">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
          <div className="h-16 bg-gray-200" />
          <div className="px-4 pb-4 -mt-8">
            <div className="w-16 h-16 rounded-full bg-gray-300 border-4 border-white" />
            <div className="h-4 bg-gray-300 rounded w-2/3 mt-3" />
            <div className="h-3 bg-gray-200 rounded w-full mt-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2 mt-1" />
          </div>
        </div>
      </aside>
    );
  }

  const initials = profile.initials || profile.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  return (
    <aside className="w-full">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Cover banner */}
        <div className="h-16 bg-gradient-to-r from-linkedin to-sky-400" />
        <div className="px-4 pb-4 -mt-8 flex justify-between items-end">
          <div className="w-16 h-16 rounded-full bg-linkedin text-white flex items-center justify-center text-xl font-semibold border-4 border-white">
            {initials}
          </div>
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-xs text-linkedin bg-linkedin/10 hover:bg-linkedin/20 border border-linkedin/10 rounded-full px-3 py-1 font-medium transition flex items-center gap-1 mb-1"
              aria-label="Edit Profile"
            >
              <Edit3 size={12} /> Edit
            </button>
          )}
        </div>
        <div className="px-4 pb-4">
          <h2 className="font-semibold text-gray-900 leading-tight">{profile.name}</h2>
          <p className="text-sm text-gray-600 mt-0.5">{profile.headline}</p>
          <p className="text-xs text-gray-500 mt-1">{profile.location}</p>
        </div>
        {profile.achievements && profile.achievements.length > 0 && (
          <div className="border-t border-gray-200 px-4 py-3 space-y-2">
            {profile.achievements.slice(0, 3).map((a) => (
              <div key={a} className="flex items-start gap-2 text-xs text-gray-600">
                <span className="text-linkedin mt-0.5">●</span>
                <span>{a}</span>
              </div>
            ))}
          </div>
        )}
        {profile.stack && profile.stack.length > 0 && (
          <div className="border-t border-gray-200 px-4 py-3">
            <p className="text-xs font-medium text-gray-500 mb-2">Tech stack</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.stack.map((s) => (
                <span key={s} className="text-[11px] bg-linkedin/10 text-linkedin px-2 py-0.5 rounded-full">
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
