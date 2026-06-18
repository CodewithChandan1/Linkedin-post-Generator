import { profile } from "@/lib/profile";

export default function ProfileSidebar() {
  return (
    <aside className="w-full">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Cover banner */}
        <div className="h-16 bg-gradient-to-r from-linkedin to-sky-400" />
        <div className="px-4 pb-4 -mt-8">
          <div className="w-16 h-16 rounded-full bg-linkedin text-white flex items-center justify-center text-xl font-semibold border-4 border-white">
            {profile.initials}
          </div>
          <h2 className="mt-2 font-semibold text-gray-900 leading-tight">{profile.name}</h2>
          <p className="text-sm text-gray-600 mt-0.5">{profile.headline}</p>
          <p className="text-xs text-gray-500 mt-1">{profile.location}</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-3 space-y-2">
          {profile.achievements.slice(0, 3).map((a) => (
            <div key={a} className="flex items-start gap-2 text-xs text-gray-600">
              <span className="text-linkedin mt-0.5">●</span>
              <span>{a}</span>
            </div>
          ))}
        </div>
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
      </div>
    </aside>
  );
}
