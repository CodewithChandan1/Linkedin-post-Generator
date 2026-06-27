"use client";
// Short Video Script Generator — PRD §6.10

import { useState } from "react";
import { Video, Camera, Lightbulb, Copy, Check } from "lucide-react";

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-1.5"><Video size={16} /> Video Script Generator</h2>
            <p className="text-xs text-gray-500 mt-0.5">30-60s vertical video — 5x more engagement than text</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-4 space-y-4">
          {!script ? (
            <>
              {post && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Converting post:</p>
                  <p className="text-xs text-gray-600 line-clamp-2">{post.content?.slice(0, 120)}…</p>
                </div>
              )}

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-800 space-y-1">
                <p className="font-medium">LinkedIn video stats (2026):</p>
                <p>• 5× more engagement than text posts</p>
                <p>• Growing 2× faster than all other formats</p>
                <p>• LinkedIn Live = 7× reactions, 24× comments vs pre-recorded</p>
                <p>• Vertical 9:16, captions mandatory (80% watch without sound)</p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                onClick={generate}
                disabled={loading}
                className="w-full bg-linkedin hover:bg-linkedin-hover text-white font-medium py-2.5 rounded-full text-sm disabled:opacity-50"
              >
                {loading ? "Writing script…" : "Generate Video Script"}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Script ready — {script.duration}</p>
                  <p className="text-xs text-gray-500">Hook: "{script.hook}"</p>
                </div>
                <button
                  onClick={() => copy(buildFullScript(), "full")}
                  className="text-xs text-linkedin border border-linkedin/30 px-3 py-1 rounded-full hover:bg-linkedin/10 flex items-center gap-1"
                >
                  {copied === "full" ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy all</>}
                </button>
              </div>

              {/* Scenes */}
              <div className="space-y-2">
                {script.scenes.map((scene, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono bg-gray-900 text-green-400 px-2 py-0.5 rounded">
                        {scene.timeCode}
                      </span>
                      <button
                        onClick={() => copy(scene.spokenText, `scene-${i}`)}
                        className="text-[10px] text-linkedin border border-linkedin/30 px-2 py-0.5 rounded-full flex items-center gap-0.5"
                      >
                        {copied === `scene-${i}` ? <><Check size={10} /> Done</> : <><Copy size={10} /> Copy</>}
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">Speak</p>
                        <p className="text-sm text-gray-800 font-medium leading-snug">"{scene.spokenText}"</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">Show on screen</p>
                        <p className="text-xs text-gray-600 italic">{scene.visual}</p>
                      </div>
                      {scene.tip && (
                        <p className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded flex items-center gap-1">
                          <Lightbulb size={10} /> {scene.tip}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Caption */}
              <div className="border border-gray-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-gray-700">LinkedIn caption</p>
                  <button onClick={() => copy(`${script.caption}\n\n${script.hashtags.join(" ")}`, "caption")} className="text-[10px] text-linkedin border border-linkedin/30 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    {copied === "caption" ? <><Check size={10} /> Done</> : <><Copy size={10} /> Copy</>}
                  </button>
                </div>
                <p className="text-xs text-gray-600 whitespace-pre-wrap">{script.caption}</p>
                <p className="text-xs text-linkedin mt-1">{script.hashtags.join(" ")}</p>
              </div>

              {/* Production tips */}
              {script.productionTips?.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1"><Camera size={12} /> Production tips</p>
                  <ul className="space-y-1">
                    {script.productionTips.map((tip, i) => (
                      <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                        <span className="text-linkedin shrink-0">•</span>{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => setScript(null)}
                className="w-full border border-gray-200 text-gray-600 text-sm py-2 rounded-full hover:bg-gray-50"
              >
                Regenerate
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
