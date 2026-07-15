"use client";

import { useState, useEffect } from "react";
import { X, Plus, Upload, Sparkles, FileText } from "lucide-react";
import Drawer from "@/components/Drawer/Drawer";

export default function EditProfileModal({ open, onClose, profile, onSave }) {
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [initials, setInitials] = useState("");
  const [summary, setSummary] = useState("");
  
  // Array lists
  const [stack, setStack] = useState([]);
  const [newStackItem, setNewStackItem] = useState("");
  
  const [achievements, setAchievements] = useState([]);
  const [newAchievement, setNewAchievement] = useState("");

  const [experience, setExperience] = useState([]);
  const [newExperienceItem, setNewExperienceItem] = useState("");

  const [certifications, setCertifications] = useState([]);
  const [newCertification, setNewCertification] = useState("");

  const [hobbies, setHobbies] = useState([]);
  const [newHobby, setNewHobby] = useState("");

  const [extracurricular, setExtracurricular] = useState([]);
  const [newExtracurricular, setNewExtracurricular] = useState("");

  // Loading & State
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setHeadline(profile.headline || "");
      setLocation(profile.location || "");
      setInitials(profile.initials || "");
      setSummary(profile.summary || "");
      setStack(profile.stack || []);
      setAchievements(profile.achievements || []);
      setExperience(profile.experience || []);
      setCertifications(profile.certifications || []);
      setHobbies(profile.hobbies || []);
      setExtracurricular(profile.extracurricular || []);
    }
  }, [profile, open]);

  // List Handlers
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

  function handleAddExperience() {
    if (newExperienceItem.trim() && !experience.includes(newExperienceItem.trim())) {
      setExperience([...experience, newExperienceItem.trim()]);
      setNewExperienceItem("");
    }
  }

  function handleRemoveExperience(item) {
    setExperience(experience.filter((e) => e !== item));
  }

  function handleAddCertification() {
    if (newCertification.trim() && !certifications.includes(newCertification.trim())) {
      setCertifications([...certifications, newCertification.trim()]);
      setNewCertification("");
    }
  }

  function handleRemoveCertification(item) {
    setCertifications(certifications.filter((c) => c !== item));
  }

  function handleAddHobby() {
    if (newHobby.trim() && !hobbies.includes(newHobby.trim())) {
      setHobbies([...hobbies, newHobby.trim()]);
      setNewHobby("");
    }
  }

  function handleRemoveHobby(item) {
    setHobbies(hobbies.filter((h) => h !== item));
  }

  function handleAddExtracurricular() {
    if (newExtracurricular.trim() && !extracurricular.includes(newExtracurricular.trim())) {
      setExtracurricular([...extracurricular, newExtracurricular.trim()]);
      setNewExtracurricular("");
    }
  }

  function handleRemoveExtracurricular(item) {
    setExtracurricular(extracurricular.filter((e) => e !== item));
  }

  // Resume Upload & Parse Handler
  async function handleResumeUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a valid PDF resume file.");
      return;
    }

    setParsing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/parse-resume", {
        method: "POST",
        body: formData,
      });

      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Server error (${res.status}): ${text.slice(0, 150)}`);
      }

      if (!res.ok) throw new Error(data.error || "Failed to parse resume");

      if (data.success && data.user?.profile) {
        const p = data.user.profile;
        setName(p.name || "");
        setHeadline(p.headline || "");
        setLocation(p.location || "");
        setInitials(p.initials || "");
        setSummary(p.summary || "");
        setStack(p.stack || []);
        setAchievements(p.achievements || []);
        setExperience(p.experience || []);
        setCertifications(p.certifications || []);
        setHobbies(p.hobbies || []);
        setExtracurricular(p.extracurricular || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setParsing(false);
      // Reset input element
      e.target.value = "";
    }
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
          summary,
          stack,
          achievements,
          experience,
          certifications,
          hobbies,
          extracurricular,
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

  const footer = (
    <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
      <button
        onClick={onClose}
        className="text-xs text-slate-600 px-4 py-2 rounded-full hover:bg-slate-100 font-medium"
      >
        Cancel
      </button>
      <button
        onClick={handleSave}
        disabled={loading || parsing}
        className="text-xs text-white bg-linkedin hover:bg-linkedin-hover px-5 py-2 rounded-full font-semibold shadow transition-all duration-150 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="left"
      zClass="z-30"
      title="Edit Developer Profile"
      bodyClassName="px-6 py-5 space-y-4"
      footer={footer}
    >
      <>
        {error && (
          <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-semibold">
            {error}
          </div>
        )}

        {/* ⚡ Resume PDF Uploader Widget */}
        <div className="border border-dashed border-slate-200 hover:border-linkedin/60 rounded-2xl p-4.5 bg-slate-50/40 text-center transition-colors relative group">
          <input
            type="file"
            accept=".pdf"
            onChange={handleResumeUpload}
            disabled={parsing}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          {parsing ? (
            <div className="space-y-2 py-2">
              <div className="w-6 h-6 border-2 border-linkedin border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-linkedin flex items-center justify-center gap-1.5 animate-pulse">
                <Sparkles size={12} /> AI is reading and parsing your resume...
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 py-1">
              <Upload size={20} className="text-slate-400 mx-auto group-hover:text-linkedin transition-colors" />
              <div>
                <p className="text-xs font-bold text-slate-700">⚡ Auto-Fill Profile from Resume</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Upload PDF resume to extract projects, skills & achievements</p>
              </div>
            </div>
          )}
        </div>

        {/* Name & Initials */}
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

        {/* Headline */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Headline</label>
          <textarea
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/30 focus:border-linkedin h-16 resize-none"
            placeholder="e.g. Full Stack Developer | React · Next.js · Node.js"
          />
        </div>

        {/* Location */}
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

        {/* Summary (Bio) */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">About Summary</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/30 focus:border-linkedin h-20 resize-none"
            placeholder="Introduce yourself, your passion, and what you build..."
          />
        </div>

        {/* Tech Stack List */}
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

        {/* Experience List */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Experience</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newExperienceItem}
              onChange={(e) => setNewExperienceItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddExperience();
                }
              }}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/30 focus:border-linkedin"
              placeholder="Add role (e.g. SDE at Google, 2024)"
            />
            <button
              type="button"
              onClick={handleAddExperience}
              className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-600 transition"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-1.5 max-h-[110px] overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-100">
            {experience.map((item) => (
              <div
                key={item}
                className="flex items-start justify-between gap-2 p-1.5 bg-white border border-slate-200/60 rounded text-xs text-slate-650"
              >
                <span className="flex-1 leading-relaxed">{item}</span>
                <button type="button" onClick={() => handleRemoveExperience(item)} className="text-slate-400 hover:text-red-500 mt-0.5">
                  <X size={14} />
                </button>
              </div>
            ))}
            {experience.length === 0 && <span className="text-xs text-slate-400 italic">No experience added yet</span>}
          </div>
        </div>

        {/* Achievements List */}
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
          <div className="space-y-1.5 max-h-[110px] overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-100">
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

        {/* Certifications List */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Certifications</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newCertification}
              onChange={(e) => setNewCertification(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCertification();
                }
              }}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/30 focus:border-linkedin"
              placeholder="Add certification (e.g. AWS Cloud Practitioner)"
            />
            <button
              type="button"
              onClick={handleAddCertification}
              className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-600 transition"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-1.5 max-h-[110px] overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-100">
            {certifications.map((item) => (
              <div
                key={item}
                className="flex items-start justify-between gap-2 p-1.5 bg-white border border-slate-200/60 rounded text-xs text-slate-600"
              >
                <span className="flex-1 leading-relaxed">{item}</span>
                <button type="button" onClick={() => handleRemoveCertification(item)} className="text-slate-400 hover:text-red-500 mt-0.5">
                  <X size={14} />
                </button>
              </div>
            ))}
            {certifications.length === 0 && <span className="text-xs text-slate-400 italic">No certifications added yet</span>}
          </div>
        </div>

        {/* Hobbies List */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Hobbies</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newHobby}
              onChange={(e) => setNewHobby(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddHobby();
                }
              }}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/30 focus:border-linkedin"
              placeholder="Add hobby (e.g. Photography)"
            />
            <button
              type="button"
              onClick={handleAddHobby}
              className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-600 transition"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-slate-50 rounded-lg border border-slate-100">
            {hobbies.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full border border-slate-300/30 font-semibold"
              >
                {item}
                <button type="button" onClick={() => handleRemoveHobby(item)} className="hover:text-red-500">
                  <X size={12} />
                </button>
              </span>
            ))}
            {hobbies.length === 0 && <span className="text-xs text-slate-400 italic">No hobbies added yet</span>}
          </div>
        </div>

        {/* Extracurricular List */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Extracurriculars</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newExtracurricular}
              onChange={(e) => setNewExtracurricular(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddExtracurricular();
                }
              }}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/30 focus:border-linkedin"
              placeholder="Add extracurricular (e.g. Open Source Mentor)"
            />
            <button
              type="button"
              onClick={handleAddExtracurricular}
              className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-600 transition"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-1.5 max-h-[110px] overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-100">
            {extracurricular.map((item) => (
              <div
                key={item}
                className="flex items-start justify-between gap-2 p-1.5 bg-white border border-slate-200/60 rounded text-xs text-slate-600"
              >
                <span className="flex-1 leading-relaxed">{item}</span>
                <button type="button" onClick={() => handleRemoveExtracurricular(item)} className="text-slate-400 hover:text-red-500 mt-0.5">
                  <X size={14} />
                </button>
              </div>
            ))}
            {extracurricular.length === 0 && <span className="text-xs text-slate-400 italic">No activities added yet</span>}
          </div>
        </div>
      </>
    </Drawer>
  );
}
