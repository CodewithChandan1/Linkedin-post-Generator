"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, Check, Mail, Clock, Sparkles, CheckCheck } from "lucide-react";

// ── Notification store (module-level so it persists across renders) ──────────
const STORAGE_KEY = "postedin_notifications";

function loadNotifs() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveNotifs(notifs) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs.slice(0, 50)));
}

// ── Public helper: push a notification from anywhere in the app ──────────────
export function pushNotification({ type = "info", title, message, icon }) {
  if (typeof window === "undefined") return;
  const notifs = loadNotifs();
  notifs.unshift({
    id: Date.now().toString(),
    type,       // "info" | "success" | "reminder" | "warning"
    title,
    message,
    icon,
    read: false,
    createdAt: new Date().toISOString(),
  });
  saveNotifs(notifs);
  // Dispatch custom event so the panel updates
  window.dispatchEvent(new Event("postedin:notification"));
}

// ── Icon / color helpers ─────────────────────────────────────────────────────
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
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const panelRef = useRef(null);

  function refresh() {
    setNotifs(loadNotifs());
  }

  // ── SSE subscription for real-time server-pushed notifications ──────────────
  useEffect(() => {
    let es;
    try {
      es = new EventSource("/api/notifications/stream");

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (!payload?.title) return; // ignore heartbeat/ping frames
          // Merge into localStorage store
          const existing = loadNotifs();
          existing.unshift({ ...payload, read: false });
          saveNotifs(existing);
          setNotifs(loadNotifs());
        } catch { /* ignore malformed frames */ }
      };

      es.onerror = () => {
        // Browser will auto-reconnect; nothing to do here
      };
    } catch { /* SSE not supported */ }

    return () => { if (es) es.close(); };
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("postedin:notification", refresh);
    return () => window.removeEventListener("postedin:notification", refresh);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const unread = notifs.filter((n) => !n.read).length;

  function markAllRead() {
    const updated = notifs.map((n) => ({ ...n, read: true }));
    saveNotifs(updated);
    setNotifs(updated);
  }

  function markRead(id) {
    const updated = notifs.map((n) => (n.id === id ? { ...n, read: true } : n));
    saveNotifs(updated);
    setNotifs(updated);
  }

  function remove(id) {
    const updated = notifs.filter((n) => n.id !== id);
    saveNotifs(updated);
    setNotifs(updated);
  }

  function clearAll() {
    saveNotifs([]);
    setNotifs([]);
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen((v) => !v); if (!open) markAllRead(); }}
        className="relative flex items-center justify-center w-9 h-9 rounded-full text-gray-600 hover:bg-gray-100 transition"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute right-0 top-11 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden"
          style={{ animation: "notifSlideIn 0.15s ease-out", transformOrigin: "top right" }}
        >
          <style>{`
            @keyframes notifSlideIn {
              from { opacity: 0; transform: scale(0.95) translateY(-8px); }
              to   { opacity: 1; transform: scale(1)   translateY(0); }
            }
          `}</style>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-linkedin" />
              <span className="text-sm font-bold text-gray-800">Notifications</span>
              {unread > 0 && (
                <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                  {unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {notifs.length > 0 && (
                <>
                  <button
                    onClick={markAllRead}
                    title="Mark all read"
                    className="p-1.5 text-gray-400 hover:text-linkedin hover:bg-blue-50 rounded-lg transition"
                  >
                    <CheckCheck size={14} />
                  </button>
                  <button
                    onClick={clearAll}
                    title="Clear all"
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <X size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <Bell size={20} className="text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-gray-500">All caught up!</p>
                <p className="text-xs text-gray-400 mt-0.5">No notifications yet.</p>
              </div>
            ) : (
              notifs.map((n) => {
                const style = TYPE_STYLE[n.type] || TYPE_STYLE.info;
                return (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`relative flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition ${!n.read ? "bg-blue-50/30" : ""}`}
                  >
                    {/* Unread dot */}
                    {!n.read && (
                      <span className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    )}

                    {/* Icon bubble */}
                    <div className={`shrink-0 w-8 h-8 rounded-full ${style.bg} ${style.icon} flex items-center justify-center`}>
                      {n.icon ? <span className="text-sm">{n.icon}</span> : TYPE_ICON[n.type]}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 leading-snug truncate">{n.title}</p>
                      {n.message && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={(e) => { e.stopPropagation(); remove(n.id); }}
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
          {notifs.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 text-center">
              <span className="text-[10px] text-gray-400">{notifs.length} notification{notifs.length !== 1 ? "s" : ""} total</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
