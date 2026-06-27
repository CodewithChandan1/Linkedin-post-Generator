import { Settings, TrendingUp, LogOut } from "lucide-react";
import { LinkedInLogo } from "@/components/Icons/Icons";

export default function TopNav({ user, onLogout, onOpenSettings, onToggleTrending, showTrending }) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
        <LinkedInLogo size={28} color="#0A66C2" />
        <div className="leading-tight">
          <p className="font-semibold text-gray-900 text-sm">Auto-Post Generator</p>
          <p className="text-[11px] text-gray-500">Daily AI posts, built for your reach</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {user && (
            <div className="hidden md:flex items-center gap-2 mr-2 bg-slate-50 border border-slate-100 rounded-full px-3 py-1">
              <div className="w-5 h-5 rounded-full bg-linkedin text-white flex items-center justify-center text-[10px] font-bold">
                {user.profile?.initials || user.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
              </div>
              <span className="text-xs font-semibold text-gray-700 max-w-[120px] truncate">{user.name}</span>
            </div>
          )}
          <button
            onClick={onToggleTrending}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full transition ${
              showTrending
                ? "bg-orange-100 text-orange-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <TrendingUp size={15} />
            <span className="hidden sm:inline">Trending</span>
          </button>
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-full transition"
            aria-label="Open reminder settings"
          >
            <Settings size={15} />
            <span className="hidden sm:inline">Settings</span>
          </button>
          {user && onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 px-3 py-1.5 rounded-full transition font-medium"
              aria-label="Log out"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
