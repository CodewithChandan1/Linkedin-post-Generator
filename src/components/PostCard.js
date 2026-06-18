import { useState } from "react";
import { profile } from "@/lib/profile";
import { CopyIcon, CheckIcon, LinkedInLogo } from "./Icons";

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function PostCard({ post, onPost, isToday = false }) {
  const [copied, setCopied] = useState(false);

  const fullText = `${post.content}\n\n${(post.hashtags || []).join(" ")}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — ignore
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
          {post.content}
        </p>
        {post.hashtags?.length > 0 && (
          <p className="text-linkedin text-sm mt-3">{post.hashtags.join(" ")}</p>
        )}
        {post.imagePrompt && (
          <p className="text-xs text-gray-400 mt-3 italic border-l-2 border-gray-200 pl-2">
            🎨 Image idea: {post.imagePrompt}
          </p>
        )}
      </div>

      {/* actions */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 mt-2">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-md transition"
        >
          {copied ? <CheckIcon className="w-4 h-4 text-green-600" /> : <CopyIcon />}
          {copied ? "Copied" : "Copy"}
        </button>

        {post.status === "posted" ? (
          <button
            disabled
            className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-md ml-auto cursor-default"
          >
            <CheckIcon className="w-4 h-4" /> Posted
          </button>
        ) : (
          <button
            onClick={() => onPost(post)}
            className="flex items-center gap-1.5 text-sm text-white bg-linkedin hover:bg-linkedin-hover px-3 py-1.5 rounded-full ml-auto transition font-medium"
          >
            <LinkedInLogo className="w-4 h-4 [&>path]:fill-white" />
            Post to LinkedIn
          </button>
        )}
      </div>
    </article>
  );
}
