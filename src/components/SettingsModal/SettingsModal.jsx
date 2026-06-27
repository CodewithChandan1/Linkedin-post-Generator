import { useState } from "react";
import { TOPIC_FILTERS } from "@/lib/settings";
import { getBestTime, tierColor } from "@/lib/bestTime";
import { Check, Bell, BellOff } from "lucide-react";
import Drawer from "@/components/Drawer/Drawer";
import {
  sendReminderEmail,
  emailConfigured,
  requestNotificationPermission,
  notificationPermission,
  notificationsSupported,
} from "@/lib/reminders";

export default function SettingsModal({ open, onClose, settings, onSave, todaysPost, user, onUpdateUser }) {
  const [draft, setDraft] = useState(settings || {});
  const [emailStatus, setEmailStatus] = useState("");
  const [pushStatus, setPushStatus] = useState(notificationPermission());

  // Email Verification States
  const [verifyStep, setVerifyStep] = useState("idle"); // "idle" | "need_verify" | "sent" | "verifying"
  const [loadingCode, setLoadingCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState("");

  async function handleSendVerificationCode() {
    setLoadingCode(true);
    setVerificationError("");
    try {
      const res = await fetch("/api/auth/send-verification", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send verification code");
      setVerifyStep("sent");
    } catch (err) {
      setVerificationError(err.message);
    } finally {
      setLoadingCode(false);
    }
  }

  async function handleVerifyCode() {
    setVerifyStep("verifying");
    setVerificationError("");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verificationCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      
      if (onUpdateUser) {
        onUpdateUser(data.user);
      }
      setVerifyStep("idle");
      update({ reminderEnabled: true });
    } catch (err) {
      setVerificationError(err.message);
      setVerifyStep("sent");
    }
  }

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
      await fetch("/api/settings/increment-emails", { method: "POST" }).catch(() => {});
      setEmailStatus("sent");
    } catch (e) {
      setEmailStatus(e.message || "failed");
    }
  }

  const footer = (
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
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      zClass="z-30"
      title="Reminder settings"
      bodyClassName="px-5 py-4 space-y-5"
      footer={footer}
    >
      <>
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
            {/* Email verification status badge */}
            {user && (
              user.isEmailVerified ? (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-white shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  Email verified
                </div>
              ) : (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                  <span className="text-base leading-none">⚠️</span>
                  Email not verified —{" "}
                  <button
                    type="button"
                    className="underline hover:text-amber-700 font-bold"
                    onClick={() => setVerifyStep("need_verify")}
                  >
                    Verify now
                  </button>
                </div>
              )
            )}
          </div>

          {/* Reminder time */}
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
              icon={<Bell size={14} />}
              checked={draft.reminderEnabled}
              onChange={(v) => {
                if (v && user && !user.isEmailVerified) {
                  setVerifyStep("need_verify");
                } else {
                  update({ reminderEnabled: v });
                }
              }}
            />

            {/* Email verification flow UI */}
            {user && !user.isEmailVerified && verifyStep !== "idle" && (
              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 mt-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <p className="text-xs text-slate-600 leading-normal">
                  To enable email reminders, we need to verify your email address. We'll send a 6-digit code to <strong>{user.email}</strong>.
                </p>
                {verifyStep === "need_verify" && (
                  <button
                    type="button"
                    onClick={handleSendVerificationCode}
                    disabled={loadingCode}
                    className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition"
                  >
                    {loadingCode ? "Sending Code..." : "Send Verification Code"}
                  </button>
                )}

                {(verifyStep === "sent" || verifyStep === "verifying") && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      Enter 6-Digit Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm tracking-widest font-mono text-center w-28 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={verificationCode.length !== 6 || verifyStep === "verifying"}
                        className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition disabled:opacity-50"
                      >
                        {verifyStep === "verifying" ? "Verifying..." : "Verify Code"}
                      </button>
                    </div>
                  </div>
                )}

                {verificationError && (
                  <p className="text-xs text-red-600 font-semibold">{verificationError}</p>
                )}
              </div>
            )}

            {user && !user.isEmailVerified && verifyStep === "idle" && draft.reminderEnabled && (
              <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-2 flex justify-between items-center">
                <span>⚠️ Email verification required</span>
                <button
                  type="button"
                  onClick={() => setVerifyStep("need_verify")}
                  className="font-bold underline hover:text-amber-700"
                >
                  Verify Now
                </button>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellOff size={14} className="text-gray-500" />
                <div>
                  <p className="text-sm text-gray-700">Browser push notifications</p>
                  {!notificationsSupported() && (
                    <p className="text-xs text-gray-400">Not supported in this browser</p>
                  )}
                  {pushStatus === "denied" && (
                    <p className="text-xs text-red-500">Blocked — enable in browser settings</p>
                  )}
                </div>
              </div>
              {pushStatus === "granted" ? (
                <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                  <Check size={11} /> Enabled
                </span>
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

          {/* Topic filters */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Topics to track</p>
            <div className="flex flex-wrap gap-2">
              {TOPIC_FILTERS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => toggleTopic(topic)}
                  className={`text-xs px-3 py-1 rounded-full border transition ${
                    draft.topics?.[topic]
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
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <Check size={12} /> Test email sent
              </p>
            )}
            {emailStatus && !["sending", "sent"].includes(emailStatus) && (
              <p className="text-xs text-red-500 mt-1">{emailStatus}</p>
            )}
          </div>
      </>
    </Drawer>
  );
}

function Toggle({ label, icon, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-700 flex items-center gap-2">
        {icon && <span className="text-gray-500">{icon}</span>}
        {label}
      </p>
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
