"use client";
// PDF Carousel Generator — PRD §4.7
// Uses html2canvas + jsPDF to build a branded 1080×1350px PDF carousel

import { useState, useRef } from "react";
import { FileText, CheckCircle, ClipboardList, Download, ArrowLeft, Info, HelpCircle } from "lucide-react";

const SLIDE_BG_COLORS = [
  "#0A66C2", // LinkedIn blue — cover
  "#F3F2EF", // light — body slides
];

export default function CarouselGenerator({ post, profile, onClose }) {
  const [topic, setTopic] = useState(post?.topic || "");
  const [slides, setSlides] = useState(null);
  const [linkedInCaption, setLinkedInCaption] = useState("");
  const [hashtags, setHashtags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("input"); // input | preview | done
  const [copied, setCopied] = useState(false);
  const previewRef = useRef(null);

  async function generateCarousel() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic || post?.topic,
          content: post?.content,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      const devName = profile?.name || "Developer";

      setSlides([
        // Cover slide
        {
          slideNumber: 0,
          headline: data.title,
          body: `${devName} · Full Stack Developer`,
          emoji: "",
          isCover: true,
        },
        ...(data.slides || []),
        // CTA slide
        {
          slideNumber: 99,
          headline: data.ctaSlide?.headline || "Follow for more",
          body: data.ctaSlide?.body || `I post about React, Next.js & Web3 daily.\nFollow @${devName} for more.`,
          emoji: "📌",
          isCTA: true,
        },
      ]);
      setLinkedInCaption(data.linkedInCaption || "");
      setHashtags(data.hashtags || []);
      setStep("preview");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function downloadPDF() {
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const slideEls = previewRef.current?.querySelectorAll(".carousel-slide");
      if (!slideEls || slideEls.length === 0) throw new Error("No slides found");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [1080, 1350],
      });

      for (let i = 0; i < slideEls.length; i++) {
        const canvas = await html2canvas(slideEls[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: null,
          width: 540,
          height: 675,
        });

        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 1080, 1350);
      }

      pdf.save(`${profile.name.replace(" ", "_")}_carousel_${new Date().toISOString().slice(0, 10)}.pdf`);
      setStep("done");
    } catch (err) {
      setError(`PDF export failed: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  }

  async function copyCaption() {
    const full = `${linkedInCaption}\n\n${hashtags.join(" ")}`;
    await navigator.clipboard.writeText(full).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[3px] z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-linkedin/10 text-linkedin rounded-xl flex items-center justify-center border border-linkedin/10">
              <FileText size={16} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">PDF Carousel Generator</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">High-impact document sliders for professional branding</p>
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
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-gray-700 block">
                  Carousel Topic / Hook Title
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. '5 React patterns that cut my re-renders by 50%'"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-linkedin/30 transition placeholder-gray-400"
                />
                <p className="text-[10px] text-gray-400 font-semibold px-0.5">
                  * Leave blank to automatically convert today's generated post into a carousel format.
                </p>
              </div>

              {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">{error}</p>}

              <button
                onClick={generateCarousel}
                disabled={loading}
                className="w-full bg-linkedin hover:bg-linkedin-hover text-white font-bold py-3 rounded-full text-xs disabled:opacity-50 transition shadow-sm hover:shadow active:scale-[0.99]"
              >
                {loading ? "Generating slides outline…" : "Generate Carousel Slides"}
              </button>

              <div className="bg-blue-50/30 border border-blue-100 rounded-2xl p-5 text-xs text-blue-800 space-y-2.5">
                <p className="font-extrabold uppercase tracking-wider text-[10px] text-blue-900">Why PDF carousels work:</p>
                <div className="space-y-1.5 leading-relaxed">
                  <p>• <strong>6.6% average engagement</strong> vs 2% standard text-only posts.</p>
                  <p>• Boosts dwell time significantly, which signals LinkedIn's algorithm to promote your post.</p>
                  <p>• Easy to read and highly bookmarkable for developers.</p>
                </div>
              </div>
            </>
          )}

          {/* Step 2: Preview */}
          {step === "preview" && slides && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-700">
                  {slides.length} Slides Generated — Review & Export
                </p>
              </div>

              {/* Slide preview grid */}
              <div
                ref={previewRef}
                className="grid grid-cols-2 gap-3.5 max-h-[360px] overflow-y-auto pr-1 bg-gray-50/50 p-5 rounded-2xl border border-gray-100"
              >
                {slides.map((slide, i) => (
                  <SlidePreview key={i} slide={slide} index={i} total={slides.length} profileName={profile?.name} />
                ))}
              </div>

              {/* Caption */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-gray-50">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold">LinkedIn Caption text</p>
                  <button
                    onClick={copyCaption}
                    className="text-[10px] font-bold text-linkedin border border-linkedin/20 hover:bg-linkedin/5 px-2.5 py-1 rounded-full transition-all"
                  >
                    {copied ? "✓ Copied" : "Copy Caption"}
                  </button>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                  {linkedInCaption}
                </p>
                <p className="text-[11px] text-linkedin font-bold tracking-tight">{hashtags.join(" ")}</p>
              </div>

              {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep("input")}
                  className="flex-1 border border-gray-200 text-gray-600 font-bold text-xs py-3 rounded-full hover:bg-gray-50 transition active:scale-[0.99] flex items-center justify-center gap-1"
                >
                  <ArrowLeft size={13} /> Back to Edit
                </button>
                <button
                  onClick={downloadPDF}
                  disabled={downloading}
                  className="flex-[2] bg-linkedin hover:bg-linkedin-hover text-white font-bold py-3 px-6 rounded-full text-xs disabled:opacity-50 transition shadow-sm hover:shadow active:scale-[0.99] flex items-center justify-center gap-1.5"
                >
                  {downloading ? "Building PDF file…" : <><Download size={13} /> Download PDF Document</>}
                </button>
              </div>

              <div className="bg-amber-50/20 border border-amber-100 rounded-2xl p-4 text-[11px] text-amber-800 flex items-start gap-2">
                <Info size={13} className="shrink-0 mt-0.5" />
                <span>Upload this PDF to LinkedIn as a "Document" format. LinkedIn rewards document posts with 3x higher organic reach.</span>
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
                <h3 className="font-bold text-gray-900 text-base">PDF Export Success!</h3>
                <p className="text-xs text-gray-500 leading-normal max-w-md mx-auto">
                  Your PDF file has been downloaded. Upload it to LinkedIn as a document post and paste the copied caption.
                </p>
              </div>

              <div className="bg-amber-50/20 border border-amber-100 rounded-2xl p-5 text-xs text-amber-900 text-left space-y-2.5 max-w-lg mx-auto">
                <p className="font-bold text-amber-800 flex items-center gap-1.5"><ClipboardList size={13} /> How to Publish on LinkedIn:</p>
                <div className="space-y-1.5 leading-relaxed">
                  <p>1. Open LinkedIn and click <strong>Start a post</strong>.</p>
                  <p>2. Select the <strong>Document icon</strong> and upload the PDF file.</p>
                  <p>3. Paste the caption text (which has been copied to your clipboard).</p>
                  <p>4. Publish and watch engagement spike.</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="bg-linkedin hover:bg-linkedin-hover text-white font-bold px-8 py-3 rounded-full text-xs transition shadow-sm hover:shadow active:scale-[0.99] inline-block"
              >
                Close Generator
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Gradient backgrounds per slide type (inline styles render reliably in html2canvas).
const GRADIENTS = {
  cover: "linear-gradient(145deg, #0A66C2 0%, #084d92 55%, #04294f 100%)",
  cta: "linear-gradient(145deg, #1f2937 0%, #111827 60%, #0b1220 100%)",
  body: "linear-gradient(160deg, #ffffff 0%, #f1f6fc 100%)",
};

function SlidePreview({ slide, index, total, profileName }) {
  const isCover = slide.isCover || index === 0;
  const isCTA = slide.isCTA;
  const dark = isCover || isCTA;
  const initials =
    (profileName || "Developer").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div
      className="carousel-slide relative rounded-2xl overflow-hidden aspect-[4/5] flex flex-col justify-between p-5 shadow-sm border"
      style={{
        minHeight: 170,
        background: isCover ? GRADIENTS.cover : isCTA ? GRADIENTS.cta : GRADIENTS.body,
        color: dark ? "#fff" : "#1D2226",
        borderColor: dark ? "transparent" : "#f1f1f1",
      }}
    >
      {/* Decorative shapes */}
      <div
        className="absolute rounded-full"
        style={{
          width: 130, height: 130, top: -45, right: -35,
          background: dark ? "rgba(255,255,255,0.08)" : "rgba(10,102,194,0.06)",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 70, height: 70, bottom: 40, left: -25,
          background: dark ? "rgba(255,255,255,0.05)" : "rgba(10,102,194,0.04)",
        }}
      />
      {!dark && (
        <div className="absolute left-0 top-0 h-full w-[4px]" style={{ background: "#0A66C2" }} />
      )}

      {/* Top row: badge + slide counter */}
      <div className="relative flex items-center justify-between z-10">
        <span
          className="text-[7.5px] font-bold tracking-wider px-2 py-0.5 rounded-md"
          style={{
            background: dark ? "rgba(255,255,255,0.18)" : "#0A66C2",
            color: "#fff",
          }}
        >
          {isCover ? "CAROUSEL" : isCTA ? "FOLLOW" : `${slide.slideNumber} / ${total - 2}`}
        </span>
        {slide.emoji && <span className="text-base leading-none">{slide.emoji}</span>}
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center py-2.5">
        <p className={`font-extrabold leading-tight mb-2 ${isCover ? "text-sm" : "text-[11px]"}`}>
          {slide.headline}
        </p>
        {/* Accent underline */}
        <div
          className="mb-2 rounded-full"
          style={{ width: 28, height: 3, background: dark ? "rgba(255,255,255,0.5)" : "#0A66C2" }}
        />
        <p
          className="text-[9.5px] leading-relaxed font-medium"
          style={{ color: dark ? "rgba(255,255,255,0.8)" : "#4b5563" }}
        >
          {slide.body}
        </p>
        {slide.codeSnippet && (
          <pre
            className="text-[8px] mt-2 rounded-lg px-2 py-1.5 font-mono leading-relaxed overflow-hidden"
            style={{ background: "#0b1220", color: "#4ade80" }}
          >
            {slide.codeSnippet.slice(0, 100)}
          </pre>
        )}
      </div>

      {/* Branding footer */}
      <div className="relative z-10 flex items-center gap-1.5 border-t pt-2" style={{ borderColor: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }}>
        <span
          className="flex items-center justify-center rounded-lg text-[7px] font-black"
          style={{
            width: 15, height: 15,
            background: dark ? "#fff" : "#0A66C2",
            color: dark ? "#0A66C2" : "#fff",
          }}
        >
          {initials}
        </span>
        <span className="text-[8.5px] font-bold" style={{ color: dark ? "rgba(255,255,255,0.75)" : "#6b7280" }}>
          {profileName || "Developer"}
        </span>
      </div>
    </div>
  );
}
