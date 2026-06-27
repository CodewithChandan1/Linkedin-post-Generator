"use client";
// PDF Carousel Generator — PRD §4.7
// Uses html2canvas + jsPDF to build a branded 1080×1350px PDF carousel

import { useState, useRef } from "react";
import { FileText, CheckCircle, ClipboardList, Download } from "lucide-react";

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
          emoji: "🚀",
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
      // Dynamic import — only loads in browser
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
    await navigator.clipboard.writeText(full).catch(() => {});
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-1.5"><FileText size={16} /> PDF Carousel Generator</h2>
            <p className="text-xs text-gray-500 mt-0.5">6.6% avg engagement — 3× higher than text posts</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Step 1: Input */}
          {step === "input" && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Carousel topic
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. '5 React patterns that cut my re-renders by 50%'"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/30 focus:border-linkedin"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Leave blank to convert today's post into a carousel
                </p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                onClick={generateCarousel}
                disabled={loading}
                className="w-full bg-linkedin hover:bg-linkedin-hover text-white font-medium py-2.5 rounded-full text-sm disabled:opacity-50 transition"
              >
                {loading ? "Generating slides…" : "Generate Carousel"}
              </button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1">
                <p className="font-medium">Why PDF carousels work:</p>
                <p>• 6.6% avg engagement vs 2% text posts</p>
                <p>• Up to 40% engagement in tech niches</p>
                <p>• 4× dwell time — LinkedIn's Depth Score loves it</p>
                <p>• 8–12% follower reach (vs 2% for plain text)</p>
              </div>
            </>
          )}

          {/* Step 2: Preview */}
          {step === "preview" && slides && (
            <>
              <p className="text-sm text-gray-600">
                {slides.length} slides generated — review below, then download PDF
              </p>

              {/* Slide preview grid */}
              <div
                ref={previewRef}
                className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1"
              >
                {slides.map((slide, i) => (
                  <SlidePreview key={i} slide={slide} index={i} total={slides.length} profileName={profile?.name} />
                ))}
              </div>

              {/* Caption */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-gray-700">LinkedIn caption</p>
                  <button
                    onClick={copyCaption}
                    className="text-xs text-linkedin hover:underline"
                  >
                    Copy caption
                  </button>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {linkedInCaption}
                </p>
                <p className="text-xs text-linkedin mt-1">{hashtags.join(" ")}</p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2">
                <button
                  onClick={() => setStep("input")}
                  className="flex-1 border border-gray-200 text-gray-700 text-sm py-2.5 rounded-full hover:bg-gray-50"
                >
                  ← Regenerate
                </button>
                <button
                  onClick={downloadPDF}
                  disabled={downloading}
                  className="flex-2 bg-linkedin hover:bg-linkedin-hover text-white text-sm font-medium py-2.5 px-6 rounded-full disabled:opacity-50 transition"
                >
                  {downloading ? "Building PDF…" : <><Download size={13} className="inline mr-1" />Download PDF</>}
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center">
                Upload the PDF to LinkedIn as a "Document" post for maximum reach
              </p>
            </>
          )}

          {/* Step 3: Done */}
          {step === "done" && (
            <div className="text-center py-6">
              <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
              <h3 className="font-semibold text-gray-900 text-lg mb-1">PDF downloaded!</h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload it to LinkedIn as a "Document" post and paste the caption.
                Carousels are the highest-engagement format on LinkedIn in 2026.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 text-left mb-4">
                <p className="font-medium mb-1 flex items-center gap-1"><ClipboardList size={12} /> How to upload:</p>
                <p>1. Go to LinkedIn → Start a post</p>
                <p>2. Click the document icon → upload your PDF</p>
                <p>3. Paste the caption (already copied)</p>
                <p>4. Post at your best time for maximum reach</p>
              </div>
              <button
                onClick={onClose}
                className="bg-linkedin text-white px-6 py-2.5 rounded-full text-sm font-medium"
              >
                Done
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
      className="carousel-slide relative rounded-xl overflow-hidden aspect-[4/5] flex flex-col justify-between p-4"
      style={{
        minHeight: 160,
        background: isCover ? GRADIENTS.cover : isCTA ? GRADIENTS.cta : GRADIENTS.body,
        color: dark ? "#fff" : "#1D2226",
        border: dark ? "none" : "1px solid #e5e7eb",
      }}
    >
      {/* Decorative shapes */}
      <div
        className="absolute rounded-full"
        style={{
          width: 130, height: 130, top: -45, right: -35,
          background: dark ? "rgba(255,255,255,0.10)" : "rgba(10,102,194,0.08)",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 70, height: 70, bottom: 40, left: -25,
          background: dark ? "rgba(255,255,255,0.06)" : "rgba(10,102,194,0.06)",
        }}
      />
      {!dark && (
        <div className="absolute left-0 top-0 h-full" style={{ width: 5, background: "#0A66C2" }} />
      )}

      {/* Top row: badge + slide counter */}
      <div className="relative flex items-center justify-between z-10">
        <span
          className="text-[8px] font-bold tracking-wider px-2 py-0.5 rounded-full"
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
      <div className="relative z-10 flex-1 flex flex-col justify-center py-2">
        <p className={`font-extrabold leading-tight mb-1.5 ${isCover ? "text-base" : "text-sm"}`}>
          {slide.headline}
        </p>
        {/* Accent underline */}
        <div
          className="mb-2 rounded-full"
          style={{ width: 32, height: 3, background: dark ? "rgba(255,255,255,0.55)" : "#0A66C2" }}
        />
        <p
          className="text-[10.5px] leading-relaxed"
          style={{ color: dark ? "rgba(255,255,255,0.85)" : "#4b5563" }}
        >
          {slide.body}
        </p>
        {slide.codeSnippet && (
          <pre
            className="text-[9px] mt-2 rounded-md px-2 py-1.5 font-mono leading-relaxed overflow-hidden"
            style={{ background: "#0b1220", color: "#4ade80" }}
          >
            {slide.codeSnippet.slice(0, 100)}
          </pre>
        )}
      </div>

      {/* Branding footer */}
      <div className="relative z-10 flex items-center gap-1.5">
        <span
          className="flex items-center justify-center rounded-full text-[7px] font-bold"
          style={{
            width: 16, height: 16,
            background: dark ? "#fff" : "#0A66C2",
            color: dark ? "#0A66C2" : "#fff",
          }}
        >
          {initials}
        </span>
        <span className="text-[9px] font-medium" style={{ color: dark ? "rgba(255,255,255,0.7)" : "#6b7280" }}>
          {profileName || "Developer"}
        </span>
      </div>
    </div>
  );
}
