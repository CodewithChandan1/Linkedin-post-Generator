"use client";

import { useState, useEffect } from "react";
import { Check, X, Plus } from "lucide-react";

export default function EditProfileModal({ open, onClose, profile, onSave }) {
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [initials, setInitials] = useState("");
  const [stack, setStack] = useState([]);
  const [newStackItem, setNewStackItem] = useState("");
  const [achievements, setAchievements] = useState([]);
  const [newAchievement, setNewAchievement] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setHeadline(profile.headline || "");
      setLocation(profile.location || "");
      setInitials(profile.initials || "");
      setStack(profile.stack || []);
      setAchievements(profile.achievements || []);
    }
  }, [profile, open]);

  if (!open) return null;

  function handleAddStack() {
    if (newStackItem.trim() && !stack.includes(newStackItem.trim())) {
      setStack([...stack, newStackItem.trim()]);
      setNewStackItem("");
    }
  }

  function handleRemoveStack(item) {
    setStack(stack.filter((s) => s !== item));
  }

  function handleAddAchievement() {
    if (newAchievement.trim() && !achievements.includes(newAchievement.trim())) {
      setAchievements([...achievements, newAchievement.trim()]);
      setNewAchievement("");
    }
  }

  function handleRemoveAchievement(item) {
    setAchievements(achievements.filter((a) => a !== item));
  }

  async function handleSave() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          headline,
          location,
          initials,
          stack,
          achievements,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      if (data.success) {
        onSave(data.user);
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 flex items-start justify-center overflow-y-auto py-8 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-slate-200 w-full max-w-lg shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 text-base">Edit Developer Profile</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/30 focus:border-linkedin"
                placeholder="e.g. Chandan Kushwaha"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Initials</label>
              <input
                type="text"
                value={initials}
                onChange={(e) => setInitials(e.target.value.toUpperCase())}
                maxLength={3}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/30 focus:border-linkedin text-center"
                placeholder="e.g. CK"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Headline</label>
            <textarea
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/30 focus:border-linkedin h-20 resize-none"
              placeholder="e.g. Full Stack Developer | React · Next.js · Node.js"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/30 focus:border-linkedin"
              placeholder="e.g. Jalandhar, Punjab, India"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tech Stack</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newStackItem}
                onChange={(e) => setNewStackItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddStack();
                  }
                }}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/30 focus:border-linkedin"
                placeholder="Add skill (e.g. React)"
              />
              <button
                type="button"
                onClick={handleAddStack}
                className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-600 transition"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-slate-50 rounded-lg border border-slate-100">
              {stack.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 text-xs bg-linkedin/10 text-linkedin px-2 py-0.5 rounded-full border border-linkedin/10"
                >
                  {item}
                  <button type="button" onClick={() => handleRemoveStack(item)} className="hover:text-red-500">
                    <X size={12} />
                  </button>
                </span>
              ))}
              {stack.length === 0 && <span className="text-xs text-slate-400 italic">No skills added yet</span>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Achievements</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newAchievement}
                onChange={(e) => setNewAchievement(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddAchievement();
                  }
                }}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/30 focus:border-linkedin"
                placeholder="Add achievement (e.g. Served 10k+ users)"
              />
              <button
                type="button"
                onClick={handleAddAchievement}
                className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-600 transition"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-1.5 max-h-[120px] overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-100">
              {achievements.map((item) => (
                <div
                  key={item}
                  className="flex items-start justify-between gap-2 p-1.5 bg-white border border-slate-200/60 rounded text-xs text-slate-600"
                >
                  <span className="flex-1 leading-relaxed">{item}</span>
                  <button type="button" onClick={() => handleRemoveAchievement(item)} className="text-slate-400 hover:text-red-500 mt-0.5">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {achievements.length === 0 && <span className="text-xs text-slate-400 italic">No achievements added yet</span>}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="text-xs text-slate-600 px-4 py-2 rounded-full hover:bg-slate-100 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="text-xs text-white bg-linkedin hover:bg-linkedin-hover px-5 py-2 rounded-full font-semibold shadow transition-all duration-150 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
