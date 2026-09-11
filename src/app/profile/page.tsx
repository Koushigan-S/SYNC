"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSync } from "@/context/SyncContext";
import { getLevelProgress } from "@/lib/constants";
import { TiltCard } from "@/components/ui/TiltCard";
import { fetchGitHubStats, fetchLeetCodeStats } from "@/lib/services/sync-service";
import {
  User,
  Code2,
  GitCommit,
  Flame,
  Trophy,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Save,
  Copy,
  Check,
  Bell,
  Globe,
  Clock,
  Shield,
  LogOut,
  ChevronRight,
  Zap,
  Layers,
  ArrowUpRight,
  Sliders,
} from "lucide-react";

function GithubIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function ProfilePage() {
  const {
    currentUser,
    currentGroup,
    updateProfile,
    logout,
    addToast,
    tasks,
    participants,
  } = useSync();

  const [activeTab, setActiveTab] = useState<"sync" | "profile" | "squad">("sync");

  // Profile Edit State
  const [displayName, setDisplayName] = useState(currentUser.displayName || "");
  const [username, setUsername] = useState(currentUser.username || "");
  const [bio, setBio] = useState(currentUser.bio || "");
  const [timezone, setTimezone] = useState(
    currentUser.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York"
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Sync Accounts State
  const [githubInput, setGithubInput] = useState(
    currentUser.githubStats?.username || currentUser.githubUsername || ""
  );
  const [leetcodeInput, setLeetcodeInput] = useState(
    currentUser.leetcodeStats?.username || currentUser.leetcodeUsername || ""
  );
  const [isSyncingGithub, setIsSyncingGithub] = useState(false);
  const [isSyncingLeetcode, setIsSyncingLeetcode] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Keep local form in sync with remote user profile
  useEffect(() => {
    setDisplayName(currentUser.displayName || "");
    setUsername(currentUser.username || "");
    setBio(currentUser.bio || "");
    setTimezone(currentUser.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York");
    if (currentUser.githubUsername || currentUser.githubStats?.username) {
      setGithubInput(currentUser.githubStats?.username || currentUser.githubUsername || "");
    }
    if (currentUser.leetcodeUsername || currentUser.leetcodeStats?.username) {
      setLeetcodeInput(currentUser.leetcodeStats?.username || currentUser.leetcodeUsername || "");
    }
  }, [currentUser]);

  // Tasks completed by current user
  const userCompletedTasksCount = tasks.filter(
    (t) =>
      t.assignedParticipantIds?.includes(currentUser.id) &&
      participants.some((p) => p.taskId === t.id && p.userId === currentUser.id && p.completed)
  ).length;

  const levelInfo = getLevelProgress(currentUser.totalXP);

  // Save Profile Details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateProfile({
        displayName: displayName.trim() || currentUser.displayName,
        username: username.toLowerCase().replace(/[^a-z0-9_]/g, "") || currentUser.username,
        bio: bio.trim(),
        timezone,
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Sync GitHub
  const handleSyncGithub = async () => {
    const trimmed = githubInput.trim();
    if (!trimmed) {
      addToast({
        title: "Username required",
        description: "Please enter your GitHub username or profile link.",
        type: "default",
      });
      return;
    }

    setIsSyncingGithub(true);
    try {
      const stats = await fetchGitHubStats(trimmed);

      await updateProfile({
        githubUsername: stats.username,
        githubStats: stats,
        lastSyncedAt: new Date().toISOString(),
      });

      addToast({
        title: "GitHub synced! 🐙",
        description: `Successfully loaded @${stats.username} with ${stats.publicRepos || 0} public repos.`,
        type: "success",
      });
    } catch (err: any) {
      console.error(err);
      addToast({
        title: "GitHub sync failed",
        description: err.message || "Could not fetch GitHub profile.",
        type: "error",
      });
    } finally {
      setIsSyncingGithub(false);
    }
  };

  // Sync LeetCode
  const handleSyncLeetcode = async () => {
    const trimmed = leetcodeInput.trim();
    if (!trimmed) {
      addToast({
        title: "Username required",
        description: "Please enter your LeetCode username or profile link.",
        type: "default",
      });
      return;
    }

    setIsSyncingLeetcode(true);
    try {
      const stats = await fetchLeetCodeStats(trimmed);

      await updateProfile({
        leetcodeUsername: stats.username,
        leetcodeStats: stats,
        lastSyncedAt: new Date().toISOString(),
      });

      addToast({
        title: "LeetCode synced! ⚡",
        description: `Loaded ${stats.totalSolved} problems solved for @${stats.username}.`,
        type: "success",
      });
    } catch (err: any) {
      console.error(err);
      addToast({
        title: "LeetCode sync failed",
        description: err.message || "Could not fetch LeetCode profile.",
        type: "error",
      });
    } finally {
      setIsSyncingLeetcode(false);
    }
  };

  // Sync Both
  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      await Promise.all([
        githubInput.trim() ? handleSyncGithub() : Promise.resolve(),
        leetcodeInput.trim() ? handleSyncLeetcode() : Promise.resolve(),
      ]);
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Copy Squad Invite Code
  const handleCopyInvite = () => {
    if (!currentGroup.inviteCode) return;
    navigator.clipboard.writeText(currentGroup.inviteCode);
    setCopiedInvite(true);
    addToast({
      title: "Invite code copied!",
      description: `Share "${currentGroup.inviteCode}" with your squad members.`,
      type: "success",
    });
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* 1. Profile Hero Card */}
      <div className="surface-card p-6 sm:p-8 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-white/10 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white/20 shadow-xl"
              />
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-white text-black text-[10px] font-mono font-bold shadow-md">
                Lvl {levelInfo.currentLevel}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {currentUser.displayName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-xs font-mono text-zinc-300">
                  @{currentUser.username}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {currentGroup.name}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-zinc-400 max-w-lg">
                {currentUser.bio || "Full-stack developer building with SYNC co-working squad."}
              </p>

              <div className="flex items-center gap-4 text-xs text-zinc-400 pt-1 font-mono">
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-zinc-500" />
                  {timezone}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  Member since {new Date(currentUser.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 shrink-0">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-zinc-400 font-medium block uppercase tracking-wider">
                Total XP
              </span>
              <span className="text-lg sm:text-xl font-mono font-bold text-white">
                {currentUser.totalXP.toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-zinc-400 font-medium block uppercase tracking-wider">
                Streak
              </span>
              <span className="text-lg sm:text-xl font-mono font-bold text-amber-400 flex items-center justify-center gap-1">
                <Flame className="w-4 h-4" />
                {currentUser.streak.current}d
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-zinc-400 font-medium block uppercase tracking-wider">
                Tasks Done
              </span>
              <span className="text-lg sm:text-xl font-mono font-bold text-emerald-400">
                {userCompletedTasksCount}
              </span>
            </div>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Level {levelInfo.currentLevel} Progress
            </span>
            <span className="font-mono text-zinc-300">
              {levelInfo.currentLevelXP.toLocaleString()} / {levelInfo.nextLevelXP.toLocaleString()} XP
              <span className="text-zinc-400 ml-1.5 font-sans">({levelInfo.percentage}%)</span>
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-white transition-all duration-500 rounded-full"
              style={{ width: `${levelInfo.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("sync")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "sync"
              ? "bg-white text-black shadow-lg"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Stats Sync (GitHub & LeetCode)</span>
          {(currentUser.githubStats || currentUser.leetcodeStats) && (
            <span className={`w-1.5 h-1.5 rounded-full ${activeTab === "sync" ? "bg-emerald-600" : "bg-emerald-400"}`} />
          )}
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "profile"
              ? "bg-white text-black shadow-lg"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile & Identity</span>
        </button>

        <button
          onClick={() => setActiveTab("squad")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "squad"
              ? "bg-white text-black shadow-lg"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Squad & Preferences</span>
        </button>
      </div>

      {/* 3. TAB 1: GitHub & LeetCode Stats Sync (Core Requirement) */}
      {activeTab === "sync" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Developer Integration & Real-Time Stats
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Link your profiles to import verified commit streaks and problem matrices directly into your squad profile.
              </p>
            </div>

            <button
              onClick={handleSyncAll}
              disabled={isSyncingAll || isSyncingGithub || isSyncingLeetcode}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white text-zinc-200 hover:text-black text-xs font-semibold transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? "animate-spin" : ""}`} />
              <span>{isSyncingAll ? "Syncing All..." : "Sync All Platforms"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* GitHub Card */}
            <TiltCard className="surface-card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white">
                    <GithubIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">GitHub Account</h3>
                    <p className="text-[11px] text-zinc-400">Repositories, commits & contribution streak</p>
                  </div>
                </div>

                {currentUser.githubStats ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-mono">
                    Not Linked
                  </span>
                )}
              </div>

              {/* Input Form */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-300 block">
                  GitHub Username or Profile URL
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500">
                      github.com/
                    </span>
                    <input
                      type="text"
                      value={githubInput}
                      onChange={(e) => setGithubInput(e.target.value)}
                      placeholder="username or full URL"
                      className="w-full pl-24 pr-3 py-2 rounded-xl bg-[#1c1c1e] border border-white/10 text-xs text-white focus:outline-none focus:border-white/30 transition-colors font-mono"
                    />
                  </div>

                  <button
                    onClick={handleSyncGithub}
                    disabled={isSyncingGithub}
                    className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGithub ? "animate-spin" : ""}`} />
                    <span>{isSyncingGithub ? "Syncing..." : "Sync Stats"}</span>
                  </button>
                </div>
              </div>

              {/* GitHub Stats Live Display */}
              {currentUser.githubStats ? (
                <div className="space-y-4 pt-3 border-t border-white/10">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] text-zinc-500 uppercase block">Public Repos</span>
                      <span className="text-sm font-mono font-bold text-white">
                        {currentUser.githubStats.publicRepos}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] text-zinc-500 uppercase block">Followers</span>
                      <span className="text-sm font-mono font-bold text-white">
                        {currentUser.githubStats.followers}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] text-zinc-500 uppercase block">Contributions</span>
                      <span className="text-sm font-mono font-bold text-emerald-400">
                        {currentUser.githubStats.totalContributions}
                      </span>
                    </div>
                  </div>

                  {/* Recent Commits */}
                  {currentUser.githubStats.recentCommits && currentUser.githubStats.recentCommits.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] text-zinc-400 font-medium block">
                        Recent Verified Commits
                      </span>
                      <div className="space-y-1.5 text-xs">
                        {currentUser.githubStats.recentCommits.slice(0, 3).map((c, i) => (
                          <div
                            key={i}
                            className="p-2 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between text-zinc-300"
                          >
                            <div className="truncate pr-2">
                              <span className="font-mono text-zinc-500 text-[10px] block">
                                {c.repo}
                              </span>
                              <span className="text-white text-xs truncate block">{c.message}</span>
                            </div>
                            <span className="text-[10px] text-zinc-500 shrink-0 font-mono">
                              {c.timestamp}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Last synced: {new Date(currentUser.githubStats.lastUpdated || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <a
                      href={`https://github.com/${currentUser.githubStats.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <span>View GitHub Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white/5 border border-dashed border-white/10 text-center text-xs text-zinc-400">
                  Add your GitHub handle above and click &quot;Sync Stats&quot; to import your contributions into SYNC.
                </div>
              )}
            </TiltCard>

            {/* LeetCode Card */}
            <TiltCard className="surface-card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">LeetCode Account</h3>
                    <p className="text-[11px] text-zinc-400">Solved problems, difficulty matrix & global ranking</p>
                  </div>
                </div>

                {currentUser.leetcodeStats ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-mono">
                    Not Linked
                  </span>
                )}
              </div>

              {/* Input Form */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-300 block">
                  LeetCode Username or Profile URL
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500">
                      leetcode.com/u/
                    </span>
                    <input
                      type="text"
                      value={leetcodeInput}
                      onChange={(e) => setLeetcodeInput(e.target.value)}
                      placeholder="username or full URL"
                      className="w-full pl-28 pr-3 py-2 rounded-xl bg-[#1c1c1e] border border-white/10 text-xs text-white focus:outline-none focus:border-white/30 transition-colors font-mono"
                    />
                  </div>

                  <button
                    onClick={handleSyncLeetcode}
                    disabled={isSyncingLeetcode}
                    className="px-4 py-2 rounded-xl bg-amber-400 text-black hover:bg-amber-300 text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLeetcode ? "animate-spin" : ""}`} />
                    <span>{isSyncingLeetcode ? "Syncing..." : "Sync Stats"}</span>
                  </button>
                </div>
              </div>

              {/* LeetCode Stats Live Display */}
              {currentUser.leetcodeStats ? (
                <div className="space-y-4 pt-3 border-t border-white/10">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] text-zinc-500 uppercase block">Total Solved</span>
                      <span className="text-sm font-mono font-bold text-white">
                        {currentUser.leetcodeStats.totalSolved}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-[10px] text-emerald-400 uppercase block font-semibold">Easy</span>
                      <span className="text-sm font-mono font-bold text-white">
                        {currentUser.leetcodeStats.easy}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <span className="text-[10px] text-amber-400 uppercase block font-semibold">Med</span>
                      <span className="text-sm font-mono font-bold text-white">
                        {currentUser.leetcodeStats.medium}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                      <span className="text-[10px] text-rose-400 uppercase block font-semibold">Hard</span>
                      <span className="text-sm font-mono font-bold text-white">
                        {currentUser.leetcodeStats.hard}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400">Global Ranking:</span>
                    <span className="text-white font-bold">
                      #{currentUser.leetcodeStats.ranking?.toLocaleString() || "Top 50k"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Last synced: {new Date(currentUser.leetcodeStats.lastUpdated || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <a
                      href={`https://leetcode.com/u/${currentUser.leetcodeStats.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <span>View LeetCode Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white/5 border border-dashed border-white/10 text-center text-xs text-zinc-400">
                  Add your LeetCode username above and click &quot;Sync Stats&quot; to import your algorithmic problems matrix.
                </div>
              )}
            </TiltCard>
          </div>
        </div>
      )}

      {/* 4. TAB 2: Profile & Identity */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="surface-card p-6 sm:p-8 space-y-6 max-w-2xl">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Edit Profile & Information
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Update how your name, handle, and avatar are displayed to your squad peers.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c1e] border border-white/10 text-xs text-white focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Username Handle
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  required
                  className="w-full pl-8 pr-3.5 py-2 rounded-xl bg-[#1c1c1e] border border-white/10 text-xs text-white focus:outline-none focus:border-white/30 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Bio & Focus Statement
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="What are you currently building or learning?"
                className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c1e] border border-white/10 text-xs text-white focus:outline-none focus:border-white/30 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c1e] border border-white/10 text-xs text-white focus:outline-none focus:border-white/30"
              >
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Chicago">America/Chicago (CST)</option>
                <option value="America/Denver">America/Denver (MST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                <option value="UTC">UTC Universal</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Google Account Email
              </label>
              <input
                type="email"
                value={currentUser.email}
                disabled
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/5 text-xs text-zinc-500 font-mono cursor-not-allowed"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Authenticated securely via Google Identity.
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-5 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingProfile ? "Saving Changes..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      )}

      {/* 5. TAB 3: Squad & Preferences */}
      {activeTab === "squad" && (
        <div className="surface-card p-6 sm:p-8 space-y-6 max-w-2xl">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Squad Membership & Preferences
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Manage your squad connectivity, invite squadmates, and security session.
            </p>
          </div>

          {/* Squad Details Card */}
          <div className="p-4 rounded-2xl bg-[#161618] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">
                  Active Squad
                </span>
                <span className="text-sm font-bold text-white">
                  {currentGroup.name}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono text-zinc-300">
                {currentGroup.memberCount || 1} members
              </span>
            </div>

            <p className="text-xs text-zinc-400">
              {currentGroup.description || "Private engineering progress squad."}
            </p>

            {/* Invite Code */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">
                  Squad Invite Code
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  {currentGroup.inviteCode || "SYNC-FOUNDERS-2026"}
                </span>
              </div>

              <button
                onClick={handleCopyInvite}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white text-zinc-200 hover:text-black text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                {copiedInvite ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Session & Sign Out */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-white block">
                Active Google Session
              </span>
              <span className="text-[11px] text-zinc-400">
                Logged in as {currentUser.email}
              </span>
            </div>

            <button
              onClick={async () => {
                await logout();
              }}
              className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-semibold transition-colors flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
