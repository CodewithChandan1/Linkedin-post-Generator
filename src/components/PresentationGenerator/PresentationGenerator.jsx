"use client";
// AI Presentation Generator (Gamma/Presenton-style).
// Gemini writes the deck outline → preview → export an editable .pptx with AI images.

import { useState, useRef, useEffect } from "react";
import { Presentation, Download, CheckCircle, Image as ImageIcon, Sparkles, RefreshCw, AlertTriangle } from "lucide-react";
import { THEME_LIST, getTheme, hex } from "@/lib/presentationThemes";

const SLIDE_COUNTS = [4, 6, 8, 10];

function slideImageUrl(prompt) {
  if (!prompt) return "";
  const decorated = encodeURIComponent(
    prompt + ", professional, clean, minimal, modern, high quality, presentation illustration"
  );
  return `https://image.pollinations.ai/prompt/${decorated}?width=1024&height=768&nologo=true`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Fetch the image as base64 through our same-origin proxy (/api/slide-image).
// The server fetches pollinations (no browser CORS limits, no early abort) and
// caches it, so this works reliably and the result is reused by the .pptx export.
async function loadImageAsDataUrl(pollUrl, { tries = 2 } = {}) {
  const proxy = `/api/slide-image?format=dataurl&url=${encodeURIComponent(pollUrl)}`;
  for (let i = 0; i < tries; i++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 120000); // generous — generation is 30-45s
      const res = await fetch(proxy, { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) {
        const json = await res.json();
        if (json?.dataUrl) return json.dataUrl;
      }
    } catch {
      // network/timeout — retry
    }
    if (i < tries - 1) await sleep(1500);
  }
  return null;
}

// Presentational preview image — reflects the preloaded queue state.
function SlidePreviewImage({ state, theme, onRetry }) {
  const st = state?.status || "pending";
  return (
    <div className="w-2/5 shrink-0 relative" style={{ background: theme.panel }}>
      {st === "ok" && state.dataUrl ? (
        <img src={state.dataUrl} alt="" className="absolute inset-0 w-full h-full object-cover p-1.5 rounded-lg" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
          {st === "failed" ? (
            <>
              <ImageIcon size={18} className="text-gray-500" />
              <button
                onClick={onRetry}
                className="text-[10px] bg-white text-gray-800 border border-gray-300 rounded-full px-2 py-0.5 shadow-sm flex items-center gap-1 hover:bg-gray-50"
              >
                <RefreshCw size={9} /> Retry
              </button>
            </>
          ) : (
            <RefreshCw size={18} className="animate-spin text-gray-500" />
          )}
        </div>
      )}
    </div>
  );
}

export default function PresentationGenerator({ post, profile, onClose }) {
  const [topic, setTopic] = useState(post?.topic && post.topic.length > 3 ? post.topic : "");
  const [numSlides, setNumSlides] = useState(6);
  const [themeKey, setThemeKey] = useState("corporate");
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState("input"); // input | preview | done
  // Per-slide image preload state: { status: 'pending'|'loading'|'ok'|'failed'|'skip', dataUrl }
  const [images, setImages] = useState([]);
  const runToken = useRef(0);

  const theme = getTheme(themeKey);

  function patchImage(i, patch) {
    setImages((prev) => prev.map((im, idx) => (idx === i ? { ...im, ...patch } : im)));
  }

  // Preload all slide images through a small concurrency queue when the preview opens.
  // The Download button stays disabled until every image is resolved (ok or failed).
  useEffect(() => {
    if (step !== "preview" || !deck) return;
    const slides = deck.slides || [];
    const myToken = ++runToken.current;

    setImages(slides.map((s) => ({ status: s.imagePrompt ? "pending" : "skip", dataUrl: null })));

    const queue = slides.map((s, i) => ({ s, i })).filter((x) => x.s.imagePrompt);
    let cursor = 0;
    const CONCURRENCY = 3;

    async function worker() {
      while (cursor < queue.length) {
        const { s, i } = queue[cursor++];
        if (runToken.current !== myToken) return;
        patchImage(i, { status: "loading" });
        const dataUrl = await loadImageAsDataUrl(slideImageUrl(s.imagePrompt));
        if (runToken.current !== myToken) return;
        patchImage(i, dataUrl ? { status: "ok", dataUrl } : { status: "failed" });
      }
    }

    Array.from({ length: CONCURRENCY }, worker);

    return () => {
      runToken.current++; // cancel this run if deck changes / unmount
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, deck]);

  async function retryImage(i) {
    const s = deck?.slides?.[i];
    if (!s?.imagePrompt) return;
    patchImage(i, { status: "loading" });
    const dataUrl = await loadImageAsDataUrl(slideImageUrl(s.imagePrompt), { tries: 3 });
    patchImage(i, dataUrl ? { status: "ok", dataUrl } : { status: "failed" });
  }

  // Derived image-load progress.
  const activeImages = images.filter((im) => im.status !== "skip");
  const totalImages = activeImages.length;
  const resolvedImages = activeImages.filter((im) => im.status === "ok" || im.status === "failed").length;
  const failedImages = activeImages.filter((im) => im.status === "failed").length;
  const imagesLoading = activeImages.some((im) => im.status === "pending" || im.status === "loading");

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/presentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic || post?.topic, numSlides }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setDeck(data);
      setStep("preview");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function downloadPPTX() {
    if (!deck) return;
    setDownloading(true);
    setError("");
    try {
      const PptxGenJS = (await import("pptxgenjs")).default;
      const pptx = new PptxGenJS();
      pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
      pptx.layout = "WIDE";
      pptx.author = deck.author || "Developer";
      pptx.title = deck.deckTitle;

      const W = 13.333;
      const H = 7.5;

      // ---- Title slide ----
      const title = pptx.addSlide();
      title.background = { color: hex(theme.titleSlideBg) };
      title.addShape(pptx.ShapeType.rect, {
        x: 0.8, y: 3.05, w: 1.4, h: 0.12, fill: { color: hex(theme.accent) },
      });
      title.addText(deck.deckTitle, {
        x: 0.8, y: 2.0, w: W - 1.6, h: 1.0, fontSize: 40, bold: true,
        color: hex(theme.titleSlideText), align: "left", fontFace: "Arial",
      });
      if (deck.subtitle) {
        title.addText(deck.subtitle, {
          x: 0.8, y: 3.35, w: W - 1.6, h: 0.8, fontSize: 18,
          color: hex(theme.titleSlideText), align: "left", fontFace: "Arial",
        });
      }
      title.addText(`${deck.author}  ·  ${profile?.headline || "Full Stack Developer"}`, {
        x: 0.8, y: H - 0.9, w: W - 1.6, h: 0.4, fontSize: 12,
        color: hex(theme.titleSlideText), align: "left", fontFace: "Arial",
      });

      // ---- Content slides ----
      const slides = deck.slides || [];
      for (let i = 0; i < slides.length; i++) {
        const s = slides[i];
        setProgress(`Building slide ${i + 1} of ${slides.length}…`);
        const slide = pptx.addSlide();
        slide.background = { color: hex(theme.bg) };

        const hasImage = Boolean(s.imagePrompt);
        const textW = hasImage ? 7.0 : W - 1.6;

        // Accent bar + title
        slide.addShape(pptx.ShapeType.rect, {
          x: 0.8, y: 0.7, w: 0.5, h: 0.1, fill: { color: hex(theme.accent) },
        });
        slide.addText(s.title, {
          x: 0.8, y: 0.9, w: textW, h: 0.9, fontSize: 26, bold: true,
          color: hex(theme.title), align: "left", fontFace: "Arial",
        });

        // Bullets
        const bulletText = (s.bullets || []).map((b) => ({
          text: b,
          options: { bullet: { code: "2022" }, color: hex(theme.body), fontSize: 16, paraSpaceAfter: 10 },
        }));
        if (bulletText.length) {
          slide.addText(bulletText, {
            x: 0.9, y: 2.0, w: textW - 0.2, h: 4.4, align: "left", fontFace: "Arial", valign: "top",
          });
        }

        // Image (right side) — use the data URL already preloaded for the preview.
        if (hasImage) {
          const dataUrl = images[i]?.dataUrl;
          if (dataUrl) {
            // Panel behind image
            slide.addShape(pptx.ShapeType.rect, {
              x: 8.05, y: 1.55, w: 4.5, h: 4.0, fill: { color: hex(theme.panel) }, line: { type: "none" },
            });
            slide.addImage({ data: dataUrl, x: 8.2, y: 1.7, w: 4.2, h: 3.7, sizing: { type: "cover", w: 4.2, h: 3.7 } });
          }
        }

        // Footer
        slide.addText(`${deck.author}`, {
          x: 0.8, y: H - 0.6, w: 6, h: 0.3, fontSize: 10, color: hex(theme.muted), fontFace: "Arial",
        });
        slide.addText(`${i + 1} / ${slides.length}`, {
          x: W - 1.8, y: H - 0.6, w: 1.0, h: 0.3, fontSize: 10, color: hex(theme.muted), align: "right", fontFace: "Arial",
        });

        if (s.speakerNotes) slide.addNotes(s.speakerNotes);
      }

      const safe = (deck.deckTitle || "presentation").replace(/[^a-z0-9]+/gi, "_").slice(0, 40);
      await pptx.writeFile({ fileName: `${safe}.pptx` });
      setProgress("");
      setStep("done");
    } catch (err) {
      setError(`PPTX export failed: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-1.5">
              <Presentation size={16} /> AI Presentation Generator
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Gamma-style decks → editable PowerPoint (.pptx)</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Step 1: Input */}
          {step === "input" && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Presentation topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. 'Scaling a Next.js app to 15,000 users'"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/30 focus:border-linkedin"
                />
              </div>

              {/* Slide count */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Number of slides</label>
                <div className="flex gap-2">
                  {SLIDE_COUNTS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setNumSlides(n)}
                      className={`px-4 py-1.5 rounded-full text-sm border transition ${
                        numSlides === n
                          ? "bg-linkedin text-white border-linkedin"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme picker */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Theme</label>
                <div className="grid grid-cols-4 gap-2">
                  {THEME_LIST.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setThemeKey(t.key)}
                      className={`rounded-lg overflow-hidden border-2 transition ${
                        themeKey === t.key ? "border-linkedin" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="h-12" style={{ background: t.gradient }} />
                      <div className="text-[11px] text-gray-600 py-1 text-center">{t.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                onClick={generate}
                disabled={loading || !topic.trim()}
                className="w-full bg-linkedin hover:bg-linkedin-hover text-white font-medium py-2.5 rounded-full text-sm disabled:opacity-50 transition flex items-center justify-center gap-1.5"
              >
                {loading ? "Designing your deck…" : <><Sparkles size={14} /> Generate Presentation</>}
              </button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1">
                <p>• AI writes title + bullets + speaker notes for each slide</p>
                <p>• AI image generated per slide (~30–45s each — please wait)</p>
                <p>• Exports as a fully editable .pptx (PowerPoint / Google Slides)</p>
              </div>
            </>
          )}

          {/* Step 2: Preview */}
          {step === "preview" && deck && (
            <>
              <p className="text-sm text-gray-600">
                <strong>{deck.deckTitle}</strong> — {deck.slides?.length || 0} slides. Review, then download.
              </p>

              <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                {/* Title slide preview */}
                <div
                  className="rounded-lg p-4 text-white"
                  style={{ aspectRatio: "16/9", background: themeKey === "gradient" ? theme.gradient : theme.titleSlideBg }}
                >
                  <div className="h-full flex flex-col justify-center">
                    <div className="w-10 h-1 rounded-full bg-white/70 mb-2" />
                    <p className="text-lg font-extrabold leading-tight">{deck.deckTitle}</p>
                    {deck.subtitle && <p className="text-xs text-white/80 mt-1">{deck.subtitle}</p>}
                    <p className="text-[10px] text-white/60 mt-3">{deck.author}</p>
                  </div>
                </div>

                {/* Content slides preview */}
                {(deck.slides || []).map((s, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-gray-200 overflow-hidden flex"
                    style={{ aspectRatio: "16/9", background: theme.bg }}
                  >
                    <div className="flex-1 p-3 min-w-0">
                      <p className="text-sm font-bold mb-1.5" style={{ color: theme.title }}>{s.title}</p>
                      <ul className="space-y-1">
                        {(s.bullets || []).slice(0, 5).map((b, j) => (
                          <li key={j} className="text-[11px] flex gap-1.5" style={{ color: theme.body }}>
                            <span style={{ color: theme.accent }}>•</span>
                            <span className="min-w-0">{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {s.imagePrompt && (
                      <SlidePreviewImage state={images[i]} theme={theme} onRetry={() => retryImage(i)} />
                    )}
                  </div>
                ))}
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              {/* Image load progress */}
              {totalImages > 0 && imagesLoading && (
                <div>
                  <p className="text-xs text-gray-600 flex items-center gap-1.5 mb-1">
                    <RefreshCw size={12} className="animate-spin text-linkedin" />
                    Loading images… {resolvedImages}/{totalImages} ready
                  </p>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linkedin transition-all"
                      style={{ width: `${totalImages ? (resolvedImages / totalImages) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}
              {!imagesLoading && failedImages > 0 && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                  <AlertTriangle size={12} /> {failedImages} image{failedImages > 1 ? "s" : ""} couldn't be generated. Retry them above, or download without them.
                </p>
              )}
              {downloading && progress && (
                <p className="text-xs text-linkedin flex items-center gap-1.5"><ImageIcon size={12} /> {progress}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setStep("input")}
                  className="flex-1 border border-gray-200 text-gray-700 text-sm py-2.5 rounded-full hover:bg-gray-50"
                >
                  ← Back
                </button>
                <button
                  onClick={downloadPPTX}
                  disabled={downloading || imagesLoading}
                  title={imagesLoading ? "Wait for all images to finish loading" : ""}
                  className="flex-[2] bg-linkedin hover:bg-linkedin-hover text-white text-sm font-medium py-2.5 px-6 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {downloading
                    ? "Building .pptx…"
                    : imagesLoading
                    ? `Loading images… ${resolvedImages}/${totalImages}`
                    : failedImages > 0
                    ? <><Download size={13} className="inline mr-1" />Download anyway</>
                    : <><Download size={13} className="inline mr-1" />Download PowerPoint</>}
                </button>
              </div>
            </>
          )}

          {/* Step 3: Done */}
          {step === "done" && (
            <div className="text-center py-6">
              <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
              <h3 className="font-semibold text-gray-900 text-lg mb-1">Presentation downloaded!</h3>
              <p className="text-sm text-gray-600 mb-4">
                Open the .pptx in PowerPoint, Keynote, or Google Slides — everything is fully editable.
              </p>
              <button onClick={onClose} className="bg-linkedin text-white px-6 py-2.5 rounded-full text-sm font-medium">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
