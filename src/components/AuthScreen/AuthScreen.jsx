"use client";

import { useState, useEffect } from "react";
import { Lock, Mail, User, Eye, EyeOff, PenTool, Key } from "lucide-react";

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
            width: googleBtn.clientWidth || 382,
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
          subtitle: "Start generating high-quality developer content",
        };
      case "forgot":
        return {
          title: "Reset password",
          subtitle: "Enter your email to receive a recovery code",
        };
      case "reset":
        return {
          title: "Verify reset code",
          subtitle: "Check your server terminal console for the 6-digit code",
        };
      case "login":
      default:
        return {
          title: "Welcome back",
          subtitle: "Access your personalized post generator",
        };
    }
  };

  const { title, subtitle } = getHeaderInfo();

  const content = (
    <div className="w-full font-sans text-left">
      <div className="text-center">
        <div className="flex justify-center items-center">
          <div className="p-3.5 bg-blue-500/10 text-blue-600 rounded-2xl border border-blue-500/20 shadow-md shadow-blue-500/5">
            <PenTool size={32} className="stroke-[2.5]" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold tracking-tight text-gray-900">
          {title}
        </h2>
        <p className="mt-1 text-center text-xs text-gray-500">
          {subtitle}
        </p>
      </div>

      <div className="mt-6 text-left">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* SUCCESS NOTIFICATION */}
          {success && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-2.5 text-xs text-green-700 font-medium">
              {success}
            </div>
          )}

          {/* SIGNUP: Name field */}
          {mode === "signup" && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Full Name
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 bg-white/75 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  placeholder="Chandan Kushwaha"
                />
              </div>
            </div>
          )}

          {/* EMAIL field (applicable for Login, Signup, Forgot, Reset) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Email Address
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="email"
                required
                disabled={mode === "reset"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 bg-white/75 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="name@example.com"
              />
            </div>
          </div>

          {/* LOGIN / SIGNUP: Password field */}
          {(mode === "login" || mode === "signup") && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">
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
                    className="text-xs font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 bg-white/75 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {/* RESET: Verification Code field */}
          {mode === "reset" && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Verification Code (6-digit)
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="block w-full pl-10 pr-3 py-2 bg-white/75 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 tracking-widest font-mono"
                  placeholder="123456"
                />
              </div>
            </div>
          )}

          {/* RESET: New Password field */}
          {mode === "reset" && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                New Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 bg-white/75 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {/* ERROR NOTIFICATION */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : mode === "login" ? (
                "Sign In"
              ) : mode === "signup" ? (
                "Create Account"
              ) : mode === "forgot" ? (
                "Send Verification Code"
              ) : (
                "Reset Password"
              )}
            </button>
          </div>
        </form>

        {/* OR DIVIDER & GOOGLE SIGN IN */}
        {(mode === "login" || mode === "signup") && (
          <div className="space-y-4 pt-4">
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Or</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>
            <div id="google-signin-btn" className="w-full flex justify-center min-h-[44px]" />
          </div>
        )}

        {/* BOTTOM LINKS */}
        <div className="mt-4 border-t border-gray-200 pt-4 text-center">
          {mode === "login" && (
            <button
              onClick={() => {
                setMode("signup");
                setError("");
                setSuccess("");
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-500 transition-colors"
            >
              Don't have an account? Sign up
            </button>
          )}

          {mode === "signup" && (
            <button
              onClick={() => {
                setMode("login");
                setError("");
                setSuccess("");
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-500 transition-colors"
            >
              Already have an account? Sign in
            </button>
          )}

          {(mode === "forgot" || mode === "reset") && (
            <button
              onClick={() => {
                setMode("login");
                setError("");
                setSuccess("");
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-500 transition-colors"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return content;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Decorative background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white/80 backdrop-blur-xl py-8 px-4 shadow-2xl rounded-2xl sm:px-10 border border-white">
          {content}
        </div>
      </div>
    </div>
  );
}
