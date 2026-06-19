import { useState } from "react";
import { profile } from "@/lib/profile";
import { CopyIcon, CheckIcon, LinkedInLogo, RefreshIcon } from "./Icons";

const TRUNCATE_LENGTH = 280; // characters before "see more"

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function EditIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export default function PostCard({ post, onPost, onRegenerate, onEdit, isToday = false }) {
  const [copied, setCopied] = useState(false);
  const [posting, setPosting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fullText = `${post.content}\n\n${(post.hashtags || []).join(" ")}`;
  const isLong = post.content.length > TRUNCATE_LENGTH;
  const displayContent = !expanded && isLong
    ? post.content.slice(0, TRUNCATE_LENGTH).trimEnd() + "…"
    : post.content;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked
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
      {/* header */}
      <div className="flex items-start gap-3 p-4 pb-2">
        <div className="w-12 h-12 rounded-full bg-linkedin text-white flex items-center justify-center font-semibold shrink-0">
          {profile.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 text-sm">{profile.name}</p>
            {post.topic && (
              <span className="text-[11px] bg-linkedin/10 text-linkedin px-2 py-0.5 rounded-full">
                {post.topic}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">{profile.headline}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDate(post.date)} ·{" "}
            {post.status === "posted" ? "Posted" : "Draft"}
          </p>
        </div>
      </div>

      {/* body */}
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
          <div className="mt-3 rounded-lg overflow-hidden border border-gray-100">
            <img
              src={post.imageUrl}
              alt={post.imagePrompt || "AI generated visual"}
              className="w-full h-auto object-cover max-h-80"
              loading="lazy"
            />
          </div>
        )}
        {post.imagePrompt && !post.imageUrl && (
          <p className="text-xs text-gray-400 mt-3 italic border-l-2 border-gray-200 pl-2">
            🎨 Image idea: {post.imagePrompt}
          </p>
        )}
      </div>

      {/* actions */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-gray-100 mt-2">
        {post.status === "posted" ? (
          <button
            disabled
            className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-full cursor-default"
          >
            <CheckIcon className="w-4 h-4" /> Posted
          </button>
        ) : (
          <button
            onClick={handlePost}
            disabled={posting}
            className="flex items-center gap-1.5 text-sm text-white bg-linkedin hover:bg-linkedin-hover px-3 py-1.5 rounded-full transition font-medium disabled:opacity-60"
          >
            <LinkedInLogo className="w-4 h-4 [&>path]:fill-white" />
            {posting ? "Posting…" : "Post to LinkedIn"}
          </button>
        )}

        {post.status !== "posted" && onEdit && (
          <button
            onClick={() => onEdit(post)}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 transition"
          >
            <EditIcon /> Edit
          </button>
        )}

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 transition"
        >
          {copied ? <CheckIcon className="w-4 h-4 text-green-600" /> : <CopyIcon />}
          {copied ? "Copied" : "Copy"}
        </button>

        {isToday && onRegenerate && post.status !== "posted" && (
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 transition"
          >
            <RefreshIcon /> Regenerate
          </button>
        )}
      </div>
    </article>
  );
}
