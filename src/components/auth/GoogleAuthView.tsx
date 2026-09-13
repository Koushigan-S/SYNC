"use client";

import React, { useState } from "react";
import { useSync } from "@/context/SyncContext";
import {
  Sparkles,
  Users,
  Video,
  Headphones,
  Trophy,
  ShieldCheck,
  ArrowRight,
  Flame,
  CheckCircle2,
} from "lucide-react";

export function GoogleAuthView() {
  const { loginWithGoogle } = useSync();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await loginWithGoogle();
    } catch (error: unknown) {
      console.error("Google Sign-In failed:", error);
      const err = error as { code?: string; message?: string };
      if (err?.code === "auth/popup-closed-by-user") {
        setErrorMsg("Sign-in window closed. Please try again.");
      } else if (err?.code === "auth/unauthorized-domain") {
        setErrorMsg(
          "Current domain is not authorized in Firebase Console. Add 'localhost' to Authorized Domains in Authentication -> Settings."
        );
      } else {
        setErrorMsg(err?.message || "Failed to sign in with Google. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full">
        <div className="surface-card p-8 sm:p-10 border-white/15 backdrop-blur-2xl shadow-[0_24px_60px_rgba(0,0,0,0.8)] text-center space-y-7">
          {/* Logo & Brand Pill */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon.png"
                alt="SYNC"
                className="w-20 h-20 object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-semibold mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Private Progress Network
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Welcome to SYNC
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 leading-relaxed">
                Connect your squad, sync real-time schedules, work to shared squad focus beats, and hop on Google Meet.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-left leading-relaxed">
              {errorMsg}
            </div>
          )}

          {/* Primary Action: Google Sign In Only */}
          <div className="space-y-3 pt-1">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-zinc-100 active:scale-[0.98] text-black font-semibold text-sm transition-all shadow-lg shadow-white/10 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {/* Google SVG Logo */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Google OAuth2 Authentication</span>
            </div>
          </div>

          {/* Squad Highlights Grid */}
          <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-2.5 text-left">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <div className="text-emerald-400 mb-1">
                <Video className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-white">Focus Lounge</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                Google Meet co-working with live Pomodoro.
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <div className="text-purple-400 mb-1">
                <Headphones className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-white">Music Lounge</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                Squad listening parties & live co-listening.
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <div className="text-amber-400 mb-1">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-white">XP & Ranks</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                Real-time leaderboard & level progression.
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <div className="text-blue-400 mb-1">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-white">Shared Tasks</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                Real-time squad calendar & deadlines.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
