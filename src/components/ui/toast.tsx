"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSync } from "@/context/SyncContext";
import { Sparkles, CheckCircle2, AlertCircle, X } from "lucide-react";

export function ToastContainer() {
  const { toasts, dismissToast } = useSync();

  return (
    <aside aria-label="Notifications" className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-[#161618] border border-white/10 shadow-2xl backdrop-blur-lg"
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === "xp" && (
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white border border-white/15">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}
              {toast.type === "success" && (
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              {toast.type === "error" && (
                <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
                  <AlertCircle className="w-4 h-4" />
                </div>
              )}
              {(!toast.type || toast.type === "default") && (
                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-zinc-300 border border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-white tracking-tight">
                  {toast.title}
                </h4>
                {toast.xp && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white font-mono font-medium">
                    +{toast.xp} XP
                  </span>
                )}
              </div>
              {toast.description && (
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                  {toast.description}
                </p>
              )}
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 p-1 text-zinc-500 hover:text-white rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </aside>
  );
}
