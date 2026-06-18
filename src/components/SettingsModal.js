import { useState } from "react";
import { TOPIC_FILTERS } from "@/lib/settings";
import { getBestTime, tierColor } from "@/lib/bestTime";
import {
  sendReminderEmail,
  emailConfigured,
  requestNotificationPermission,
  notificationPermission,
  notificationsSupported,
} from "@/lib/reminders";

export default function SettingsModal({ open, onClose, settings, onSave, todaysPost }) {
  const [draft, setDraft] = useState(settings);
  const [emailStatus, setEmailStatus] = useState("");
  const [pushStatus, setPushStatus] = useState(notificationPermission());

  if (!open) return null;

  const bestTime = getBestTime();

  function update(patch) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  function toggleTopic(topic) {
    setDraft((d) => ({ ...d, topics: { ...d.topics, [topic]: !d.topics[topic] } }));
  }

  function handleSave() {
    onSave(draft);
    onClose();
  }

  async function handleEnablePush() {
    const result = await requestNotificationPermission();
    setPushStatus(result);
    update({ pushEnabled: result === "granted" });
  }

  async function handleTestEmail() {
    setEmailStatus("sending");
    try {
      await sendReminderEmail({ email: draft.email, post: todaysPost, bestTime });
      setEmailStatus("sent");
    } catch (e) {
      setEmailStatus(e.message || "failed");
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-30 flex items-start justify-center overflow-y-auto py-8 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-gray-200 w-full max-w-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Reminder settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input
              type="email"
              value={draft.email}
              onChange={(e) => update({ email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/40"
              placeholder="you@example.com"
            />
          </div>

          {/* Reminder time + best time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daily reminder time</label>
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={draft.reminderTime}
                onChange={(e) => update({ reminderTime: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/40"
              />
              <button
                type="button"
                onClick={() => update({ reminderTime: bestTime.recommendedTime })}
                className="text-xs text-linkedin hover:underline"
              >
                Use recommended ({bestTime.recommendedTime})
              </button>
            </div>
            <div className={`mt-2 text-xs rounded-lg px-3 py-2 ${tierColor(bestTime.tier)}`}>
              <p className="font-medium">Best time today: {bestTime.slot}</p>
              <p className="opacity-90">{bestTime.note} Alt: {bestTime.altSlot}.</p>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <Toggle
              label="Daily email reminder"
              checked={draft.reminderEnabled}
              onChange={(v) => update({ reminderEnabled: v })}
            />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">Browser push notifications</p>
                {!notificationsSupported() && (
                  <p className="text-xs text-gray-400">Not supported in this browser</p>
                )}
                {pushStatus === "denied" && (
                  <p className="text-xs text-red-500">Blocked — enable in browser settings</p>
                )}
              </div>
              {pushStatus === "granted" ? (
                <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">Enabled</span>
              ) : (
                <button
                  onClick={handleEnablePush}
                  disabled={!notificationsSupported() || pushStatus === "denied"}
                  className="text-xs text-linkedin border border-linkedin/40 px-3 py-1 rounded-full hover:bg-linkedin/10 disabled:opacity-40"
                >
                  Enable
                </button>
              )}
            </div>
          </div>

          {/* Topic relevance filters */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Topics to track</p>
            <div className="flex flex-wrap gap-2">
              {TOPIC_FILTERS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => toggleTopic(topic)}
                  className={`text-xs px-3 py-1 rounded-full border transition ${
                    draft.topics[topic]
                      ? "bg-linkedin text-white border-linkedin"
                      : "bg-white text-gray-500 border-gray-300"
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Test email */}
          <div className="border-t border-gray-100 pt-4">
            <button
              onClick={handleTestEmail}
              disabled={!emailConfigured() || emailStatus === "sending"}
              className="text-sm text-linkedin border border-linkedin/40 px-3 py-1.5 rounded-full hover:bg-linkedin/10 disabled:opacity-40"
            >
              {emailStatus === "sending" ? "Sending…" : "Send test email"}
            </button>
            {!emailConfigured() && (
              <p className="text-xs text-gray-400 mt-1">
                Add NEXT_PUBLIC_EMAILJS_* keys to .env.local to enable email.
              </p>
            )}
            {emailStatus === "sent" && (
              <p className="text-xs text-green-600 mt-1">Test email sent ✓</p>
            )}
            {emailStatus && !["sending", "sent"].includes(emailStatus) && (
              <p className="text-xs text-red-500 mt-1">{emailStatus}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200">
          <button onClick={onClose} className="text-sm text-gray-600 px-4 py-2 rounded-full hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="text-sm text-white bg-linkedin hover:bg-linkedin-hover px-4 py-2 rounded-full font-medium"
          >
            Save settings
          </button>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-700">{label}</p>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition relative ${checked ? "bg-linkedin" : "bg-gray-300"}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
