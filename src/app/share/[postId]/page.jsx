import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import User from "@/models/User";
import Link from "next/link";
import { MapPin, Calendar, Clock, Sparkles, User as UserIcon, ExternalLink } from "lucide-react";
import { headers } from "next/headers";

const DEFAULT_PROFILE = {
  name: "Developer",
  headline: "Software Engineer",
  location: "India",
  initials: "D",
  stack: ["JavaScript", "React", "Node.js"],
  achievements: []
};

// Disable caching to ensure always fetching latest logged post data
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { postId } = params;
  let post = null;

  try {
    await connectDB();
    post = await Post.findOne({ postId }).lean();
  } catch (error) {
    console.error("Error fetching metadata:", error);
  }

  if (!post) {
    return {
      title: "Post Not Found - LinkedIn Post Generator",
      description: "This post preview could not be found or has expired.",
    };
  }

  let postProfile = DEFAULT_PROFILE;
  if (post.userId) {
    try {
      const dbUser = await User.findById(post.userId).lean();
      if (dbUser && dbUser.profile) {
        postProfile = dbUser.profile;
      }
    } catch (e) {
      console.error("Failed to load user for metadata:", e);
    }
  }

  const title = `LinkedIn Post Preview by ${postProfile.name}`;
  const description = post.content.slice(0, 160) + (post.content.length > 160 ? "..." : "");

  let absoluteImageUrl = null;
  try {
    const headersList = headers();
    const host = headersList.get("host") || "localhost:3000";
    const proto = headersList.get("x-forwarded-proto") || "http";
    const baseUrl = `${proto}://${host}`;
    
    if (post.imageUrl) {
      absoluteImageUrl = post.imageUrl.startsWith("http")
        ? post.imageUrl
        : `${baseUrl}${post.imageUrl}`;
    }
  } catch (e) {
    console.error("Failed to construct absolute image url for OG tags:", e);
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: absoluteImageUrl ? [{ url: absoluteImageUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: absoluteImageUrl ? [absoluteImageUrl] : [],
    },
  };
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch (e) {
    return dateStr;
  }
}

export default async function SharePage({ params }) {
  const { postId } = params;
  let post = null;
  let postProfile = DEFAULT_PROFILE;

  try {
    await connectDB();
    post = await Post.findOne({ postId }).lean();
    if (post && post.userId) {
      const dbUser = await User.findById(post.userId).lean();
      if (dbUser && dbUser.profile) {
        postProfile = dbUser.profile;
      }
    }
  } catch (error) {
    console.error("Error fetching shared post:", error);
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center text-2xl font-bold mb-4">
          ⚠️
        </div>
        <h1 className="text-2xl font-bold mb-2">Preview Link Expired or Not Found</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          This post preview link may be incorrect, or the post was deleted by the author.
        </p>
        <Link
          href="/"
          className="bg-linkedin hover:bg-linkedin-hover text-white text-sm font-semibold px-5 py-2.5 rounded-full transition flex items-center gap-1.5"
        >
          Go to Generator Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Banner Loop */}
      <div className="bg-gradient-to-r from-linkedin via-sky-600 to-indigo-600 py-3 px-4 text-center text-xs font-semibold tracking-wide flex items-center justify-center gap-2">
        <Sparkles size={14} className="animate-pulse" />
        <span>You are viewing a shared preview of an AI-generated post by {postProfile.name}</span>
        <Link
          href="/"
          className="bg-white/20 hover:bg-white/30 text-white rounded px-2.5 py-1 transition flex items-center gap-1 text-[11px] font-bold"
        >
          Create Yours Now <ExternalLink size={10} />
        </Link>
      </div>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Author Bio (Bento Card style) */}
        <section className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-linkedin text-white flex items-center justify-center text-2xl font-bold border border-slate-700 shadow-lg">
              {postProfile.initials}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
                {postProfile.name}
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full inline-block animate-ping" title="Online" />
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin size={12} className="text-slate-500" /> {postProfile.location}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Headline</h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
              {postProfile.headline}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tech Stack</h3>
            <div className="flex flex-wrap gap-1.5">
              {(postProfile.stack || []).map((tech) => (
                <span
                  key={tech}
                  className="text-[10px] font-medium bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Author Achievements</h3>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {postProfile.achievements && postProfile.achievements.slice(0, 3).map((ach, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-linkedin font-bold shrink-0">✓</span>
                  <span>{ach}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Right Column: Shared Post Preview Card */}
        <section className="lg:col-span-2 space-y-4">
          <div className="bg-white text-gray-900 border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
            {/* Custom prompt badge */}
            {post.topic && (
              <div className="px-5 py-2.5 bg-slate-50 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-semibold text-linkedin bg-linkedin/10 px-2.5 py-0.5 rounded-full capitalize">
                  Topic: {post.topic}
                </span>
                <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                  <Calendar size={12} /> {formatDate(post.date)}
                </span>
              </div>
            )}

            {/* LinkedIn Header Mock */}
            <div className="flex items-start gap-3 p-5 pb-3">
              <div className="w-12 h-12 rounded-full bg-linkedin text-white flex items-center justify-center font-semibold text-lg shrink-0">
                {postProfile.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-gray-950 text-sm hover:underline hover:text-linkedin cursor-pointer">
                    {postProfile.name}
                  </span>
                  <span className="text-xs text-gray-400 font-normal">· 1st</span>
                </div>
                <p className="text-xs text-gray-500 truncate leading-snug">{postProfile.headline}</p>
                <div className="text-[11px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                  <span>Draft Preview</span>
                  <span>·</span>
                  <span title="Shared preview link">🌐 Shared Preview</span>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="px-5 pb-4">
              <p className="text-[15px] text-gray-900 whitespace-pre-wrap leading-relaxed break-words">
                {post.content}
              </p>
              {post.hashtags?.length > 0 && (
                <p className="text-linkedin text-sm font-medium mt-3.5 leading-relaxed">
                  {post.hashtags.join(" ")}
                </p>
              )}

              {/* Render Image visual */}
              {post.imageUrl && (
                <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 shadow-sm relative group">
                  <img
                    src={post.imageUrl}
                    alt={post.imagePrompt || "Post graphic visual"}
                    className="w-full h-auto object-cover max-h-[420px]"
                  />
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <a
                      href={post.imageUrl}
                      download={`preview-${post.postId}.png`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-black/80 hover:bg-black text-white text-[11px] px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-md font-semibold transition"
                    >
                      <span>📥 Download Visual</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Read-only interactive status bar mock */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500 font-medium">
              <span>👍 Like</span>
              <span>💬 Comment</span>
              <span>🔁 Repost</span>
              <span>✉️ Send</span>
            </div>
          </div>

          {/* Quick instructions/actions for guests */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-200">Like this content structure?</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Use our automated tool to generate high-performing posts.</p>
            </div>
            <Link
              href="/"
              className="bg-linkedin hover:bg-linkedin-hover text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg transition whitespace-nowrap"
            >
              Start Generating Free
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} LinkedIn Auto-Post Generator. All rights reserved.
      </footer>
    </div>
  );
}
