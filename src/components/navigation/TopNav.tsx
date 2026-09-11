"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSync } from "@/context/SyncContext";
import { useMusicMeet } from "@/context/MusicMeetContext";
import {
  Bell,
  Code2,
  GitCommit,
  Users,
  ChevronDown,
  Sparkles,
  Plus,
  Compass,
  LogOut,
  User,
  Settings,
} from "lucide-react";

interface TopNavProps {
  onOpenNotifications: () => void;
  onOpenNewTask: () => void;
  onOpenOnboarding: () => void;
  onOpenGroupSettings: () => void;
}

export function TopNav({
  onOpenNotifications,
  onOpenNewTask,
  onOpenOnboarding,
  onOpenGroupSettings,
}: TopNavProps) {
  const pathname = usePathname();
  const {
    currentUser,
    currentGroup,
    allUsers,
    logout,
    notifications,
  } = useSync();

  const { focusRoom } = useMusicMeet();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const navLinks = [
    { label: "Dashboard", href: "/" },
    { label: "Schedule", href: "/schedule" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "Friends", href: "/friends" },
    { label: "Analytics", href: "/analytics" },
    { label: "Challenges", href: "/challenges" },
    {
      label: "Focus Room",
      href: "/room",
      badge: focusRoom.activeMemberIds.length > 0 ? `${focusRoom.activeMemberIds.length}` : undefined,
    },
    { label: "Settings", href: "/settings" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-6">
        {/* Left: Brand & Squad Pill */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center font-bold text-black text-xs tracking-tight transition-transform group-hover:scale-105 shadow-sm">
              S
            </div>
            <span className="font-semibold tracking-wider text-sm text-white">
              SYNC
            </span>
          </Link>

          <button
            onClick={onOpenGroupSettings}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-zinc-300 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="font-medium text-white">{currentGroup.name}</span>
          </button>
        </div>

        {/* Center: Simplified Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-tight transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? "text-white bg-white/10"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-2">
          {/* Quick Schedule Button */}
          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-semibold transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Task</span>
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white" />
            )}
          </button>

          {/* User Switcher / Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1.5 p-1 rounded-full hover:bg-white/5 transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName}
                className="w-7 h-7 rounded-full object-cover border border-white/20"
              />
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#161618] border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                {/* User Header */}
                <div className="px-3 py-2 border-b border-white/5 mb-1.5">
                  <div className="text-xs font-semibold text-white">
                    {currentUser.displayName}
                  </div>
                  <div className="text-[11px] text-zinc-400 flex items-center justify-between mt-0.5">
                    <span>@{currentUser.username}</span>
                    <span className="font-mono text-white font-medium">
                      {currentUser.totalXP.toLocaleString()} XP
                    </span>
                  </div>
                </div>

                {/* Settings & Tour */}
                <div className="border-t border-white/5 mt-1 pt-1.5 space-y-1">
                  <div className="px-3 py-1 text-[11px] text-zinc-500 truncate">
                    {currentUser.email}
                  </div>
                  <Link
                    href="/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-amber-400" />
                    <span>Settings & Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      onOpenOnboarding();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>View Onboarding Tour</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenGroupSettings();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Squad Settings</span>
                  </button>
                  <button
                    onClick={async () => {
                      setIsUserMenuOpen(false);
                      await logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
