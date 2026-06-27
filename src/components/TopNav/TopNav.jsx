import Image from "next/image";
import { Settings, TrendingUp, LogOut } from "lucide-react";

export default function TopNav({ user, onLogout, onOpenSettings, onToggleTrending, showTrending, onUpgradeClick }) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
        <Image src="/logo.png" alt="PostedIn" width={120} height={32} className="h-8 w-auto object-contain" priority />

        <div className="ml-auto flex items-center gap-2">
          {user && (
            <div className="hidden md:flex items-center gap-2 mr-2 bg-slate-50 border border-slate-100 rounded-full px-3 py-1">
              <div className="w-5 h-5 rounded-full bg-linkedin text-white flex items-center justify-center text-[10px] font-bold">
                {user.profile?.name ? user.profile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "U"}
              </div>
              <span className="text-xs font-semibold text-gray-700 max-w-[120px] truncate">{user.profile?.name || user.email}</span>
            </div>
          )}
          {user && process.env.NEXT_PUBLIC_ENABLE_MONETIZATION === "true" && (
            user.isPremium ? (
              <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-full uppercase tracking-wider select-none mr-2">
                👑 Pro
              </span>
            ) : (
              <button
                onClick={onUpgradeClick}
                className="flex items-center gap-1 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-3 py-1.5 rounded-full shadow-sm hover:shadow transition-all duration-200 mr-2"
              >
                <span>Upgrade to Pro</span>
              </button>
            )
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
