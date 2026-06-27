import { useState, useRef, useEffect } from "react";
import { LinkedInLogo } from "@/components/Icons/Icons";
import {
  MoreVertical,
  Edit2,
  Copy,
  RefreshCw,
  Trash2,
  Check,
  Palette,
  PenLine,
  Flame,
  Share2,
} from "lucide-react";

// Inline social SVGs to avoid package version mismatch issues
const TwitterIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedinIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

const FacebookIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
  </svg>
);

const LinkIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const TRUNCATE_LENGTH = 280;

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function PostCard({ post, profile, onPost, onRegenerate, onEdit, onDelete, isToday = false }) {
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const shareRef = useRef(null);

  const authorName = profile?.name || "Developer";
  const authorHeadline = profile?.headline || "Software Engineer";
  const authorInitials = profile?.initials || authorName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  const fullText = `${post.content}\n\n${(post.hashtags || []).join(" ")}`;
  const isLong = post.content.length > TRUNCATE_LENGTH;
  const displayContent =
    !expanded && isLong
      ? post.content.slice(0, TRUNCATE_LENGTH).trimEnd() + "…"
      : post.content;

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (shareRef.current && !shareRef.current.contains(e.target)) {
        setShareMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  async function handleCopyLinkOnly() {
    try {
      const shareUrl = `${window.location.origin}/share/${post.id || post.postId}`;
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy share link:", err);
    }
  }

  async function handlePost() {
    setPosting(true);
    try {
      await onPost(post);
    } finally {
      setPosting(false);
    }
  }

  return (
    <article className="bg-white rounded-xl border border-gray-200">
      {/* Custom prompt banner */}
      {post.topic && post.topic.length > 20 && (
        <div className="px-4 py-2 bg-linkedin/5 border-b border-gray-100 rounded-t-xl">
          <p className="text-[11px] text-gray-500 flex items-center gap-1">
            <PenLine size={11} className="text-linkedin shrink-0" />
            <span className="font-medium text-linkedin">Prompt:</span> {post.topic}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-2">
        <div className="w-12 h-12 rounded-full bg-linkedin text-white flex items-center justify-center font-semibold shrink-0">
          {authorInitials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 text-sm">{authorName}</p>
            {post.topic && (
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full ${
                  post.topic === "Trending"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-linkedin/10 text-linkedin"
                }`}
              >
                {post.topic === "Trending"
                  ? <span className="flex items-center gap-1"><Flame size={11} /> Trending</span>
                  : post.topic.length > 20
                  ? <span className="flex items-center gap-1"><PenLine size={11} /> Custom</span>
                  : post.topic}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">{authorHeadline}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDate(post.date)} · {post.status === "posted" ? "Posted" : "Draft"}
          </p>
        </div>

        {/* 3-dot menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
            aria-label="More options"
          >
            <MoreVertical size={18} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-40 z-20">
              {onEdit && post.status !== "posted" && (
                <button
                  onClick={() => { onEdit(post); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit2 size={14} /> Edit
                </button>
              )}
              <button
                onClick={() => { handleCopy(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Copy size={14} /> Copy
              </button>
              <button
                onClick={() => { handleCopyLinkOnly(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Share2 size={14} /> Share Link
              </button>
              {isToday && onRegenerate && post.status !== "posted" && (
                <button
                  onClick={() => { onRegenerate(); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <RefreshCw size={14} /> Regenerate
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    if (window.confirm("Delete this post?")) onDelete(post);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-2">
        <p className="text-[15px] text-gray-800 whitespace-pre-wrap leading-relaxed">
          {displayContent}
        </p>
        {isLong && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="text-linkedin text-sm font-medium mt-1 hover:underline"
          >
            …see more
          </button>
        )}
        {expanded && isLong && (
          <button
            onClick={() => setExpanded(false)}
            className="text-gray-500 text-sm mt-1 hover:underline"
          >
            show less
          </button>
        )}
        {post.hashtags?.length > 0 && (
          <p className="text-linkedin text-sm mt-3">{post.hashtags.join(" ")}</p>
        )}
        {post.imageUrl && (
          <div className="mt-3 rounded-lg overflow-hidden border border-gray-100 relative group">
            <img
              src={post.imageUrl}
              alt={post.imagePrompt || "AI generated visual"}
              className="w-full h-auto object-cover max-h-80"
              loading="lazy"
            />
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={async () => {
                  const { downloadCleanImage } = await import("@/lib/imageUtils");
                  downloadCleanImage(post.imageUrl, `clean-${post.postId || "post"}.png`);
                }}
                className="bg-black/80 hover:bg-black text-white text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md font-medium transition"
              >
                📥 Download Clean (No EXIF)
              </button>
            </div>
          </div>
        )}
        {post.imagePrompt && !post.imageUrl && (
          <p className="text-xs text-gray-400 mt-3 italic border-l-2 border-gray-200 pl-2 flex items-center gap-1.5">
            <Palette size={12} className="shrink-0" /> Image idea: {post.imagePrompt}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 mt-2">
        {post.status === "posted" ? (
          <button
            disabled
            className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-full cursor-default"
          >
            <Check size={15} /> Posted
          </button>
        ) : (
          <button
            onClick={handlePost}
            disabled={posting}
            className="flex items-center gap-1.5 text-sm text-white bg-linkedin hover:bg-linkedin-hover px-3 py-1.5 rounded-full transition font-medium disabled:opacity-60"
          >
            <LinkedInLogo size={15} color="white" />
            {posting ? "Posting…" : "Post to LinkedIn"}
          </button>
        )}

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 transition"
        >
          {copied ? (
            <Check size={15} className="text-green-600" />
          ) : (
            <Copy size={15} />
          )}
          {copied ? "Copied" : "Copy"}
        </button>

        <div className="relative" ref={shareRef}>
          <button
            onClick={() => setShareMenuOpen(!shareMenuOpen)}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 transition font-medium"
          >
            {shareCopied ? (
              <Check size={15} className="text-green-600" />
            ) : (
              <Share2 size={15} />
            )}
            {shareCopied ? "Link Copied!" : "Share Link"}
          </button>

          {shareMenuOpen && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-xl shadow-xl py-2 w-48 z-30 transition-all duration-150 animate-in fade-in slide-in-from-bottom-2">
              <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1">
                Share Preview
              </div>
              
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this post preview by ${authorName}: `)}%20${encodeURIComponent(typeof window !== "undefined" ? `${window.location.origin}/share/${post.id || post.postId}` : "")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShareMenuOpen(false)}
                className="w-full text-left px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 font-medium transition"
              >
                <span className="w-4 h-4 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366]">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </span>
                WhatsApp
              </a>

              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== "undefined" ? `${window.location.origin}/share/${post.id || post.postId}` : "")}&text=${encodeURIComponent(`Check out this post preview by ${authorName}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShareMenuOpen(false)}
                className="w-full text-left px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 font-medium transition"
              >
                <TwitterIcon className="w-4 h-4 text-[#1DA1F2]" />
                Twitter / X
              </a>

              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== "undefined" ? `${window.location.origin}/share/${post.id || post.postId}` : "")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShareMenuOpen(false)}
                className="w-full text-left px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 font-medium transition"
              >
                <LinkedinIcon className="w-4 h-4 text-[#0077b5]" />
                LinkedIn
              </a>

              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? `${window.location.origin}/share/${post.id || post.postId}` : "")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShareMenuOpen(false)}
                className="w-full text-left px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 font-medium transition"
              >
                <FacebookIcon className="w-4 h-4 text-[#1877F2]" />
                Facebook
              </a>

              <button
                onClick={() => { handleCopyLinkOnly(); setShareMenuOpen(false); }}
                className="w-full text-left px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 font-medium transition border-t border-gray-100 mt-1"
              >
                <LinkIcon className="w-4 h-4 text-gray-500" />
                Copy Link
              </button>
            </div>
          )}
        </div>

        {isToday && onRegenerate && post.status !== "posted" && (
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 transition"
          >
            <RefreshCw size={14} /> Regenerate
          </button>
        )}
      </div>
    </article>
  );
}
