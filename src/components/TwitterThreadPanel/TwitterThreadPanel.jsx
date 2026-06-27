"use client";
// Twitter/X Thread Formatter — PRD §6.9

import { useState } from "react";
import { Copy, Check, ClipboardList, ExternalLink } from "lucide-react";

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
      // Fallback: open in a new tab so user can right click -> copy/save
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            {/* 𝕏 is the X brand letter — not an emoji, intentional */}
            <h2 className="font-semibold text-gray-900">𝕏 Twitter / X Thread</h2>
            <p className="text-xs text-gray-500 mt-0.5">Reformat post as a thread — one click to compose</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-4 space-y-4">
          {!thread ? (
            <>
              {post && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Converting:</p>
                  <p className="text-xs text-gray-700 line-clamp-2">{post.content?.slice(0, 120)}…</p>
                </div>
              )}

              <div className="bg-gray-900 rounded-lg p-3 text-xs text-gray-300 space-y-1">
                <p className="text-white font-medium">No X API needed</p>
                <p>Generates thread text — you post manually or via compose URL</p>
                <p>X API is $100/month — we keep it free</p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                onClick={generate}
                disabled={loading || !post}
                className="w-full bg-gray-900 hover:bg-black text-white font-medium py-2.5 rounded-full text-sm disabled:opacity-50"
              >
                {loading ? "Formatting thread…" : "Format as Twitter Thread"}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">
                  {thread.tweets.length} tweets ready
                </p>
                <button
                  onClick={() => copy(buildFullThread(), "full")}
                  className="text-xs text-gray-700 border border-gray-300 px-3 py-1 rounded-full hover:bg-gray-50 flex items-center gap-1"
                >
                  {copied === "full" ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy all</>}
                </button>
              </div>

              <div className="space-y-2">
                {thread.tweets.map((tweet, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {tweet.number || i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 leading-relaxed">{tweet.text}</p>
                        
                        {tweet.imageUrl && (
                          <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 relative group">
                            <img
                              src={tweet.imageUrl}
                              alt={`Tweet ${i + 1} visual`}
                              className="w-full h-auto max-h-40 object-cover"
                            />
                            <div className="absolute top-2 right-2 flex gap-1.5 opacity-90 hover:opacity-100 transition">
                              <button
                                onClick={() => handleCopyImage(tweet.imageUrl, i)}
                                className="bg-black/75 hover:bg-black text-white text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1 transition font-medium"
                              >
                                {copyingImage === i ? "Copying..." : copiedImage === i ? "✓ Copied" : "Copy Image to Paste"}
                              </button>
                              <button
                                onClick={async () => {
                                  const { downloadCleanImage } = await import("@/lib/imageUtils");
                                  downloadCleanImage(tweet.imageUrl, `clean-tweet-${i + 1}.png`);
                                }}
                                className="bg-black/75 hover:bg-black text-white text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1 transition font-medium"
                              >
                                Download Clean
                              </button>
                              <a
                                href={tweet.imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-black/75 hover:bg-black text-white text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1 transition font-medium"
                              >
                                <ExternalLink size={10} /> Open
                              </a>
                            </div>
                          </div>
                        )}

                        {tweet.imagePrompt && !tweet.imageUrl && (
                          <p className="text-[11px] text-gray-500 italic mt-2 border-l-2 border-gray-200 pl-2">
                            💡 Suggested visual prompt: {tweet.imagePrompt}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-[10px] ${(tweet.text?.length || 0) > 270 ? "text-red-500" : "text-gray-400"}`}>
                            {tweet.text?.length || 0}/280
                          </span>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => copy(tweet.text, `tweet-${i}`)}
                              className="text-[10px] text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full hover:bg-gray-50 flex items-center gap-0.5"
                            >
                              {copied === `tweet-${i}` ? <><Check size={10} /> Done</> : <><Copy size={10} /> Copy</>}
                            </button>
                            {i === 0 && (
                              <button
                                onClick={() => openXCompose(tweet.text)}
                                className="text-[10px] text-white bg-gray-900 px-2 py-0.5 rounded-full hover:bg-black flex items-center gap-0.5"
                              >
                                <ExternalLink size={10} /> Open on 𝕏
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
                <p className="font-medium mb-1 flex items-center gap-1">
                  <ClipboardList size={12} /> How to post a thread on X:
                </p>
                <p>1. Click &ldquo;Open on 𝕏&rdquo; on tweet #1 to open the compose window</p>
                <p>2. If a tweet shows an image, click &ldquo;Open Image to Save&rdquo;, save it, and upload it to that tweet box on X</p>
                <p>3. Click &ldquo;+&rdquo; to add the next tweet in the thread</p>
                <p>4. Paste each tweet sequentially and hit &ldquo;Post all&rdquo;</p>
              </div>

              <button
                onClick={() => setThread(null)}
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
