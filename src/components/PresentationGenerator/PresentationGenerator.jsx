"use client";
// AI Presentation Generator (Gamma/Presenton-style).
// Gemini writes the deck outline → preview → export an editable .pptx with AI images.

import { useState, useRef, useEffect } from "react";
import { Presentation, Download, CheckCircle, Image as ImageIcon, Sparkles, RefreshCw, AlertTriangle, ArrowLeft, Info, HelpCircle } from "lucide-react";
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

// Fetch the image as base64 through our proxy.
async function loadImageAsDataUrl(pollUrl, { tries = 2 } = {}) {
  const proxy = `/api/slide-image?format=dataurl&url=${encodeURIComponent(pollUrl)}`;
  for (let i = 0; i < tries; i++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 120000);
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

// Presentational preview image.
function SlidePreviewImage({ state, theme, onRetry }) {
  const st = state?.status || "pending";
  return (
    <div className="w-2/5 shrink-0 relative" style={{ background: theme.panel }}>
      {st === "ok" && state.dataUrl ? (
        <img src={state.dataUrl} alt="" className="absolute inset-0 w-full h-full object-cover p-1 rounded-xl" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-2 text-center">
          {st === "failed" ? (
            <>
              <ImageIcon size={16} className="text-gray-400" />
              <button
                onClick={onRetry}
                className="text-[9px] font-bold bg-white text-gray-800 border border-gray-200 rounded-full px-2.5 py-1 shadow-sm flex items-center gap-1 hover:bg-gray-50 transition active:scale-95"
              >
                <RefreshCw size={8} /> Retry
              </button>
            </>
          ) : (
            <RefreshCw size={16} className="animate-spin text-gray-400" />
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
  const [images, setImages] = useState([]);
  const runToken = useRef(0);

  const theme = getTheme(themeKey);

  function patchImage(i, patch) {
    setImages((prev) => prev.map((im, idx) => (idx === i ? { ...im, ...patch } : im)));
  }

  useEffect(() => {
    if (step !== "preview" || !deck) return;
    const slides = deck.slides || [];
    const myToken = ++runToken.current;

    setImages(slides.map((s) => ({ status: s.imagePrompt ? "pending" : "skip", dataUrl: null })));

    slides.forEach((s, i) => {
      if (!s.imagePrompt) return;
      patchImage(i, { status: "loading" });
      const url = slideImageUrl(s.imagePrompt);
      loadImageAsDataUrl(url)
        .then((dataUrl) => {
          if (runToken.current !== myToken) return;
          if (dataUrl) {
            patchImage(i, { status: "ok", dataUrl });
          } else {
            patchImage(i, { status: "failed" });
          }
        });
    });
  }, [step, deck]);

  async function retryImage(i) {
    const s = deck?.slides?.[i];
    if (!s || !s.imagePrompt) return;
    patchImage(i, { status: "loading" });
    const url = slideImageUrl(s.imagePrompt);
    const dataUrl = await loadImageAsDataUrl(url);
    if (dataUrl) {
      patchImage(i, { status: "ok", dataUrl });
    } else {
      patchImage(i, { status: "failed" });
    }
  }

  const totalImages = images.filter((im) => im.status !== "skip").length;
  const resolvedImages = images.filter((im) => im.status === "ok" || im.status === "failed").length;
  const failedImages = images.filter((im) => im.status === "failed").length;
  const imagesLoading = resolvedImages < totalImages;

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/presentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          numSlides,
          content: post?.content,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation outline failed");

      const devName = profile?.name || "Developer";
      setDeck({
        deckTitle: data.deckTitle || data.title || "Untitled Presentation",
        subtitle: data.subtitle || "Created with AI",
        author: devName,
        slides: data.slides || [],
      });
      setStep("preview");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function downloadPPTX() {
    setDownloading(true);
    setProgress("Loading slide generator…");
    try {
      const PptxGenJS = (await import("pptxgenjs")).default;
      const pptx = new PptxGenJS();
      pptx.layout = "LAYOUT_16x9";

      const W = 13.3;
      const H = 7.5;

      // Title Slide
      const titleSlide = pptx.addSlide();
      if (themeKey === "gradient") {
        titleSlide.background = { color: hex(theme.gradientStart) };
      } else {
        titleSlide.background = { color: hex(theme.titleSlideBg) };
      }

      // Title Slide branding indicator
      titleSlide.addShape(pptx.ShapeType.rect, {
        x: 1.0, y: 1.5, w: 0.6, h: 0.1, fill: { color: hex(themeKey === "gradient" ? "#ffffff" : theme.accent) },
      });

      titleSlide.addText(deck.deckTitle, {
        x: 1.0, y: 1.8, w: W - 2.0, h: 1.5, fontSize: 36, bold: true,
        color: hex(themeKey === "gradient" ? "#ffffff" : theme.titleText),
        align: "left", fontFace: "Arial",
      });

      if (deck.subtitle) {
        titleSlide.addText(deck.subtitle, {
          x: 1.0, y: 3.4, w: W - 2.0, h: 0.8, fontSize: 18,
          color: hex(themeKey === "gradient" ? "rgba(255,255,255,0.8)" : theme.muted),
          align: "left", fontFace: "Arial",
        });
      }

      titleSlide.addText(`${deck.author} · ${new Date().toLocaleDateString(undefined, { year: "numeric", month: "short" })}`, {
        x: 1.0, y: H - 1.5, w: 6.0, h: 0.4, fontSize: 12,
        color: hex(themeKey === "gradient" ? "rgba(255,255,255,0.7)" : theme.muted),
        fontFace: "Arial",
      });

      // Content Slides
      const slides = deck.slides || [];
      for (let i = 0; i < slides.length; i++) {
        const s = slides[i];
        setProgress(`Writing slide ${i + 1} of ${slides.length}…`);
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

        // Image (right side)
        if (hasImage) {
          const dataUrl = images[i]?.dataUrl;
          if (dataUrl) {
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[3px] z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-linkedin/10 text-linkedin rounded-xl flex items-center justify-center border border-linkedin/10">
              <Presentation size={16} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">AI Presentation Generator</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Gamma-style deck outlines exported directly into editable PowerPoint files</p>
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
          {/* Step 1: Input */}
          {step === "input" && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 block">Presentation Topic</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. 'Scaling a Next.js app to 15,000 users'"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-linkedin/30 transition placeholder-gray-400"
                  />
                </div>

                {/* Slide count */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 block">Number of Slides</label>
                  <div className="flex gap-2">
                    {SLIDE_COUNTS.map((n) => (
                      <button
                        key={n}
                        onClick={() => setNumSlides(n)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-[0.97] ${
                          numSlides === n
                            ? "bg-linkedin/10 text-linkedin border-linkedin/15"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
                        }`}
                      >
                        {n} Slides
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme picker */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-gray-700 block">Design Theme</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {THEME_LIST.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setThemeKey(t.key)}
                        className={`rounded-xl overflow-hidden border-2 transition-all active:scale-[0.98] ${
                          themeKey === t.key ? "border-linkedin shadow-sm" : "border-gray-150 hover:border-gray-300"
                        }`}
                      >
                        <div className="h-10" style={{ background: t.gradient }} />
                        <div className="text-[10px] font-bold text-gray-700 py-1.5 text-center bg-gray-50/50 border-t border-gray-100">{t.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">{error}</p>}

              <button
                onClick={generate}
                disabled={loading || !topic.trim()}
                className="w-full bg-linkedin hover:bg-linkedin-hover text-white font-bold py-3 rounded-full text-xs disabled:opacity-50 transition shadow-sm hover:shadow active:scale-[0.99] flex items-center justify-center gap-1.5"
              >
                {loading ? <><RefreshCw className="animate-spin" size={13} /> Designing deck outline...</> : <><Sparkles size={13} /> Generate Presentation</>}
              </button>

              <div className="bg-blue-50/30 border border-blue-100 rounded-2xl p-5 text-xs text-blue-800 space-y-2.5">
                <div className="space-y-1.5 leading-relaxed">
                  <p>• AI writes tailored titles, bullet points, and presenter script notes for each slide.</p>
                  <p>• Creates professional visual prompt guides and automatically loads custom slide illustrations (~30-45s).</p>
                  <p>• Exports to standard 16:9 **PowerPoint / Google Slides (.pptx)** templates with full editing permissions.</p>
                </div>
              </div>
            </>
          )}

          {/* Step 2: Preview */}
          {step === "preview" && deck && (
            <>
              <div className="flex items-center justify-between pb-1">
                <p className="text-xs font-bold text-gray-700">
                  Slide Deck Preview ({deck.slides?.length || 0} Slides)
                </p>
              </div>

              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1 bg-gray-50/50 border border-gray-100 rounded-2xl p-4.5">
                {/* Title slide preview */}
                <div
                  className="rounded-2xl p-5 text-white shadow-sm flex flex-col justify-between"
                  style={{ aspectRatio: "16/9", background: themeKey === "gradient" ? theme.gradient : theme.titleSlideBg }}
                >
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="w-10 h-1.5 rounded-full bg-white/70 mb-3" />
                    <p className="text-base font-black leading-tight tracking-tight">{deck.deckTitle}</p>
                    {deck.subtitle && <p className="text-[11px] text-white/80 mt-1.5 leading-relaxed font-semibold">{deck.subtitle}</p>}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/10 text-[9px] text-white/60 font-semibold uppercase tracking-wider">
                    <span>{deck.author}</span>
                    <span>TITLE SLIDE</span>
                  </div>
                </div>

                {/* Content slides preview */}
                {(deck.slides || []).map((s, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-gray-200 overflow-hidden flex shadow-sm"
                    style={{ aspectRatio: "16/9", background: theme.bg }}
                  >
                    <div className="flex-1 p-5 min-w-0 flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-black mb-3 border-b pb-2" style={{ color: theme.title, borderColor: "rgba(0,0,0,0.03)" }}>{s.title}</p>
                        <ul className="space-y-1.5">
                          {(s.bullets || []).slice(0, 4).map((b, j) => (
                            <li key={j} className="text-[10px] leading-relaxed flex gap-1.5 font-semibold" style={{ color: theme.body }}>
                              <span style={{ color: theme.accent }}>•</span>
                              <span className="min-w-0">{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400 mt-2">Slide {i + 1} of {deck.slides?.length}</span>
                    </div>
                    {s.imagePrompt && (
                      <SlidePreviewImage state={images[i]} theme={theme} onRetry={() => retryImage(i)} />
                    )}
                  </div>
                ))}
              </div>

              {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">{error}</p>}

              {/* Image load progress */}
              {totalImages > 0 && imagesLoading && (
                <div className="bg-white border border-gray-200 p-5 rounded-2xl space-y-2.5 shadow-sm">
                  <p className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                    <RefreshCw size={12} className="animate-spin text-linkedin" />
                    Generating slide illustrations… {resolvedImages}/{totalImages} ready
                  </p>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linkedin transition-all duration-300"
                      style={{ width: `${totalImages ? (resolvedImages / totalImages) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}

              {!imagesLoading && failedImages > 0 && (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-2 leading-relaxed">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" /> 
                  <span>{failedImages} image{failedImages > 1 ? "s" : ""} couldn't render. You can retry them above or proceed to download the presentation without them.</span>
                </p>
              )}

              {downloading && progress && (
                <p className="text-xs text-linkedin flex items-center gap-1.5 font-bold"><RefreshCw size={12} className="animate-spin" /> {progress}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("input")}
                  className="flex-1 border border-gray-200 text-gray-600 font-bold text-xs py-3 rounded-full hover:bg-gray-50 transition active:scale-[0.99] flex items-center justify-center gap-1"
                >
                  <ArrowLeft size={13} /> Edit Topic
                </button>
                <button
                  onClick={downloadPPTX}
                  disabled={downloading || imagesLoading}
                  title={imagesLoading ? "Wait for all images to finish loading" : ""}
                  className="flex-[2] bg-linkedin hover:bg-linkedin-hover text-white font-bold py-3 px-6 rounded-full text-xs disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm hover:shadow active:scale-[0.99] flex items-center justify-center gap-1.5"
                >
                  {downloading
                    ? "Assembling PowerPoint file..."
                    : imagesLoading
                    ? `Loading slide assets… (${resolvedImages}/${totalImages})`
                    : failedImages > 0
                    ? <><Download size={13} /> Download Deck Anyway</>
                    : <><Download size={13} /> Download PowerPoint (.pptx)</>}
                </button>
              </div>
            </>
          )}

          {/* Step 3: Done */}
          {step === "done" && (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-gray-900 text-base">PowerPoint Downloaded!</h3>
                <p className="text-xs text-gray-500 leading-normal max-w-md mx-auto">
                  Open the exported presentation file in PowerPoint, Google Slides, or Keynote. Every card, block, text, and illustration remains fully editable.
                </p>
              </div>
              <button 
                onClick={onClose} 
                className="bg-linkedin hover:bg-linkedin-hover text-white font-bold px-8 py-3 rounded-full text-xs transition shadow-sm hover:shadow active:scale-[0.99] inline-block"
              >
                Close Deck Builder
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
