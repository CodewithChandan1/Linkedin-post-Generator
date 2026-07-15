"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, X, Check, Clock, Sparkles, CheckCheck, ChevronRight } from "lucide-react";

// ── localStorage: ONLY used for unread badge count (instant UI, no page reload needed) ──
const BADGE_KEY = "postedin_unread_count";
function getBadgeCount() {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(BADGE_KEY) || "0", 10);
}
function setBadgeCount(n) {
  if (typeof window === "undefined") return;
  localStorage.setItem(BADGE_KEY, String(Math.max(0, n)));
}

// ── Public helper — called from anywhere in the app to push a notification ───
// Saves directly to server. Badge count incremented locally for instant bell update.
export function pushNotification({ type = "info", title, message, icon }) {
  if (typeof window === "undefined") return;
  // Increment badge immediately (optimistic)
  setBadgeCount(getBadgeCount() + 1);
  window.dispatchEvent(new Event("postedin:badge"));

  // Persist to server
  fetch("/api/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, title, message: message || "", icon: icon || "" }),
  }).catch(() => {});
}

// ── Styles / icons ───────────────────────────────────────────────────────────
const TYPE_STYLE = {
  success:  { bg: "bg-emerald-50", icon: "text-emerald-500", dot: "bg-emerald-500" },
  reminder: { bg: "bg-blue-50",    icon: "text-blue-500",    dot: "bg-blue-500"    },
  warning:  { bg: "bg-amber-50",   icon: "text-amber-500",   dot: "bg-amber-500"   },
  info:     { bg: "bg-slate-50",   icon: "text-slate-500",   dot: "bg-slate-400"   },
};
const TYPE_ICON = {
  success:  <Check size={14} />,
  reminder: <Clock size={14} />,
  warning:  <Bell size={14} />,
  info:     <Sparkles size={14} />,
};
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function NotificationBell() {
  const router  = useRouter();
  const panelRef = useRef(null);
  const [open, setOpen]     = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [badge, setBadge]   = useState(getBadgeCount);
  const [loading, setLoading] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);

  // ── Fetch notifications from server ─────────────────────────────────────────
  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifs(data.notifications);
        // Sync real unread count to badge
        const unread = data.notifications.filter((n) => !n.read).length;
        setBadge(unread);
        setBadgeCount(unread);
      }
    } catch { /* keep stale */ }
    finally { setLoading(false); }
  }, []);

  // Fetch on mount (so badge is accurate on page load)
  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  // Badge update from pushNotification() calls
  useEffect(() => {
    const update = () => setBadge(getBadgeCount());
    window.addEventListener("postedin:badge", update);
    return () => window.removeEventListener("postedin:badge", update);
  }, []);

  // SSE — real-time server-pushed notifications
  useEffect(() => {
    let es;
    try {
      es = new EventSource("/api/notifications/stream");
      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (!payload?.title) return; // heartbeat
          // Prepend to panel list
          setNotifs((prev) => [{ ...payload, id: payload._id || payload.id, read: false }, ...prev]);
          setBadge((b) => { const next = b + 1; setBadgeCount(next); return next; });
        } catch { /* ignore */ }
      };
    } catch { /* SSE not supported */ }
    return () => { if (es) es.close(); };
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── Actions — all hit server, then sync local state ──────────────────────────
  async function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    setBadge(0); setBadgeCount(0);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => {});
  }

  async function markRead(id) {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setBadge((b) => { const next = Math.max(0, b - 1); setBadgeCount(next); return next; });
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }

  async function remove(id) {
    const wasUnread = notifs.find((n) => n.id === id && !n.read);
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) setBadge((b) => { const next = Math.max(0, b - 1); setBadgeCount(next); return next; });
    await fetch(`/api/notifications?id=${id}`, { method: "DELETE" }).catch(() => {});
  }

  async function clearAll() {
    setNotifs([]);
    setBadge(0); setBadgeCount(0);
    await fetch("/api/notifications?all=true", { method: "DELETE" }).catch(() => {});
  }

  function handleOpen() {
    const opening = !open;
    setOpen(opening);
    if (opening) {
      fetchNotifs(); // always refresh from server when panel opens
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell */}
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center w-9 h-9 rounded-full text-gray-600 hover:bg-gray-100 transition"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {badge > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-11 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden"
          style={{ animation: "notifSlideIn 0.15s ease-out", transformOrigin: "top right" }}
        >
          <style>{`
            @keyframes notifSlideIn {
              from { opacity:0; transform:scale(0.95) translateY(-8px); }
              to   { opacity:1; transform:scale(1)   translateY(0); }
            }
          `}</style>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-linkedin" />
              <span className="text-sm font-bold text-gray-800">Notifications</span>
              {badge > 0 && (
                <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                  {badge} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {notifs.length > 0 && (
                <>
                  <button onClick={markAllRead} title="Mark all read"
                    className="p-1.5 text-gray-400 hover:text-linkedin hover:bg-blue-50 rounded-lg transition">
                    <CheckCheck size={14} />
                  </button>
                  <button onClick={clearAll} title="Clear all"
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                    <X size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="space-y-0 divide-y divide-gray-50">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 px-4 py-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 bg-gray-100 rounded w-3/4" />
                      <div className="h-2 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <Bell size={20} className="text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-gray-500">All caught up!</p>
                <p className="text-xs text-gray-400 mt-0.5">No notifications yet.</p>
              </div>
            ) : (
              notifs.slice(0, 8).map((n) => {
                const style = TYPE_STYLE[n.type] || TYPE_STYLE.info;
                return (
                  <div
                    key={n.id || n._id}
                    onClick={() => {
                      markRead(n.id || n._id);
                      setSelectedNotif(n);
                      setOpen(false);
                    }}
                    className={`relative flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition ${!n.read ? "bg-blue-50/30" : ""}`}
                  >
                    {!n.read && (
                      <span className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    )}
                    <div className={`shrink-0 w-8 h-8 rounded-full ${style.bg} ${style.icon} flex items-center justify-center`}>
                      {n.icon ? <span className="text-sm">{n.icon}</span> : TYPE_ICON[n.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 leading-snug truncate">{n.title}</p>
                      {n.message && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); remove(n.id || n._id); }}
                      className="shrink-0 p-1 text-gray-300 hover:text-gray-500 rounded transition"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {!loading && (
            <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] text-gray-400">
                {notifs.length} notification{notifs.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => { setOpen(false); router.push("/notifications"); }}
                className="flex items-center gap-1 text-xs font-semibold text-[#0A66C2] hover:text-[#0958a8] transition"
              >
                View all <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Full Notification Detail Modal */}
      {selectedNotif && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedNotif(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-gray-150 p-6 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                Notification Detail
              </span>
              <button
                onClick={() => setSelectedNotif(null)}
                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-650 hover:bg-gray-50 rounded-lg transition"
              >
                <X size={15} />
              </button>
            </div>
            
            <div className="flex items-start gap-3">
              <div className={`shrink-0 w-9 h-9 rounded-full ${TYPE_STYLE[selectedNotif.type]?.bg || "bg-slate-50"} ${TYPE_STYLE[selectedNotif.type]?.icon || "text-slate-500"} flex items-center justify-center`}>
                {selectedNotif.icon ? <span className="text-base">{selectedNotif.icon}</span> : TYPE_ICON[selectedNotif.type]}
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="text-xs font-extrabold text-gray-900 leading-snug">{selectedNotif.title}</h4>
                <p className="text-[10px] text-gray-400">{timeAgo(selectedNotif.createdAt)}</p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100/50 rounded-xl p-4 text-xs font-semibold text-gray-605 leading-relaxed whitespace-pre-wrap">
              {selectedNotif.message || "No additional details available."}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedNotif(null)}
                className="text-xs text-white bg-linkedin hover:bg-linkedin-hover px-5 py-2.5 rounded-full font-bold shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
