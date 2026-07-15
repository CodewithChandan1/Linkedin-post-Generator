"use client";
// Twitter/X Thread Formatter — PRD §6.9

import { useState } from "react";
import { Copy, Check, ClipboardList, ExternalLink, RefreshCw, Info, HelpCircle } from "lucide-react";

export default function TwitterThreadPanel({ post, onClose }) {
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(null);
  const [copyingImage, setCopyingImage] = useState(null);
  const [copiedImage, setCopiedImage] = useState(null);

  async function handleCopyImage(imageUrl, idx) {
    setCopyingImage(idx);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      let pngBlob = blob;
      if (blob.type !== "image/png") {
        pngBlob = await new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((b) => {
              if (b) resolve(b);
              else reject(new Error("Canvas export failed"));
            }, "image/png");
          };
          img.onerror = () => reject(new Error("Image load failed"));
          img.src = imageUrl;
        });
      }
      
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": pngBlob
        })
      ]);
      
      setCopiedImage(idx);
      setTimeout(() => setCopiedImage(null), 2500);
    } catch (err) {
      console.error(err);
      window.open(imageUrl, "_blank");
    } finally {
      setCopyingImage(null);
    }
  }

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/twitter-thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: post?.content,
          hashtags: post?.hashtags,
          originalImageUrl: post?.imageUrl,
          originalImagePrompt: post?.imagePrompt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setThread(data);
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

  function buildFullThread() {
    if (!thread) return "";
    return thread.tweets.map((t) => t.text).join("\n\n---\n\n");
  }

  function openXCompose(text) {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text.slice(0, 280))}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[3px] z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 text-white rounded-xl flex items-center justify-center font-black text-sm">
              𝕏
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">Twitter / 𝕏 Thread Formatter</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Adapt LinkedIn posts into highly readable tweet threads</p>
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
          {!thread ? (
            <>
              {post && (
                <div className="bg-white border border-gray-200/80 rounded-2xl p-4.5 shadow-sm space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Converting LinkedIn Post</p>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 font-medium italic">"{post.content}"</p>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200/60 rounded-2xl p-5 text-xs text-gray-600 space-y-2.5">
                <p className="font-extrabold uppercase tracking-wider text-[10px] text-gray-700 flex items-center gap-1"><Info size={12} /> Local conversion:</p>
                <div className="space-y-1.5 leading-relaxed font-semibold">
                  <p>• Formats raw text into sequential tweets of 280 characters or less.</p>
                  <p>• No expensive X API access required — we structure it for clean copy-pasting.</p>
                  <p>• Suggests visual image placements and thread transition anchors.</p>
                </div>
              </div>

              {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">{error}</p>}

              <button
                onClick={generate}
                disabled={loading || !post}
                className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-full text-xs disabled:opacity-50 transition shadow-sm hover:shadow active:scale-[0.99]"
              >
                {loading ? <><RefreshCw className="animate-spin" size={13} /> Formatting tweets outline...</> : "Format as Twitter Thread"}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between pb-1">
                <p className="text-xs font-bold text-gray-700">
                  {thread.tweets.length} Tweets Ready
                </p>
                <button
                  onClick={() => copy(buildFullThread(), "full")}
                  className={`text-[10px] font-bold px-3.5 py-1.5 rounded-full border transition-all flex items-center gap-1 ${
                    copied === "full"
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {copied === "full" ? <Check size={11} /> : null}
                  {copied === "full" ? "Copied Thread" : "Copy Full Thread"}
                </button>
              </div>

              {/* Tweets list */}
              <div className="space-y-3.5">
                {thread.tweets.map((tweet, i) => (
                  <div key={i} className="border border-gray-200/80 bg-white rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm">
                        {tweet.number || i + 1}
                      </div>
                      <div className="flex-1 min-w-0 space-y-3">
                        <p className="text-xs text-gray-700 leading-relaxed font-semibold whitespace-pre-wrap">{tweet.text}</p>
                        
                        {tweet.imageUrl && (
                          <div className="rounded-xl overflow-hidden border border-gray-100 relative group max-w-md">
                            <img
                              src={tweet.imageUrl}
                              alt={`Tweet ${i + 1} visual`}
                              className="w-full h-auto max-h-48 object-cover"
                            />
                            <div className="absolute top-2.5 right-2.5 flex gap-1.5 opacity-90 group-hover:opacity-100 transition">
                              <button
                                onClick={() => handleCopyImage(tweet.imageUrl, i)}
                                className="bg-black/75 hover:bg-black text-white text-[9px] px-2.5 py-1.5 rounded-md flex items-center gap-1 transition font-bold"
                              >
                                {copyingImage === i ? "Copying..." : copiedImage === i ? "✓ Copied" : "Copy Image"}
                              </button>
                              <button
                                onClick={async () => {
                                  const { downloadCleanImage } = await import("@/lib/imageUtils");
                                  downloadCleanImage(tweet.imageUrl, `clean-tweet-${i + 1}.png`);
                                }}
                                className="bg-black/75 hover:bg-black text-white text-[9px] px-2.5 py-1.5 rounded-md flex items-center gap-1 transition font-bold"
                              >
                                Download
                              </button>
                            </div>
                          </div>
                        )}

                        {tweet.imagePrompt && !tweet.imageUrl && (
                          <p className="text-[10px] text-gray-400 italic bg-gray-50 border border-gray-100 rounded-xl p-3 leading-relaxed font-semibold">
                            💡 Suggested visual prompt: {tweet.imagePrompt}
                          </p>
                        )}

                        <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                          <span className={`text-[10px] font-bold ${(tweet.text?.length || 0) > 270 ? "text-rose-500" : "text-gray-400"}`}>
                            {tweet.text?.length || 0} / 280
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => copy(tweet.text, `tweet-${i}`)}
                              className="text-[10px] font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-full transition"
                            >
                              {copied === `tweet-${i}` ? "✓ Done" : "Copy Tweet"}
                            </button>
                            {i === 0 && (
                              <button
                                onClick={() => openXCompose(tweet.text)}
                                className="text-[10px] font-bold text-white bg-gray-900 hover:bg-black px-3.5 py-1.5 rounded-full transition flex items-center gap-1 shadow-sm"
                              >
                                <ExternalLink size={11} /> Open on 𝕏
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Instructions */}
              <div className="bg-gray-50 border border-gray-255 rounded-2xl p-5 space-y-2.5">
                <p className="font-bold text-gray-700 text-xs flex items-center gap-1.5">
                  <ClipboardList size={13} /> How to Post Thread on X:
                </p>
                <div className="space-y-1.5 text-xs text-gray-600 leading-relaxed font-semibold">
                  <p>1. Click <strong>Open on 𝕏</strong> to launch compose box for Tweet #1.</p>
                  <p>2. Copy & paste each subsequent tweet sequentially using the copy buttons above.</p>
                  <p>3. Copy/download any generated slide images and add them to X's media frames.</p>
                  <p>4. Hit <strong>Post all</strong> to publish your thread.</p>
                </div>
              </div>

              <button
                onClick={() => setThread(null)}
                className="w-full border border-gray-200 text-gray-600 font-semibold text-xs py-3 rounded-full hover:bg-gray-50 hover:text-gray-800 transition active:scale-[0.99] mt-2"
              >
                Regenerate Thread
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
