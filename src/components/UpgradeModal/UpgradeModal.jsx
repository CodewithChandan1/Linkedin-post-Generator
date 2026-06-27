"use client";

import { useState } from "react";
import { X, Check, ShieldCheck, Sparkles, Zap, Lock } from "lucide-react";

export default function UpgradeModal({ isOpen, onClose, onUpgradeSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async () => {
    setLoading(true);
    setError("");

    try {
      // 1. Load Razorpay Script
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error("Failed to load Razorpay SDK. Please check your internet connection.");
      }

      // 2. Create Order
      const orderRes = await fetch("/api/payment/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to initiate payment");
      }

      if (orderData.mock) {
        // Handle local mock upgrade flow
        console.log("🛠️ Processing Mock Upgrade Flow...");
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate processing

        const verifyRes = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: orderData.orderId,
            mock: true,
          }),
        });

        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) {
          throw new Error(verifyData.error || "Mock verification failed");
        }

        setSuccess(true);
        setTimeout(() => {
          onUpgradeSuccess();
          onClose();
        }, 2000);
        return;
      }

      // 3. Open Razorpay Checkout for Real Payment
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "DevPost AI",
        description: "Upgrade to Pro Creator Plan",
        order_id: orderData.orderId,
        handler: async function (response) {
          setLoading(true);
          try {
            // Verify payment on server
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: orderData.orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                mock: false,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || "Payment verification failed");
            }

            setSuccess(true);
            setTimeout(() => {
              onUpgradeSuccess();
              onClose();
            }, 2500);
          } catch (err) {
            setError(err.message);
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: "",
          email: "",
        },
        theme: {
          color: "#2563EB", // Primary theme color
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[4px] overflow-y-auto font-sans">
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl border border-white rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        {/* Close Button */}
        {!success && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        )}

        {success ? (
          <div className="py-8 text-center flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-green-500/10 text-green-600 rounded-full border border-green-500/20 shadow-lg shadow-green-500/5 animate-bounce">
              <ShieldCheck size={56} className="stroke-[2.5]" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Upgrade Successful!</h2>
            <p className="text-sm text-gray-500 max-w-xs">
              Welcome to the Pro family. Your account is now upgraded and all features are unlocked.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-600 rounded-full border border-blue-500/20 shadow-sm text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles size={12} className="fill-blue-600/10" />
                Go Pro
              </div>
              <h2 className="text-2xl font-black tracking-tight text-gray-900">Unlock Pro Creator Plan</h2>
              <p className="text-sm text-gray-500 mt-1">
                Supercharge your LinkedIn growth with unlimited AI capabilities.
              </p>
            </div>

            {/* Price Box */}
            <div className="bg-gradient-to-tr from-blue-50 to-indigo-50/50 rounded-2xl p-6 border border-blue-100 flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-blue-500/5 blur-2xl pointer-events-none" />
              <div>
                <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider block">PRO CREATOR</span>
                <span className="text-3xl font-black text-gray-900 mt-1 block">
                  $19<span className="text-sm font-semibold text-gray-500">/month</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-gray-400 block line-through">$39/mo</span>
                <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full inline-block mt-1">
                  Save 50%
                </span>
              </div>
            </div>

            {/* Feature List */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2">Included Features:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <div className="p-0.5 bg-blue-500/10 rounded text-blue-600 mt-0.5">
                    <Check size={14} className="stroke-[3]" />
                  </div>
                  <span>Unlimited AI generations</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="p-0.5 bg-blue-500/10 rounded text-blue-600 mt-0.5">
                    <Check size={14} className="stroke-[3]" />
                  </div>
                  <span>Direct Scheduling & Publishing</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="p-0.5 bg-blue-500/10 rounded text-blue-600 mt-0.5">
                    <Check size={14} className="stroke-[3]" />
                  </div>
                  <span>Premium PDF Carousel Export</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="p-0.5 bg-blue-500/10 rounded text-blue-600 mt-0.5">
                    <Check size={14} className="stroke-[3]" />
                  </div>
                  <span>Unlimited Strategic Comments</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="p-0.5 bg-blue-500/10 rounded text-blue-600 mt-0.5">
                    <Check size={14} className="stroke-[3]" />
                  </div>
                  <span>Advanced Topic DNA Analytics</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="p-0.5 bg-blue-500/10 rounded text-blue-600 mt-0.5">
                    <Check size={14} className="stroke-[3]" />
                  </div>
                  <span>Priority Server Processing</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600 font-semibold">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-500/15 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing Payment...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap size={16} className="fill-white" />
                    Upgrade to Pro Now
                  </span>
                )}
              </button>
              <div className="flex justify-center items-center gap-1.5 text-xs text-gray-400">
                <Lock size={12} />
                <span>Secured by Razorpay • Cancel anytime</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
