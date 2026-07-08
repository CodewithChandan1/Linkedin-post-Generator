"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, ArrowLeft, Check, Clock, Sparkles, X,
  CheckCheck, Trash2, ChevronRight, RefreshCw,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatFullDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// ── Styles ───────────────────────────────────────────────────────────────────
const TYPE_STYLE = {
  success:  { bg: "bg-emerald-50",  icon: "text-emerald-600",  border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", label: "Success"  },
  reminder: { bg: "bg-blue-50",     icon: "text-blue-600",     border: "border-blue-200",    badge: "bg-blue-100 text-blue-700",       dot: "bg-blue-500",    label: "Reminder" },
  warning:  { bg: "bg-amber-50",    icon: "text-amber-600",    border: "border-amber-200",   badge: "bg-amber-100 text-amber-700",     dot: "bg-amber-500",   label: "Alert"    },
  info:     { bg: "bg-slate-50",    icon: "text-slate-600",    border: "border-slate-200",   badge: "bg-slate-100 text-slate-700",     dot: "bg-slate-400",   label: "Info"     },
};
const TYPE_ICON = {
  success:  <Check size={16} />,
  reminder: <Clock size={16} />,
  warning:  <Bell size={16} />,
  info:     <Sparkles size={16} />,
};
const FILTERS = ["all", "unread", "success", "reminder", "warning", "info"];

// ── Page ─────────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const router = useRouter();
  const [notifs, setNotifs]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError]       = useState("");

  // ── Server fetch ────────────────────────────────────────────────────────────
  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/notifications");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setNotifs(
        data.notifications.map((n) => ({ ...n, id: n._id }))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const selected = notifs.find((n) => n.id === selectedId) || null;
  const filtered = notifs.filter((n) => {
    if (filter === "all")    return true;
    if (filter === "unread") return !n.read;
    return n.type === filter;
  });
  const unreadCount = notifs.filter((n) => !n.read).length;

  // ── Actions ─────────────────────────────────────────────────────────────────
  async function markRead(id) {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }

  async function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => {});
  }

  async function remove(id) {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    if (selectedId === id) setSelectedId(null);
    await fetch(`/api/notifications?id=${id}`, { method: "DELETE" }).catch(() => {});
  }

  async function clearAll() {
    setNotifs([]);
    setSelectedId(null);
    await fetch("/api/notifications?all=true", { method: "DELETE" }).catch(() => {});
  }

  function openDetail(n) {
    markRead(n.id);
    setSelectedId(n.id);
  }

  // ── Detail view ─────────────────────────────────────────────────────────────
  if (selected) {
    const style = TYPE_STYLE[selected.type] || TYPE_STYLE.info;
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <div className="max-w-2xl mx-auto px-4 py-6">

          <button
            onClick={() => setSelectedId(null)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition"
          >
            <ArrowLeft size={16} /> Back to notifications
          </button>

          <div className={`rounded-2xl border ${style.border} ${style.bg} overflow-hidden`}>
            <div className={`h-1 w-full ${style.dot}`} />
            <div className="p-6">

              {/* Header row */}
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${style.bg} ${style.icon} border ${style.border}`}>
                    {selected.icon
                      ? <span className="text-xl">{selected.icon}</span>
                      : TYPE_ICON[selected.type]}
                  </div>
                  <div>
                    <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${style.badge}`}>
                      {style.label}
                    </span>
                    <h1 className="text-lg font-bold text-gray-900 mt-1 leading-snug">
                      {selected.title}
                    </h1>
                  </div>
                </div>
                <button
                  onClick={() => remove(selected.id)}
                  className="shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Body */}
              {selected.message && (
                <p className="text-sm text-gray-700 leading-relaxed bg-white/80 rounded-xl p-4 border border-white mb-5 whitespace-pre-wrap">
                  {selected.message}
                </p>
              )}

              {/* Timestamp */}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock size={12} />
                <span>{formatFullDate(selected.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => router.push("/")}
              className="flex-1 bg-[#0A66C2] hover:bg-[#0958a8] text-white text-sm font-semibold py-2.5 rounded-full transition"
            >
              Go to App →
            </button>
            <button
              onClick={() => remove(selected.id)}
              className="px-4 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-full hover:bg-gray-50 transition"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── List view ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 text-gray-500 transition"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Bell size={20} className="text-[#0A66C2]" /> Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">{unreadCount} unread</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchNotifs}
              disabled={loading}
              title="Refresh"
              className="p-1.5 text-gray-400 hover:text-[#0A66C2] rounded-full hover:bg-blue-50 transition"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            {notifs.length > 0 && (
              <>
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#0A66C2] border border-gray-200 hover:border-[#0A66C2]/30 px-3 py-1.5 rounded-full transition"
                >
                  <CheckCheck size={13} /> Mark all read
                </button>
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-full transition"
                >
                  <Trash2 size={13} /> Clear all
                </button>
              </>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            {error} —{" "}
            <button onClick={fetchNotifs} className="underline font-medium">retry</button>
          </div>
        )}

        {/* Filter tabs */}
        {!loading && notifs.length > 0 && (
          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 no-scrollbar">
            {FILTERS.map((f) => {
              const count =
                f === "all"    ? notifs.length :
                f === "unread" ? notifs.filter((n) => !n.read).length :
                notifs.filter((n) => n.type === f).length;
              if (count === 0 && f !== "all" && f !== "unread") return null;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition capitalize ${
                    filter === f
                      ? "bg-[#0A66C2] text-white border-[#0A66C2]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#0A66C2]/40 hover:text-[#0A66C2]"
                  }`}
                >
                  {f}{count > 0 && <span className="ml-1 opacity-70">({count})</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl px-4 py-3.5 flex gap-3 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-gray-100 mt-2 shrink-0" />
                <div className="w-9 h-9 rounded-full bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                  <div className="h-2 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bell size={28} className="text-gray-300" />
            </div>
            <p className="text-base font-semibold text-gray-500">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {filter !== "all"
                ? <button onClick={() => setFilter("all")} className="text-[#0A66C2] hover:underline">Show all</button>
                : "Streaks, reminders, and post activity will appear here."}
            </p>
          </div>
        )}

        {/* Grouped notification list */}
        {!loading && filtered.length > 0 && (() => {
          // Group by calendar date
          const groups = {};
          filtered.forEach((n) => {
            const key = new Date(n.createdAt).toLocaleDateString("en-IN", {
              day: "numeric", month: "long", year: "numeric",
            });
            (groups[key] = groups[key] || []).push(n);
          });

          return (
            <div className="space-y-4">
              {Object.entries(groups).map(([dateLabel, items]) => (
                <div key={dateLabel}>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">
                    {dateLabel}
                  </p>
                  <div className="space-y-1.5">
                    {items.map((n) => {
                      const style = TYPE_STYLE[n.type] || TYPE_STYLE.info;
                      return (
                        <button
                          key={n.id}
                          onClick={() => openDetail(n)}
                          className={`w-full text-left bg-white border rounded-xl px-4 py-3.5 flex items-start gap-3 hover:shadow-sm transition group ${
                            !n.read ? "border-[#0A66C2]/20 shadow-sm" : "border-gray-100"
                          }`}
                        >
                          {/* Unread dot */}
                          <div className="shrink-0 flex items-center pt-1.5">
                            <span className={`w-2 h-2 rounded-full ${!n.read ? style.dot : "bg-transparent"}`} />
                          </div>

                          {/* Icon */}
                          <div className={`shrink-0 w-9 h-9 rounded-full ${style.bg} ${style.icon} flex items-center justify-center`}>
                            {n.icon ? <span className="text-base">{n.icon}</span> : TYPE_ICON[n.type]}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-snug ${!n.read ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                              {n.title}
                            </p>
                            {n.message && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 leading-relaxed">
                                {n.message}
                              </p>
                            )}
                            <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                          </div>

                          {/* Hover actions */}
                          <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                              className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <X size={12} />
                            </button>
                            <ChevronRight size={14} className="text-gray-300" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

      </div>
    </div>
  );
}
