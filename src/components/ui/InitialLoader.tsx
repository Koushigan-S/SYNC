"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function InitialLoader() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 3 second timer
    const duration = 3000;
    const intervalTime = 30;
    const step = 100 / (duration / intervalTime);

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    const timer = setTimeout(() => {
      setLoading(false);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          key="initial-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 bg-black flex flex-col justify-between items-center p-8 select-none pointer-events-auto"
        >
          {/* Top spacer */}
          <div className="w-full flex justify-between items-center text-[10px] text-zinc-600 font-mono tracking-widest uppercase">
            <span>SYNC // OS</span>
            <span>SYSTEM v2.6.0</span>
          </div>

          {/* Middle: Rotating Circular Web Name + Center Monogram + Tagline */}
          <div className="flex flex-col items-center justify-center text-center my-auto">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
              {/* Rotating Circular Text SVG */}
              <svg
                viewBox="0 0 200 200"
                className="absolute inset-0 w-full h-full animate-spin-slow text-white"
              >
                <defs>
                  <path
                    id="circlePath"
                    d="M 100, 100 m -70, 0 a 70,70 0 1,1 140,0 a 70,70 0 1,1 -140,0"
                  />
                </defs>
                <text
                  fill="currentColor"
                  fontSize="10.5"
                  fontWeight="600"
                  letterSpacing="3.5"
                  className="uppercase tracking-[0.28em] fill-zinc-300"
                >
                  <textPath href="#circlePath" startOffset="0%">
                    • SYNC • PROGRESS NETWORK • SYNC • PROGRESS NETWORK
                  </textPath>
                </text>
              </svg>

              {/* Inner Pulsing Core */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: [0.9, 1.05, 0.9], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#111111] border border-white/20 flex items-center justify-center shadow-2xl backdrop-blur-xl relative overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icon.png"
                  alt="SYNC"
                  className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                />
                <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
              </motion.div>
            </div>

            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="mt-8 space-y-1.5"
            >
              <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-white">
                SYNC
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-serif italic tracking-wide">
                “Progress is better together.”
              </p>
            </motion.div>
          </div>

          {/* Bottom: Loading Bar & Status */}
          <div className="w-full max-w-md space-y-2 pb-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span className="tracking-widest">INITIALIZING NETWORK</span>
              <span>{Math.round(progress)}%</span>
            </div>

            {/* Continuous 3-second Loading Bar */}
            <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden relative">
              <div
                className="h-full bg-white transition-all ease-out duration-75 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
