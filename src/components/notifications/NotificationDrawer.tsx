"use client";

import React, { useState } from "react";
import { useSync } from "@/context/SyncContext";
import {
  X,
  Bell,
  Check,
  Calendar,
  Trophy,
  Sparkles,
  Users,
  CheckCheck,
} from "lucide-react";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    addToast,
  } = useSync();

  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [pushEnabled, setPushEnabled] = useState(false);

  if (!isOpen) return null;

  const filtered =
    activeTab === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  const handleEnablePush = () => {
    setPushEnabled(true);
    addToast({
      title: "Browser Push Enabled",
      description: "You'll now receive timely squad task and rank alerts.",
      type: "success",
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "task_reminder":
        return <Calendar className="w-4 h-4 text-amber-400" />;
      case "squad_completion":
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case "challenge_update":
        return <Trophy className="w-4 h-4 text-sky-400" />;
      case "rank_change":
        return <Trophy className="w-4 h-4 text-purple-400" />;
      default:
        return <Users className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md h-full bg-[#111111] border-l border-white/10 shadow-2xl p-6 flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-white" />
            <h3 className="text-base font-semibold tracking-tight">
              Notifications
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Push Notification Opt-in Banner */}
        {!pushEnabled && (
          <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Enable Push Notifications</span>
            </div>
            <button
              onClick={handleEnablePush}
              className="px-2.5 py-1 rounded-lg bg-white text-black font-medium hover:bg-zinc-200 transition-colors text-[11px]"
            >
              Enable
            </button>
          </div>
        )}

        {/* Tabs & Mark Read */}
        <div className="flex items-center justify-between mt-4 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeTab === "all"
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab("unread")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeTab === "unread"
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Unread ({notifications.filter((n) => !n.read).length})
            </button>
          </div>

          <button
            onClick={markAllNotificationsRead}
            className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5 mt-2 pr-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-zinc-500 text-xs">
              <Bell className="w-6 h-6 mb-2 opacity-40" />
              <span>No notifications in this view.</span>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`py-3.5 px-2.5 flex items-start gap-3 rounded-xl transition-colors ${
                  !item.read ? "bg-white/[0.03]" : ""
                }`}
              >
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 mt-0.5 shrink-0">
                  {getIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="text-xs font-semibold text-white truncate">
                      {item.title}
                    </h5>
                    <span className="text-[10px] text-zinc-500 shrink-0">
                      {item.createdAt}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                    {item.message}
                  </p>
                </div>

                {!item.read && (
                  <button
                    onClick={() => markNotificationRead(item.id)}
                    className="p-1 text-zinc-500 hover:text-white rounded"
                    title="Mark read"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
