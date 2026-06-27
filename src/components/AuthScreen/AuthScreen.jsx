"use client";

import { useState, useEffect } from "react";
import PostedInLogo from "@/components/PostedInLogo/PostedInLogo";
import { Lock, Mail, User, Eye, EyeOff, Key, CheckCircle, AlertCircle, Sparkles } from "lucide-react";

export default function AuthScreen({ onAuthSuccess, isModal = false }) {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "forgot" | "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleGoogleCallback = async (response) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Google sign-in failed");
      }
      if (data.success) {
        onAuthSuccess(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!document.getElementById("google-gsi-client")) {
      const script = document.createElement("script");
      script.id = "google-gsi-client";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const initGoogle = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "150131132029-jn9dbq4tkakerba5ri1ds78auhthdaka.apps.googleusercontent.com",
          callback: handleGoogleCallback,
        });

        const googleBtn = document.getElementById("google-signin-btn");
        if (googleBtn) {
          window.google.accounts.id.renderButton(googleBtn, {
            theme: "outline",
            size: "large",
            width: googleBtn.clientWidth || 360,
            text: "signin_with",
            shape: "rectangular",
          });
        }
      }
    };

    if (window.google) {
      initGoogle();
    } else {
      const checkScript = setInterval(() => {
        if (window.google) {
          initGoogle();
          clearInterval(checkScript);
        }
      }, 100);
      return () => clearInterval(checkScript);
    }
  }, [mode]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (mode === "login") {
      if (!email || !password) {
        setError("Please fill in all required fields.");
        return;
      }
      setLoading(true);
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Authentication failed");
        }
        if (data.success) {
          onAuthSuccess(data.user);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else if (mode === "signup") {
      if (!email || !password || !name) {
        setError("Please fill in all required fields.");
        return;
      }
      setLoading(true);
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Registration failed");
        }
        if (data.success) {
          onAuthSuccess(data.user);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else if (mode === "forgot") {
      if (!email) {
        setError("Please enter your email address.");
        return;
      }
      setLoading(true);
      try {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Request failed");
        }
        if (data.success) {
          setSuccess(data.message);
          setMode("reset");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else if (mode === "reset") {
      if (!email || !code || !newPassword) {
        setError("Please fill in all required fields.");
        return;
      }
      setLoading(true);
      try {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code, newPassword }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Reset password failed");
        }
        if (data.success) {
          setSuccess(data.message);
          setMode("login");
          setPassword("");
          setCode("");
          setNewPassword("");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  const getHeaderInfo = () => {
    switch (mode) {
      case "signup":
        return {
          title: "Create your account",
          subtitle: "Start generating high-converting developer content",
        };
      case "forgot":
        return {
          title: "Forgot password?",
          subtitle: "We'll send a 6-digit recovery code to your email",
        };
      case "reset":
        return {
          title: "Verify recovery code",
          subtitle: "Enter the code and set your new password",
        };
      case "login":
      default:
        return {
          title: "Welcome back",
          subtitle: "Sign in to generate your next viral post",
        };
    }
  };

  const { title, subtitle } = getHeaderInfo();

  // Unified form component content
  const formContent = (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* SUCCESS NOTIFICATION */}
      {success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-700 font-semibold flex items-start gap-2.5">
          <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* ERROR NOTIFICATION */}
      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 font-semibold flex items-start gap-2.5">
          <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* SIGNUP: Name field */}
      {mode === "signup" && (
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <div className="relative rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-[#0A66C2] focus-within:ring-2 focus-within:ring-[#0A66C2]/10 transition-all duration-200">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <User className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full pl-11 pr-3.5 py-3 bg-transparent border-0 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:ring-0 focus:outline-none transition-all duration-200"
              placeholder="Chandan Kushwaha"
            />
          </div>
        </div>
      )}

      {/* EMAIL field */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Email Address
        </label>
        <div className="relative rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-[#0A66C2] focus-within:ring-2 focus-within:ring-[#0A66C2]/10 transition-all duration-200">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Mail className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="email"
            required
            disabled={mode === "reset"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full pl-11 pr-3.5 py-3 bg-transparent border-0 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:ring-0 focus:outline-none transition-all duration-200 disabled:opacity-50"
            placeholder="name@example.com"
          />
        </div>
      </div>

      {/* LOGIN / SIGNUP: Password field */}
      {(mode === "login" || mode === "signup") && (
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Password
            </label>
            {mode === "login" && (
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setMode("forgot");
                }}
                className="text-xs font-bold text-[#0A66C2] hover:text-[#004182] transition-colors"
              >
                Forgot Password?
              </button>
            )}
          </div>
          <div className="relative rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-[#0A66C2] focus-within:ring-2 focus-within:ring-[#0A66C2]/10 transition-all duration-200">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-11 pr-10 py-3 bg-transparent border-0 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:ring-0 focus:outline-none transition-all duration-200"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {/* RESET: Verification Code field */}
      {mode === "reset" && (
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Verification Code (6-digit)
          </label>
          <div className="relative rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-[#0A66C2] focus-within:ring-2 focus-within:ring-[#0A66C2]/10 transition-all duration-200">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Key className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="block w-full pl-11 pr-3.5 py-3 bg-transparent border-0 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:ring-0 focus:outline-none transition-all duration-200 tracking-widest font-mono text-center font-bold"
              placeholder="123456"
            />
          </div>
        </div>
      )}

      {/* RESET: New Password field */}
      {mode === "reset" && (
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            New Password
          </label>
          <div className="relative rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-[#0A66C2] focus-within:ring-2 focus-within:ring-[#0A66C2]/10 transition-all duration-200">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type={showNewPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="block w-full pl-11 pr-10 py-3 bg-transparent border-0 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:ring-0 focus:outline-none transition-all duration-200"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {/* SUBMIT BUTTON */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#0A66C2] hover:bg-[#004182] active:scale-[0.98] active:translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A66C2] disabled:opacity-50 transition-all duration-150 cursor-pointer"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </span>
          ) : mode === "login" ? (
            "Sign In"
          ) : mode === "signup" ? (
            "Create Account"
          ) : mode === "forgot" ? (
            "Send Code"
          ) : (
            "Reset Password"
          )}
        </button>
      </div>

      {/* OR DIVIDER & GOOGLE SIGN IN */}
      {(mode === "login" || mode === "signup") && (
        <div className="space-y-4 pt-2">
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Or</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>
          <div className="flex justify-center w-full min-h-[44px]">
            <div id="google-signin-btn" className="w-full max-w-[360px]" />
          </div>
        </div>
      )}

      {/* BOTTOM LINKS */}
      <div className="mt-4 border-t border-slate-200 pt-4 text-center">
        {mode === "login" && (
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
              setSuccess("");
            }}
            className="text-xs font-bold text-[#0A66C2] hover:text-[#004182] transition-colors"
          >
            Don't have an account? Sign up
          </button>
        )}

        {mode === "signup" && (
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
              setSuccess("");
            }}
            className="text-xs font-bold text-[#0A66C2] hover:text-[#004182] transition-colors"
          >
            Already have an account? Sign in
          </button>
        )}

        {(mode === "forgot" || mode === "reset") && (
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
              setSuccess("");
            }}
            className="text-xs font-bold text-[#0A66C2] hover:text-[#004182] transition-colors"
          >
            Back to Sign In
          </button>
        )}
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-[#f3f2ef] flex flex-col md:flex-row relative overflow-hidden font-sans">
      {/* INJECT CUSTOM CSS ANIMATIONS */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(0.5deg); }
        }
        @keyframes float-delay {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(-0.5deg); }
        }
        @keyframes shadow-pulse {
          0%, 100% { transform: scale(1); opacity: 0.12; filter: blur(8px); }
          50% { transform: scale(0.95); opacity: 0.08; filter: blur(12px); }
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        .animate-float-delay {
          animation: float-delay 5s ease-in-out infinite;
        }
        .animate-shadow-pulse {
          animation: shadow-pulse 6s ease-in-out infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        @keyframes marquee-reviews {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-reviews {
          animation: marquee-reviews 28s linear infinite;
        }
        .animate-marquee-reviews:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* BACKGROUND DECORATIVE GRID */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 pointer-events-none" />

      {/* LEFT COLUMN: HERO SHOWCASE PANEL (Only visible on medium and larger screens) */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 relative overflow-hidden flex-col justify-between p-12 lg:p-16 border-r border-slate-200 z-10">

        {/* Brand header */}
        <div className="flex items-center gap-2 z-10">
          <PostedInLogo size="md" />
        </div>

        {/* Hero copy and mockup card */}
        <div className="my-auto space-y-10 z-10 max-w-lg">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-slate-800 leading-tight">
              Grow your <span className="text-[#0A66C2]">LinkedIn influence</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Design premium, developer-focused content, threads, and seeding comments in seconds using specialized AI tailored to your stack.
            </p>
          </div>

          {/* 3D Floating Mockup Card with real shadow */}
          <div className="relative w-full perspective-1000">
            {/* Pulsing Shadow underneath the card */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-4 bg-[#0A66C2] rounded-full opacity-10 animate-shadow-pulse pointer-events-none" />

            {/* The physical floating card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xl hover:shadow-2xl preserve-3d animate-float-slow hover:[transform:rotateX(2deg)_rotateY(-4deg)_translateZ(10px)] transition-transform duration-500 pointer-events-auto">
              <div className="absolute top-3 right-3 text-[#0A66C2] opacity-20">
                <Sparkles size={24} />
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A66C2] to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                  CK
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-800">Chandan Kushwaha</div>
                  <div className="text-xs text-slate-400 font-medium">Software Engineer | Building cool things</div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-xs text-slate-700 leading-relaxed font-mono">
                  🚀 Just integrated Lazy Email Verification into the Next.js SaaS architecture!
                </p>
                <p className="text-xs text-slate-600 leading-relaxed font-mono">
                  Instead of blocking registration, verify email address only when activating premium notifications. Better UX = Higher conversion.
                </p>
              </div>

              <div className="flex gap-2">
                <span className="text-[10px] font-bold text-[#0A66C2] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                  #NextJS
                </span>
                <span className="text-[10px] font-bold text-[#0A66C2] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                  #SaaS
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  #Development
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200 z-10">
          <div>
            <div className="text-xl lg:text-2xl font-black text-slate-800">5k+</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Posts Created</div>
          </div>
          <div>
            <div className="text-xl lg:text-2xl font-black text-slate-800">10x</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Faster Output</div>
          </div>
          <div>
            <div className="text-xl lg:text-2xl font-black text-slate-800">4.9★</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">User Rating</div>
          </div>
        </div>

        {/* Auto-scrolling reviews marquee */}
        <div className="pt-6 z-10 overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex">
              {[1,2,3,4,5].map(i => (
                <svg key={i} className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              ))}
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">What our users say</span>
          </div>

          {/* Marquee track */}
          <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent_0%,black_10%,black_90%,transparent_100%)]">
            <div className="flex gap-3 animate-marquee-reviews w-max">
              {[
                { initials: "RV", name: "Rahul Verma", role: "SDE @ Flipkart", color: "from-violet-500 to-purple-600", quote: "LinkedIn reach tripled in 3 weeks. Insanely good post quality." },
                { initials: "PS", name: "Priya Sharma", role: "Founder @ BuildFast", color: "from-emerald-500 to-teal-600", quote: "I post every day now. No more blank screen." },
                { initials: "AK", name: "Arjun Kumar", role: "PM @ Razorpay", color: "from-orange-500 to-red-500", quote: "10x faster content. My followers doubled in a month." },
                { initials: "NK", name: "Neha Kapoor", role: "Dev Advocate", color: "from-blue-500 to-cyan-500", quote: "The AI understands tech content. My posts actually perform now." },
                { initials: "MS", name: "Mohit Singh", role: "CTO @ Stackify", color: "from-rose-500 to-pink-600", quote: "Saved 2+ hours a week. Worth every rupee." },
                // Duplicate set for seamless loop
                { initials: "RV", name: "Rahul Verma", role: "SDE @ Flipkart", color: "from-violet-500 to-purple-600", quote: "LinkedIn reach tripled in 3 weeks. Insanely good post quality." },
                { initials: "PS", name: "Priya Sharma", role: "Founder @ BuildFast", color: "from-emerald-500 to-teal-600", quote: "I post every day now. No more blank screen." },
                { initials: "AK", name: "Arjun Kumar", role: "PM @ Razorpay", color: "from-orange-500 to-red-500", quote: "10x faster content. My followers doubled in a month." },
                { initials: "NK", name: "Neha Kapoor", role: "Dev Advocate", color: "from-blue-500 to-cyan-500", quote: "The AI understands tech content. My posts actually perform now." },
                { initials: "MS", name: "Mohit Singh", role: "CTO @ Stackify", color: "from-rose-500 to-pink-600", quote: "Saved 2+ hours a week. Worth every rupee." },
              ].map((r, idx) => (
                <div key={idx} className="flex items-start gap-2.5 bg-white/80 border border-slate-100 rounded-xl px-3.5 py-2.5 backdrop-blur-sm shrink-0 w-[220px]">
                  <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${r.color} flex items-center justify-center text-white font-bold text-[9px] shrink-0`}>
                    {r.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-[10px] font-bold text-slate-800 truncate">{r.name}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mb-1 truncate">{r.role}</div>
                    <p className="text-[10px] text-slate-600 leading-relaxed italic line-clamp-2">&ldquo;{r.quote}&rdquo;</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Sleek Centered Form Card */}
      <div className="flex-1 flex flex-col justify-center p-6 sm:p-12 lg:p-16 z-10">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="space-y-2">
            {/* Logo for mobile devices */}
            <div className="flex md:hidden items-center mb-6">
              <PostedInLogo size="md" />
            </div>

            <h2 className="text-3xl font-black tracking-tight text-slate-800">
              {title}
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              {subtitle}
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            {formContent}
          </div>
        </div>
      </div>
    </div>
  );
}
