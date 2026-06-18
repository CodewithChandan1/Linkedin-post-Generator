"use client";

import { useEffect, useState, useCallback } from "react";
import TopNav from "@/components/TopNav";
import ProfileSidebar from "@/components/ProfileSidebar";
import StatsSidebar from "@/components/StatsSidebar";
import PostCard from "@/components/PostCard";
import PostSkeleton from "@/components/PostSkeleton";
import { SparkleIcon, RefreshIcon } from "@/components/Icons";
import SettingsModal from "@/components/SettingsModal";
import { loadPosts, savePosts, todayKey } from "@/lib/storage";
import { loadSettings, saveSettings } from "@/lib/settings";
import { useReminderScheduler } from "@/lib/useReminderScheduler";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState("");
  const [settings, setSettings] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const today = todayKey();
  const todaysPost = posts.find((p) => p.date === today);
  const history = posts.filter((p) => p.date !== today);

  // hydrate from localStorage once
  useEffect(() => {
    setPosts(loadPosts());
    setSettings(loadSettings());
    setHydrated(true);
  }, []);

  // persist whenever posts change (after hydration)
  useEffect(() => {
    if (hydrated) savePosts(posts);
  }, [posts, hydrated]);

  // run the daily reminder scheduler while the app is open
  useReminderScheduler({ settings, todaysPost });

  function handleSaveSettings(next) {
    setSettings(next);
    saveSettings(next);
    showToast("Settings saved");
  }

  const generate = useCallback(
    async (replace = false) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Generation failed");

        const newPost = {
          id: `${today}-${Date.now()}`,
          date: today,
          content: data.content,
          hashtags: data.hashtags,
          imagePrompt: data.imagePrompt,
          topic: data.topic,
          status: "pending",
          source: "scheduled",
          postedAt: null,
        };

        setPosts((prev) => {
          const withoutToday = replace ? prev.filter((p) => p.date !== today) : prev;
          return [newPost, ...withoutToday];
        });
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [today]
  );

  // auto-generate today's post if it doesn't exist yet
  useEffect(() => {
    if (hydrated && !todaysPost && !loading && !error) {
      generate(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function handlePost(post) {
    // Phase 1: open LinkedIn's compose window pre-filled (no API approval needed).
    const text = `${post.content}\n\n${(post.hashtags || []).join(" ")}`;
    const url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");

    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, status: "posted", postedAt: new Date().toISOString() } : p
      )
    );
    showToast("Posted to LinkedIn! 🎉 Reply to your first comment within 10 min.");
  }

  return (
    <div className="min-h-screen">
      <TopNav onOpenSettings={() => setSettingsOpen(true)} />

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: profile */}
        <div className="lg:col-span-3 order-2 lg:order-1">
          <div className="lg:sticky lg:top-20">
            <ProfileSidebar />
          </div>
        </div>

        {/* Center: feed */}
        <div className="lg:col-span-6 order-1 lg:order-2 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Today's post</h1>
            <button
              onClick={() => generate(true)}
              disabled={loading}
              className="flex items-center gap-1.5 text-sm text-linkedin hover:bg-linkedin/10 px-3 py-1.5 rounded-full transition disabled:opacity-50"
            >
              <RefreshIcon className="w-4 h-4" />
              Regenerate
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">
              <p className="font-medium">Couldn't generate a post</p>
              <p className="mt-1 text-red-600">{error}</p>
              <button
                onClick={() => generate(true)}
                className="mt-2 text-linkedin font-medium hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {loading && !todaysPost && <PostSkeleton />}

          {todaysPost && <PostCard post={todaysPost} onPost={handlePost} isToday />}

          {!loading && !todaysPost && !error && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <SparkleIcon className="w-8 h-8 text-linkedin mx-auto" />
              <p className="mt-2 text-gray-600 text-sm">No post yet for today.</p>
              <button
                onClick={() => generate(false)}
                className="mt-3 bg-linkedin text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-linkedin-hover"
              >
                Generate today's post
              </button>
            </div>
          )}

          {history.length > 0 && (
            <div className="pt-2">
              <h2 className="text-sm font-semibold text-gray-500 mb-3">Post history</h2>
              <div className="space-y-4">
                {history.map((p) => (
                  <PostCard key={p.id} post={p} onPost={handlePost} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: stats */}
        <div className="lg:col-span-3 order-3">
          <div className="lg:sticky lg:top-20">
            <StatsSidebar posts={posts} settings={settings} onOpenSettings={() => setSettingsOpen(true)} />
          </div>
        </div>
      </main>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings || {}}
        onSave={handleSaveSettings}
        todaysPost={todaysPost}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg z-20">
          {toast}
        </div>
      )}
    </div>
  );
}
