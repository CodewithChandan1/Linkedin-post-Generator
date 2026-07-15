"use client";
// Short Video Script Generator — PRD §6.10

import { useState } from "react";
import { Video, Camera, Lightbulb, Copy, Check, Info, Film, ClipboardList } from "lucide-react";

export default function VideoScriptGenerator({ post, onClose }) {
  const [script, setScript] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(null);

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/video-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: post?.content,
          topic: post?.topic,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setScript(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function copy(text, key) {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function buildFullScript() {
    if (!script) return "";
    return [
      `HOOK (0:00-0:03): ${script.hook}`,
      "",
      ...script.scenes.map((s) => `[${s.timeCode}]\nSPEAK: ${s.spokenText}\nSHOW: ${s.visual}${s.tip ? `\nTIP: ${s.tip}` : ""}`),
      "",
      "CAPTION:",
      script.caption,
      "",
      script.hashtags.join(" "),
    ].join("\n");
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[3px] z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-linkedin/10 text-linkedin rounded-xl flex items-center justify-center border border-linkedin/10">
              <Video size={16} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">Video Script Generator</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Structure raw post text into high-engagement 30-60s vertical video scripts</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-6 md:p-8 space-y-6">
          {!script ? (
            <>
              {post && (
                <div className="bg-white border border-gray-200/80 rounded-2xl p-4.5 shadow-sm space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Converting Post Content</p>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 font-medium italic">"{post.content}"</p>
                </div>
              )}

              <div className="bg-orange-50/20 border border-orange-100 rounded-2xl p-5 text-xs text-orange-850 space-y-2.5">
                <p className="font-extrabold uppercase tracking-wider text-[10px] text-orange-900">LinkedIn video stats (2026):</p>
                <div className="space-y-1.5 leading-relaxed font-semibold">
                  <p>• Vertical 9:16 reels capture <strong>5x more engagement</strong> than raw text posts.</p>
                  <p>• Fast-paced hook and captions are mandatory (80% of users watch without sound).</p>
                  <p>• Generates visual screen directions, audio narrative, and production director tips.</p>
                </div>
              </div>

              {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">{error}</p>}

              <button
                onClick={generate}
                disabled={loading}
                className="w-full bg-linkedin hover:bg-linkedin-hover text-white font-bold py-3 rounded-full text-xs disabled:opacity-50 transition shadow-sm hover:shadow active:scale-[0.99]"
              >
                {loading ? "Writing script directions…" : "Generate Video Script"}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between pb-1">
                <div>
                  <p className="text-xs font-bold text-gray-700">Script Ready &bull; Duration {script.duration}</p>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Hook: "{script.hook}"</p>
                </div>
                <button
                  onClick={() => copy(buildFullScript(), "full")}
                  className={`text-[10px] font-bold px-3.5 py-1.5 rounded-full border transition-all flex items-center gap-1 ${
                    copied === "full"
                      ? "bg-linkedin text-white border-linkedin"
                      : "bg-white text-linkedin border-linkedin/30 hover:bg-linkedin/5"
                  }`}
                >
                  {copied === "full" ? <Check size={11} /> : null}
                  {copied === "full" ? "Copied Full Script" : "Copy Full Script"}
                </button>
              </div>

              {/* Scenes */}
              <div className="space-y-3.5">
                {script.scenes.map((scene, i) => (
                  <div key={i} className="border border-gray-200/80 bg-white rounded-2xl overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-4.5 py-2.5 bg-gray-50/50 border-b border-gray-100">
                      <span className="text-[9px] font-mono bg-gray-900 text-green-400 px-2 py-0.5 rounded font-extrabold uppercase tracking-wide">
                        {scene.timeCode}
                      </span>
                      <button
                        onClick={() => copy(scene.spokenText, `scene-${i}`)}
                        className="text-[10px] font-bold text-linkedin border border-linkedin/20 hover:bg-linkedin/5 px-2.5 py-1 rounded-full transition-all"
                      >
                        {copied === `scene-${i}` ? "✓ Copied" : "Copy Speak Text"}
                      </button>
                    </div>
                    <div className="p-4.5 space-y-3">
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase tracking-wider font-extrabold mb-1">Speak</p>
                        <p className="text-xs text-gray-800 font-bold leading-relaxed">"{scene.spokenText}"</p>
                      </div>
                      <div className="border-t border-gray-50 pt-2.5">
                        <p className="text-[9px] text-gray-400 uppercase tracking-wider font-extrabold mb-1">Show on Screen</p>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed italic">{scene.visual}</p>
                      </div>
                      {scene.tip && (
                        <div className="text-[10px] text-amber-800 bg-amber-50/50 border border-amber-100/30 p-2.5 rounded-xl flex items-start gap-1.5 leading-normal font-semibold">
                          <Lightbulb size={12} className="shrink-0 mt-0.5 text-amber-600" />
                          <span>{scene.tip}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Caption */}
              <div className="border border-gray-200/80 rounded-2xl p-4.5 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-gray-50">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold">LinkedIn Caption</p>
                  <button 
                    onClick={() => copy(`${script.caption}\n\n${script.hashtags.join(" ")}`, "caption")} 
                    className="text-[10px] font-bold text-linkedin border border-linkedin/20 hover:bg-linkedin/5 px-2.5 py-1 rounded-full transition-all"
                  >
                    {copied === "caption" ? "✓ Copied" : "Copy Caption"}
                  </button>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">{script.caption}</p>
                <p className="text-[11px] text-linkedin font-bold tracking-tight">{script.hashtags.join(" ")}</p>
              </div>

              {/* Production tips */}
              {script.productionTips?.length > 0 && (
                <div className="bg-gray-50/40 border border-gray-200/60 rounded-2xl p-5 space-y-3">
                  <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Camera size={13} className="text-linkedin" /> Production Director Tips
                  </p>
                  <ul className="space-y-2.5">
                    {script.productionTips.map((tip, i) => (
                      <li key={i} className="text-xs text-gray-600 flex gap-2 items-start leading-relaxed font-medium">
                        <span className="text-linkedin font-black select-none mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => setScript(null)}
                className="w-full border border-gray-200 text-gray-600 font-semibold text-xs py-3 rounded-full hover:bg-gray-50 hover:text-gray-800 transition active:scale-[0.99] mt-2"
              >
                Regenerate Video Script
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
