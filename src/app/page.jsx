"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import TopNav from "@/components/TopNav/TopNav";
import ProfileSidebar from "@/components/ProfileSidebar/ProfileSidebar";
import StatsSidebar from "@/components/StatsSidebar/StatsSidebar";
import PostCard from "@/components/PostCard/PostCard";
import PostSkeleton from "@/components/PostSkeleton/PostSkeleton";
import { SparkleIcon } from "@/components/Icons/Icons";
import SettingsModal from "@/components/SettingsModal/SettingsModal";
import LinkedInConnect from "@/components/LinkedInConnect/LinkedInConnect";
import EditPostModal from "@/components/EditPostModal/EditPostModal";
import EditProfileModal from "@/components/EditProfileModal/EditProfileModal";
import AuthScreen from "@/components/AuthScreen/AuthScreen";
import TrendingPanel from "@/components/TrendingPanel/TrendingPanel";
import TrendingPage from "@/components/TrendingPage/TrendingPage";
import HooksPanel from "@/components/HooksPanel/HooksPanel";
import GoldenHourTimer from "@/components/GoldenHourTimer/GoldenHourTimer";
import TopicDNAPanel from "@/components/TopicDNAPanel/TopicDNAPanel";
import DepthScoreCard from "@/components/DepthScoreCard/DepthScoreCard";
import CarouselGenerator from "@/components/CarouselGenerator/CarouselGenerator";
import SEOAuditor from "@/components/SEOAuditor/SEOAuditor";
import CommentSeedingPanel from "@/components/CommentSeedingPanel/CommentSeedingPanel";
import OpportunityTracker from "@/components/OpportunityTracker/OpportunityTracker";
import GrowthDashboard from "@/components/GrowthDashboard/GrowthDashboard";
import ContentCalendar from "@/components/ContentCalendar/ContentCalendar";
import NewsletterGenerator from "@/components/NewsletterGenerator/NewsletterGenerator";
import StrategicCommentGenerator from "@/components/StrategicCommentGenerator/StrategicCommentGenerator";
import ProfileVisitorTracker from "@/components/ProfileVisitorTracker/ProfileVisitorTracker";
import VideoScriptGenerator from "@/components/VideoScriptGenerator/VideoScriptGenerator";
import TwitterThreadPanel from "@/components/TwitterThreadPanel/TwitterThreadPanel";
import { loadPosts, savePosts, todayKey } from "@/lib/storage";
import { loadSettings, saveSettings } from "@/lib/settings";
import { useReminderScheduler } from "@/lib/useReminderScheduler";
import { useLinkedIn } from "@/lib/useLinkedIn";
import { getNextFormat, advanceRotation, computeDepthScore } from "@/lib/formatRotation";
import {
  Wrench, Search, Target, Trophy, Calendar, Newspaper,
  MessageSquare, Eye, Sparkles, FileText, Video,
  RotateCcw, Check,
} from "lucide-react";

export default function Home() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [humanizing, setHumanizing] = useState(false);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState("");
  const [settings, setSettings] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [showTrending, setShowTrending] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [goldenHourPost, setGoldenHourPost] = useState(null);
  const [showCarousel, setShowCarousel] = useState(false);
  const [carouselPost, setCarouselPost] = useState(null);
  const [showSEOAuditor, setShowSEOAuditor] = useState(false);
  const [showCommentSeeding, setShowCommentSeeding] = useState(false);
  const [seedPost, setSeedPost] = useState(null);
  const [showOpportunityTracker, setShowOpportunityTracker] = useState(false);
  const [showGrowthDashboard, setShowGrowthDashboard] = useState(false);
  const [showContentCalendar, setShowContentCalendar] = useState(false);
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [showStrategicComments, setShowStrategicComments] = useState(false);
  const [showProfileVisitor, setShowProfileVisitor] = useState(false);
  const [showVideoScript, setShowVideoScript] = useState(false);
  const [videoScriptPost, setVideoScriptPost] = useState(null);
  const [showTwitterThread, setShowTwitterThread] = useState(false);
  const [twitterPost, setTwitterPost] = useState(null);

  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_PAGE_SIZE = 10;
  const today = todayKey();
  const todaysPosts = posts.filter((p) => p.date === today);
  const todaysPost = todaysPosts[0] || null; // latest one (sorted newest first)
  const history = posts.filter((p) => p !== todaysPost);

  const prevPostsRef = useRef([]);

  // check session on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, []);

  // Disable body scroll when auth modal is active
  useEffect(() => {
    if (!authLoading && !user) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [user, authLoading]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setPosts([]);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  // hydrate from localStorage once on mount
  useEffect(() => {
    const localPosts = loadPosts();
    const localSettings = loadSettings();
    setPosts(localPosts);
    setSettings(localSettings);
    setHydrated(true);
    prevPostsRef.current = localPosts;
  }, []);

  // sync from MongoDB in background once user is authenticated
  useEffect(() => {
    if (!hydrated || !user) return;

    async function syncMongoDB() {
      try {
        const localPosts = loadPosts();
        const localSettings = loadSettings();

        // Sync Posts
        const resPosts = await fetch("/api/posts");
        const dataPosts = await resPosts.json();
        if (dataPosts.success && dataPosts.posts && dataPosts.posts.length > 0) {
          const formattedPosts = dataPosts.posts.map((p) => ({
            id: p.postId,
            date: p.date,
            content: p.content,
            hashtags: p.hashtags,
            imagePrompt: p.imagePrompt,
            imageUrl: p.imageUrl,
            hooks: p.hooks,
            topic: p.topic,
            status: p.status,
            source: p.source,
            trendingTitle: p.trendingTitle,
            postedAt: p.postedAt,
            format: p.format,
            hasFollowerCTA: p.hasFollowerCTA,
            depthScore: p.depthScore,
            depthLevel: p.depthLevel,
            humanized: p.humanized,
            humanizeChanges: p.humanizeChanges,
            likes: p.likes || 0,
            comments: p.comments || 0,
            shares: p.shares || 0,
            views: p.views || 0,
          }));
          setPosts(formattedPosts);
          savePosts(formattedPosts);
          prevPostsRef.current = formattedPosts;

          // Sync analytics helper storage to match
          const analyticsObj = {};
          formattedPosts.forEach((p) => {
            if (p.likes || p.comments || p.shares || p.views) {
              analyticsObj[p.id] = {
                likes: p.likes,
                comments: p.comments,
                shares: p.shares,
                views: p.views,
              };
            }
          });
          if (Object.keys(analyticsObj).length > 0) {
            window.localStorage.setItem("linkedin_post_analytics", JSON.stringify(analyticsObj));
          }
        } else if (localPosts && localPosts.length > 0) {
          // Migrate local posts to MongoDB
          localPosts.forEach((post) => {
            fetch("/api/posts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                postId: post.id,
                date: post.date,
                content: post.content,
                hashtags: post.hashtags || [],
                imagePrompt: post.imagePrompt || "",
                imageUrl: post.imageUrl || "",
                hooks: post.hooks || [],
                topic: post.topic || "",
                status: post.status || "pending",
                source: post.source || "scheduled",
                trendingTitle: post.trendingTitle || "",
                postedAt: post.postedAt || null,
                format: post.format || "text",
                hasFollowerCTA: post.hasFollowerCTA || false,
                depthScore: post.depthScore || 0,
                depthLevel: post.depthLevel || "Low",
                humanized: post.humanized || false,
                humanizeChanges: post.humanizeChanges || [],
                likes: post.likes || 0,
                comments: post.comments || 0,
                shares: post.shares || 0,
                views: post.views || 0,
              }),
            }).catch((err) => console.error("Error migrating local post to MongoDB:", err));
          });
        }

        // Sync Settings
        const resSettings = await fetch("/api/settings");
        const dataSettings = await resSettings.json();
        if (dataSettings.success && dataSettings.settings) {
          const s = dataSettings.settings;
          const formattedSettings = {
            email: s.email,
            reminderTime: s.reminderTime,
            reminderEnabled: s.reminderEnabled,
            pushEnabled: s.pushEnabled,
            topics: s.topics || {},
          };
          setSettings(formattedSettings);
          saveSettings(formattedSettings);
        } else if (localSettings) {
          // Migrate local settings to MongoDB
          fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(localSettings),
          }).catch((err) => console.error("Error migrating settings to MongoDB:", err));
        }
      } catch (err) {
        console.error("MongoDB background sync failed:", err);
      }
    }
    syncMongoDB();
  }, [hydrated, user]);

  // persist whenever posts change (after hydration) & sync changes to MongoDB
  useEffect(() => {
    if (!hydrated) return;
    savePosts(posts);

    if (!user) {
      prevPostsRef.current = posts;
      return;
    }

    const prevPosts = prevPostsRef.current;

    // Detect additions or updates
    posts.forEach((post) => {
      const prevPost = prevPosts.find((p) => p.id === post.id);
      if (!prevPost || JSON.stringify(prevPost) !== JSON.stringify(post)) {
        fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId: post.id,
            date: post.date,
            content: post.content,
            hashtags: post.hashtags || [],
            imagePrompt: post.imagePrompt || "",
            imageUrl: post.imageUrl || "",
            hooks: post.hooks || [],
            topic: post.topic || "",
            status: post.status || "pending",
            source: post.source || "scheduled",
            trendingTitle: post.trendingTitle || "",
            postedAt: post.postedAt || null,
            format: post.format || "text",
            hasFollowerCTA: post.hasFollowerCTA || false,
            depthScore: post.depthScore || 0,
            depthLevel: post.depthLevel || "Low",
            humanized: post.humanized || false,
            humanizeChanges: post.humanizeChanges || [],
            likes: post.likes || 0,
            comments: post.comments || 0,
            shares: post.shares || 0,
            views: post.views || 0,
            impressions: post.impressions || 0,
            clicks: post.clicks || 0,
          }),
        }).catch((err) => console.error("Error syncing post to MongoDB:", err));
      }
    });

    // Detect deletions
    prevPosts.forEach((prevPost) => {
      const exists = posts.some((p) => p.id === prevPost.id);
      if (!exists) {
        fetch(`/api/posts?postId=${prevPost.id}`, {
          method: "DELETE",
        }).catch((err) => console.error("Error deleting post from MongoDB:", err));
      }
    });

    prevPostsRef.current = posts;
  }, [posts, hydrated, user]);

  // run the daily reminder scheduler while the app is open
  useReminderScheduler({ settings, todaysPost });

  // LinkedIn OAuth connection
  const linkedin = useLinkedIn();

  function handleSaveSettings(next) {
    setSettings(next);
    saveSettings(next);
    fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    })
      .then(() => showToast("Settings saved to database"))
      .catch((err) => {
        console.error("Failed to save settings to DB:", err);
        showToast("Settings saved locally");
      });
  }

  function handleEditSave(updatedPost) {
    setPosts((prev) =>
      prev.map((p) => (p.id === updatedPost.id ? updatedPost : p))
    );
    showToast("Post updated");
  }

  function handleTrendingPost(data) {
    const newPost = {
      id: `${today}-trending-${Date.now()}`,
      date: today,
      content: data.content,
      hashtags: data.hashtags,
      imagePrompt: data.imagePrompt,
      imageUrl: data.imageUrl || "",
      hooks: data.hooks || [],
      topic: "Trending",
      status: "pending",
      source: data.source || "trending",
      trendingTitle: data.trendingTitle || "",
      postedAt: null,
    };
    setPosts((prev) => [newPost, ...prev]);
    showToast(`Trending post generated: ${data.trendingTitle || "topic"}`);
  }

  function handleSelectHook(hook, post) {
    // Replace the first line of the post with the selected hook
    const lines = post.content.split("\n");
    lines[0] = hook;
    const updated = { ...post, content: lines.join("\n") };
    setPosts((prev) => prev.map((p) => (p.id === post.id ? updated : p)));
    showToast("Hook applied!");
  }

  function handleDelete(post) {
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    showToast("Post deleted");
  }

  const generate = useCallback(
    async (replace = false, prompt = "") => {
      setLoading(true);
      setError("");
      try {
        const { format, followerCTA } = getNextFormat();

        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: prompt || undefined }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Generation failed");

        // Append follower CTA if this is the 7th post in rotation
        const content = followerCTA
          ? `${data.content}\n\n${followerCTA}`
          : data.content;

        const depthScore = computeDepthScore(content);

        const newPost = {
          id: `${today}-${Date.now()}`,
          date: today,
          content,
          hashtags: data.hashtags,
          imagePrompt: data.imagePrompt,
          imageUrl: data.imageUrl || "",
          hooks: data.hooks || [],
          topic: data.topic,
          status: "pending",
          source: data.source || "scheduled",
          trendingTitle: data.trendingTitle || "",
          postedAt: null,
          format,
          hasFollowerCTA: Boolean(followerCTA),
          depthScore: depthScore.score,
          depthLevel: depthScore.level,
          humanized: false,
        };

        setPosts((prev) => {
          if (replace) {
            const topPending = prev.find((p) => p.date === today && p.status === "pending");
            if (topPending) {
              return [newPost, ...prev.filter((p) => p.id !== topPending.id)];
            }
          }
          return [newPost, ...prev];
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
    if (hydrated && user && !todaysPost && !loading && !error) {
      generate(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, user]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function handlePost(post) {
    const text = `${post.content}\n\n${(post.hashtags || []).join(" ")}`;

    if (linkedin.isConnected) {
      // Use LinkedIn API for real one-click posting with image
      try {
        await linkedin.post(text, post.imageUrl || "");
        const postedAt = new Date().toISOString();
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id ? { ...p, status: "posted", postedAt } : p
          )
        );
        // Activate Golden Hour timer
        setGoldenHourPost({ ...post, postedAt });
        advanceRotation();
        showToast("Posted to LinkedIn with image! Reply to your first comment within 10 min.");
      } catch (err) {
        showToast(`Post failed: ${err.message}`);
      }
    } else {
      // Fallback: open LinkedIn's compose window pre-filled
      const url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      const postedAt = new Date().toISOString();
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, status: "posted", postedAt } : p
        )
      );
      // Activate Golden Hour timer
      setGoldenHourPost({ ...post, postedAt });
      advanceRotation();
      showToast("Opened LinkedIn — paste and post!");
    }
  }

  // Evergreen recycler — regenerate old high-performing post with fresh hook
  async function handleRefreshPost(oldPost) {
    const prompt = `Refresh this old post with a new hook and updated context. Original topic: ${oldPost.topic}. Original content: "${oldPost.content?.slice(0, 300)}"`;
    await generate(false, prompt);
    showToast("Evergreen post refreshed!");
  }

  function handleUpdatePostMetrics(postId, metrics) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likes: metrics.likes || 0,
              comments: metrics.comments || 0,
              shares: metrics.shares || 0,
              views: metrics.views || 0,
              impressions: metrics.impressions || 0,
              clicks: metrics.clicks || 0,
            }
          : p
      )
    );
  }

  // AI Humanizer — second Gemini pass to make post sound authentic
  async function handleHumanize(post) {
    setHumanizing(true);
    try {
      const res = await fetch("/api/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: post.content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Humanizer failed");

      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, content: data.content, humanized: true, humanizeChanges: data.changes }
            : p
        )
      );
      showToast("Post humanized — AI-detection risk reduced");
    } catch (err) {
      showToast(`Humanizer failed: ${err.message}`);
    } finally {
      setHumanizing(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans">
        <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20 shadow-xl mb-4 animate-pulse">
          <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-400">Loading personalized experience...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className={!user ? "select-none pointer-events-none opacity-95" : ""}>
      <TopNav
        user={user}
        onLogout={handleLogout}
        onOpenSettings={() => setSettingsOpen(true)}
        onToggleTrending={() => setShowTrending(!showTrending)}
        showTrending={showTrending}
      />

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: profile */}
        <div className="lg:col-span-3 order-2 lg:order-1">
          <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto space-y-4 pb-4 scrollbar-hide"
            style={{ scrollbarWidth: "none" }}
          >
            <ProfileSidebar profile={user?.profile} onEdit={() => setEditProfileOpen(true)} />
            <LinkedInConnect linkedin={linkedin} />
            {/* Phase 5 & 6: Tools panel */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <Wrench size={13} /> Tools
              </p>
              {[
                { icon: <Search size={13} />, label: "Profile SEO Auditor", action: () => setShowSEOAuditor(true) },
                { icon: <Target size={13} />, label: "Opportunity Tracker", action: () => setShowOpportunityTracker(true) },
                { icon: <Trophy size={13} />, label: "Growth Dashboard", action: () => setShowGrowthDashboard(true) },
                { icon: <Calendar size={13} />, label: "Content Calendar", action: () => setShowContentCalendar(true) },
                { icon: <Newspaper size={13} />, label: "Newsletter Generator", action: () => setShowNewsletter(true) },
                { icon: <MessageSquare size={13} />, label: "Strategic Comments", action: () => setShowStrategicComments(true) },
                { icon: <Eye size={13} />, label: "Profile Visitor Tracker", action: () => setShowProfileVisitor(true) },
              ].map(({ icon, label, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className="w-full text-left text-xs text-gray-700 bg-gray-50 hover:bg-linkedin/10 hover:text-linkedin border border-gray-200 rounded-lg px-3 py-2 transition flex items-center gap-2"
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: feed or trending */}
        <div className="lg:col-span-6 order-1 lg:order-2 space-y-4">
          {showTrending ? (
            <TrendingPage
              onGenerateFromTrending={(data) => {
                handleTrendingPost(data);
                setShowTrending(false);
              }}
              onClose={() => setShowTrending(false)}
            />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold text-gray-900">Today's post</h1>
                <button
                  onClick={() => generate(false)}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-sm text-white bg-linkedin hover:bg-linkedin-hover px-3 py-1.5 rounded-full transition font-medium disabled:opacity-50"
                >
                  + Generate New Post
                </button>
              </div>

              {/* Custom prompt input */}
              <div className="bg-white rounded-xl border border-gray-200 p-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (customPrompt.trim()) {
                      generate(false, customPrompt.trim());
                      setCustomPrompt("");
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Write a post about... (custom topic/prompt)"
                    className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-linkedin/30 focus:border-linkedin"
                  />
                  <button
                    type="submit"
                    disabled={loading || !customPrompt.trim()}
                    className="shrink-0 bg-linkedin hover:bg-linkedin-hover text-white text-sm font-medium px-4 py-2 rounded-full disabled:opacity-50 transition"
                  >
                    Generate
                  </button>
                </form>
                <p className="text-[11px] text-gray-400 mt-1.5 px-1">
                  e.g. "my experience building this LinkedIn auto-post tool" or "React Server Components pros and cons"
                </p>
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

              {todaysPost && <PostCard post={todaysPost} profile={user?.profile} onPost={handlePost} onRegenerate={() => generate(true)} onEdit={setEditingPost} onDelete={handleDelete} isToday />}

              {/* Phase 5: Depth Score + Humanizer for today's pending post */}
              {todaysPost && todaysPost.status !== "posted" && (
                <div className="space-y-2">
                  <DepthScoreCard post={todaysPost} />
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleHumanize(todaysPost)}
                      disabled={humanizing || todaysPost.humanized}
                      className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border transition ${
                        todaysPost.humanized
                          ? "border-green-300 text-green-700 bg-green-50 cursor-default"
                          : "border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100"
                      } disabled:opacity-60`}
                    >
                      {todaysPost.humanized
                        ? <><Check size={12} /> Humanized</>
                        : humanizing
                        ? "Humanizing…"
                        : <><Sparkles size={12} /> AI Humanize</>}
                    </button>
                    <button
                      onClick={() => { setCarouselPost(todaysPost); setShowCarousel(true); }}
                      className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 transition"
                    >
                      <FileText size={12} /> Carousel
                    </button>
                    <button
                      onClick={() => { setSeedPost(todaysPost); setShowCommentSeeding(true); }}
                      className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition"
                    >
                      <MessageSquare size={12} /> Seed Comments
                    </button>
                    <button
                      onClick={() => { setVideoScriptPost(todaysPost); setShowVideoScript(true); }}
                      className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100 transition"
                    >
                      <Video size={12} /> Video Script
                    </button>
                    <button
                      onClick={() => { setTwitterPost(todaysPost); setShowTwitterThread(true); }}
                      className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border border-gray-300 text-gray-700 bg-gray-50 hover:bg-gray-100 transition"
                    >
                      <span className="font-bold text-[11px]">𝕏</span> Thread
                    </button>
                  </div>
                  {todaysPost.humanized && todaysPost.humanizeChanges?.length > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5 text-[11px] text-purple-800">
                      <p className="font-semibold mb-1 flex items-center gap-1"><Sparkles size={11} /> Humanizer changes:</p>
                      <ul className="space-y-0.5">
                        {todaysPost.humanizeChanges.slice(0, 3).map((c, i) => (
                          <li key={i}>• {c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {todaysPost.format && todaysPost.format !== "text" && (
                    <div className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                      <RotateCcw size={11} /> Format rotation: <strong>{todaysPost.format}</strong> post scheduled
                      {todaysPost.format === "carousel" && " — use Carousel above"}
                      {todaysPost.format === "poll" && " — create as a native LinkedIn poll for 8.9% engagement"}
                    </div>
                  )}
                </div>
              )}

              {/* Golden Hour Timer — shows after posting */}
              {goldenHourPost && (
                <GoldenHourTimer
                  post={goldenHourPost}
                  onDismiss={() => setGoldenHourPost(null)}
                />
              )}

              {todaysPost && todaysPost.status !== "posted" && todaysPost.hooks?.length > 0 && (
                <HooksPanel hooks={todaysPost.hooks} onSelectHook={(hook) => handleSelectHook(hook, todaysPost)} />
              )}

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
                      <PostCard key={p.id} post={p} profile={user?.profile} onPost={handlePost} onEdit={setEditingPost} onDelete={handleDelete} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: stats */}
        <div className="lg:col-span-3 order-3">
          <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto space-y-4 pb-4"
            style={{ scrollbarWidth: "none" }}
          >
            <StatsSidebar posts={posts} settings={settings} onOpenSettings={() => setSettingsOpen(true)} />
            <TopicDNAPanel posts={posts} />
            {user && <TrendingPanel onGenerateFromTrending={handleTrendingPost} />}
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

      <EditPostModal
        open={Boolean(editingPost)}
        post={editingPost}
        onSave={handleEditSave}
        onClose={() => setEditingPost(null)}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg z-20">
          {toast}
        </div>
      )}

      <EditProfileModal
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        profile={user?.profile}
        onSave={(updatedUser) => {
          setUser(updatedUser);
          showToast("Profile updated successfully!");
        }}
      />

      {/* Phase 5 Modals */}
      {showCarousel && (
        <CarouselGenerator
          post={carouselPost}
          profile={user?.profile}
          onClose={() => { setShowCarousel(false); setCarouselPost(null); }}
        />
      )}
      {showSEOAuditor && (
        <SEOAuditor profile={user?.profile} onClose={() => setShowSEOAuditor(false)} />
      )}
      {showCommentSeeding && (
        <CommentSeedingPanel
          post={seedPost}
          onClose={() => { setShowCommentSeeding(false); setSeedPost(null); }}
        />
      )}
      {showOpportunityTracker && (
        <OpportunityTracker onClose={() => setShowOpportunityTracker(false)} />
      )}

      {/* Phase 6 Modals */}
      {showGrowthDashboard && (
        <GrowthDashboard
          posts={posts}
          settings={settings}
          onClose={() => setShowGrowthDashboard(false)}
          onOpenNewsletterGenerator={() => setShowNewsletter(true)}
          onOpenStrategicComments={() => setShowStrategicComments(true)}
          onOpenProfileVisitor={() => setShowProfileVisitor(true)}
          onOpenContentCalendar={() => setShowContentCalendar(true)}
          onRefreshPost={handleRefreshPost}
          onUpdatePostMetrics={handleUpdatePostMetrics}
        />
      )}
      {showContentCalendar && (
        <ContentCalendar
          onClose={() => setShowContentCalendar(false)}
          onGenerateForDay={(day) => generate(false, day.customPrompt || day.topic)}
        />
      )}
      {showNewsletter && (
        <NewsletterGenerator
          posts={posts}
          onClose={() => setShowNewsletter(false)}
        />
      )}
      {showStrategicComments && (
        <StrategicCommentGenerator onClose={() => setShowStrategicComments(false)} />
      )}
      {showProfileVisitor && (
        <ProfileVisitorTracker onClose={() => setShowProfileVisitor(false)} />
      )}
      {showVideoScript && (
        <VideoScriptGenerator
          post={videoScriptPost}
          onClose={() => { setShowVideoScript(false); setVideoScriptPost(null); }}
        />
      )}
      {showTwitterThread && (
        <TwitterThreadPanel
          post={twitterPost}
          onClose={() => { setShowTwitterThread(false); setTwitterPost(null); }}
        />
      )}
      </div>

      {/* Auth overlay modal */}
      {!user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/15 backdrop-blur-[2px] overflow-y-auto">
          <div className="w-full max-w-md bg-white/85 backdrop-blur-xl border border-white rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden my-8">
            {/* Decorative glows */}
            <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
            
            <AuthScreen onAuthSuccess={(u) => setUser(u)} isModal />
          </div>
        </div>
      )}
    </div>
  );
}
