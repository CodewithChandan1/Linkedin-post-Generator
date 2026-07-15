import { useState, useEffect } from "react";
import { Upload, Sparkles, X, BookOpen, User } from "lucide-react";

export default function OnboardingModal({ open, onClose, user, onSave, onStartTour, onManualEdit }) {
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

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

      if (data.success && data.user) {
        onSave(data.user);
        // Dismiss onboarding from localStorage
        localStorage.setItem("onboarding_dismissed_" + user._id, "true");
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setParsing(false);
    }
  }

  function handleSkip() {
    localStorage.setItem("onboarding_dismissed_" + user._id, "true");
    onClose();
    if (onManualEdit) onManualEdit();
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl border border-gray-150 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col relative select-none animate-scale-up">
        {/* Close Button */}
        <button
          onClick={() => {
            localStorage.setItem("onboarding_dismissed_" + user._id, "true");
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-50 transition"
        >
          <X size={16} />
        </button>

        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-7 text-center text-white relative flex flex-col items-center">
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          <img
            src="/welcome-cat.gif"
            alt="Welcome Panda"
            className="w-24 h-24 object-contain mb-2 select-none pointer-events-none drop-shadow-md rounded-2xl"
          />
          <h2 className="text-lg font-black tracking-tight font-outfit">Welcome to PostedIn! 👋</h2>
          <p className="text-[11px] text-blue-100 font-semibold mt-1">Let's set up your profile to start generating custom developer posts</p>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-650 border border-red-100 rounded-xl text-xs font-bold leading-normal">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-sm font-black text-gray-800">Choose Onboarding Path</h3>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">We highly recommend the 30-second resume parser</p>
            </div>

            {/* Resume Upload widget */}
            <div className="border-2 border-dashed border-blue-200 hover:border-blue-500/80 rounded-2xl p-6 bg-blue-50/15 text-center transition-colors relative group">
              <input
                type="file"
                accept=".pdf"
                onChange={handleResumeUpload}
                disabled={parsing}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
              />
              {parsing ? (
                <div className="space-y-3 py-1">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-black text-blue-700 flex items-center justify-center gap-1.5 animate-pulse">
                    <Sparkles size={13} /> Parsing resume & configuring workspace...
                  </p>
                </div>
              ) : (
                <div className="space-y-2 py-1">
                  <Upload size={24} className="text-blue-500 mx-auto group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-xs font-black text-slate-700">⚡ Auto-Fill in 30 Seconds (Recommended)</p>
                    <p className="text-[10px] text-slate-400 mt-1">Upload your PDF resume to extract projects, skills & experience</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="border-b border-gray-150 flex-1" />
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">or</span>
              <div className="border-b border-gray-150 flex-1" />
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSkip}
                className="border border-gray-250 hover:bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition"
              >
                <User size={13} />
                <span>Fill Manually</span>
              </button>

              <button
                onClick={() => {
                  localStorage.setItem("onboarding_dismissed_" + user._id, "true");
                  onClose();
                  if (onStartTour) onStartTour();
                }}
                className="bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition"
              >
                <BookOpen size={13} />
                <span>Take Quick Tour</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
