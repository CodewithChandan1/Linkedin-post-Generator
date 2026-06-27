"use client";

import { useState, useEffect } from "react";
import { Lock, Mail, User, Eye, EyeOff, PenTool, Key, CheckCircle, AlertCircle } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-[#f3f2ef] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* BACKGROUND DECORATIVE GRID */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60 pointer-events-none" />

      {/* Main Centered Login Card */}
      <div className="w-full max-w-[440px] bg-white border border-slate-200/80 rounded-3xl p-8 md:p-10 shadow-[0_24px_60px_rgba(0,0,0,0.03),0_4px_16px_rgba(0,0,0,0.02)] relative overflow-hidden hover:[transform:translateY(-2px)] transition-all duration-300 z-10">
        
        {/* Header Section with Brand Logo */}
        <div className="flex flex-col items-center text-center space-y-4 mb-8">
          <div className="p-3 bg-[#0A66C2]/10 text-[#0A66C2] rounded-2xl border border-[#0A66C2]/15 shadow-sm">
            <PenTool size={26} className="stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-slate-800">
              {title}
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Form Container */}
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
              <div className="relative rounded-xl border border-slate-200 bg-slate-50/50 focus-within:bg-white focus-within:border-[#0A66C2] focus-within:ring-4 focus-within:ring-[#0A66C2]/10 transition-all duration-200">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4.5 w-4.5 text-slate-400" />
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
            <div className="relative rounded-xl border border-slate-200 bg-slate-50/50 focus-within:bg-white focus-within:border-[#0A66C2] focus-within:ring-4 focus-within:ring-[#0A66C2]/10 transition-all duration-200">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-4.5 w-4.5 text-slate-400" />
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
              <div className="relative rounded-xl border border-slate-200 bg-slate-50/50 focus-within:bg-white focus-within:border-[#0A66C2] focus-within:ring-4 focus-within:ring-[#0A66C2]/10 transition-all duration-200">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4.5 w-4.5 text-slate-400" />
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
              <div className="relative rounded-xl border border-slate-200 bg-slate-50/50 focus-within:bg-white focus-within:border-[#0A66C2] focus-within:ring-4 focus-within:ring-[#0A66C2]/10 transition-all duration-200">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Key className="h-4.5 w-4.5 text-slate-400" />
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
              <div className="relative rounded-xl border border-slate-200 bg-slate-50/50 focus-within:bg-white focus-within:border-[#0A66C2] focus-within:ring-4 focus-within:ring-[#0A66C2]/10 transition-all duration-200">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4.5 w-4.5 text-slate-400" />
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
      </div>
    </div>
  );
}
