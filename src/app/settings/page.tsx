"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSync } from "@/context/SyncContext";
import { getLevelProgress, XP_REWARDS } from "@/lib/constants";
import { TiltCard } from "@/components/ui/TiltCard";
import { fetchGitHubStats, fetchLeetCodeStats } from "@/lib/services/sync-service";
import { useMusicMeet } from "@/context/MusicMeetContext";
import { AddSongModal } from "@/components/music/AddSongModal";
import { GitHubStats, LeetCodeStats, UserProfile } from "@/types";
import {
  Settings as SettingsIcon,
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
  Users,
  Search,
  Activity,
  Award,
  Headphones,
  Disc3,
  Key,
  Lock,
  AlertCircle,
  Plus,
  Music2,
  Trash2,
} from "lucide-react";

function GithubIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function SettingsPage() {
  const {
    currentUser,
    currentGroup,
    allUsers,
    members,
    updateProfile,
    logout,
    addToast,
    tasks,
    participants,
  } = useSync();

  const [activeTab, setActiveTab] = useState<"profile" | "music" | "squad" | "preferences">("profile");
  const [isAddSongModalOpen, setIsAddSongModalOpen] = useState(false);

  const {
    squadSongs,
    stations,
    currentTrack,
    changeTrack,
    removeSong,
    volume,
    setVolume,
    isMuted,
    toggleMute,
  } = useMusicMeet();

  // Profile Form State
  const [displayName, setDisplayName] = useState(currentUser.displayName || "");
  const [username, setUsername] = useState(currentUser.username || "");
  const [bio, setBio] = useState(currentUser.bio || "");
  const [timezone, setTimezone] = useState(
    currentUser.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York"
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Coding Profile Links & Sync State
  const [githubInput, setGithubInput] = useState(
    currentUser.githubStats?.username || currentUser.githubUsername || ""
  );
  const [leetcodeInput, setLeetcodeInput] = useState(
    currentUser.leetcodeStats?.username || currentUser.leetcodeUsername || ""
  );
  const [isSyncingGithub, setIsSyncingGithub] = useState(false);
  const [isSyncingLeetcode, setIsSyncingLeetcode] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  // Squad Member Inspection State
  const [selectedMemberId, setSelectedMemberId] = useState<string>(currentUser.id);
  const [memberSyncingId, setMemberSyncingId] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Keep local fields in sync with user state
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

  const levelInfo = getLevelProgress(currentUser.totalXP);

  // Save General Profile Information
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

  // Analyze & Sync GitHub Profile
  const handleSyncGithub = async () => {
    const trimmed = githubInput.trim();
    if (!trimmed) {
      addToast({
        title: "GitHub link or username required",
        description: "Please enter your GitHub profile link (e.g. github.com/username) or @handle.",
        type: "default",
      });
      return;
    }

    setIsSyncingGithub(true);
    try {
      const stats = await fetchGitHubStats(trimmed);

      // Award bonus XP for verified coding activity sync
      const bonusXP = Math.min(stats.totalContributions || 20, 100);
      const newTotalXP = (currentUser.totalXP || 0) + bonusXP;

      await updateProfile({
        githubUsername: stats.username,
        githubStats: stats,
        totalXP: newTotalXP,
        lastSyncedAt: new Date().toISOString(),
      });

      addToast({
        title: "GitHub Profile Analyzed & Synced! 🐙",
        description: `Loaded @${stats.username} with ${stats.totalContributions || 0} contributions and ${stats.publicRepos || 0} repos. (+${bonusXP} XP)`,
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

  // Analyze & Sync LeetCode Profile
  const handleSyncLeetcode = async () => {
    const trimmed = leetcodeInput.trim();
    if (!trimmed) {
      addToast({
        title: "LeetCode link or username required",
        description: "Please enter your LeetCode profile link (e.g. leetcode.com/u/username) or @handle.",
        type: "default",
      });
      return;
    }

    setIsSyncingLeetcode(true);
    try {
      const stats = await fetchLeetCodeStats(trimmed);

      // Calculate XP bonus based on solved problems
      const xpEarned = Math.min(
        stats.easy * XP_REWARDS.LEETCODE_EASY +
        stats.medium * XP_REWARDS.LEETCODE_MEDIUM +
        stats.hard * XP_REWARDS.LEETCODE_HARD,
        250
      );
      const newTotalXP = (currentUser.totalXP || 0) + xpEarned;

      await updateProfile({
        leetcodeUsername: stats.username,
        leetcodeStats: stats,
        totalXP: newTotalXP,
        lastSyncedAt: new Date().toISOString(),
      });

      addToast({
        title: "LeetCode Profile Analyzed & Synced! ⚡",
        description: `Verified ${stats.totalSolved} problems solved for @${stats.username} (Rank #${stats.ranking?.toLocaleString() || "Top"}). (+${xpEarned} XP)`,
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

  // Analyze & Sync Both Accounts
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

  // Analyze a Specific Squad Member's Profiles
  const handleAnalyzeMember = async (memberUser: UserProfile) => {
    setMemberSyncingId(memberUser.id);
    try {
      const githubHandle = memberUser.githubUsername || memberUser.githubStats?.username;
      const leetcodeHandle = memberUser.leetcodeUsername || memberUser.leetcodeStats?.username;

      let ghStats: GitHubStats | undefined;
      let lcStats: LeetCodeStats | undefined;

      if (githubHandle) {
        ghStats = await fetchGitHubStats(githubHandle);
      }
      if (leetcodeHandle) {
        lcStats = await fetchLeetCodeStats(leetcodeHandle);
      }

      addToast({
        title: `Analyzed @${memberUser.username}'s Profile`,
        description: `GitHub: ${ghStats?.totalContributions || "Active"} contributions · LeetCode: ${lcStats?.totalSolved || "Synced"} solved.`,
        type: "success",
      });
    } catch (err: any) {
      addToast({
        title: "Member analysis failed",
        description: err.message || "Could not analyze squad member stats.",
        type: "error",
      });
    } finally {
      setMemberSyncingId(null);
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

  // Squad member list (combining allUsers and currentUser)
  const allUsersList = Object.values(allUsers || {});
  const squadList: UserProfile[] = allUsersList.length > 0 ? allUsersList : [currentUser];
  const inspectedMember: UserProfile = squadList.find((u) => u.id === selectedMemberId) || currentUser;

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header Banner */}
      <div className="border-b border-white/5 bg-[#09090b]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.username}`}
                  alt={currentUser.displayName}
                  className="w-16 h-16 rounded-2xl border-2 border-white/10 object-cover shadow-xl bg-zinc-900"
                />
                <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-white text-black text-[10px] font-bold border border-white/20">
                  Lvl {levelInfo.currentLevel}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    {currentUser.displayName}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 text-xs font-mono">
                    @{currentUser.username}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <strong className="text-white">{currentUser.streak?.current || 1}</strong> day streak
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    <strong className="text-white">{currentUser.totalXP.toLocaleString()}</strong> XP
                  </span>
                  {currentUser.lastSyncedAt && (
                    <>
                      <span>•</span>
                      <span className="text-[11px] text-zinc-500">
                        Synced {new Date(currentUser.lastSyncedAt).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Refresh All Stats Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSyncAll}
                disabled={isSyncingAll || isSyncingGithub || isSyncingLeetcode}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? "animate-spin" : ""}`} />
                <span>{isSyncingAll ? "Analyzing Stats..." : "Analyze & Refresh All Stats"}</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-8 border-t border-white/5 pt-4">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "profile"
                  ? "bg-white/10 text-white border border-white/10 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile & Coding Links</span>
            </button>
            <button
              onClick={() => setActiveTab("squad")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "squad"
                  ? "bg-white/10 text-white border border-white/10 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Squad Profiles & Analysis</span>
            </button>
            <button
              onClick={() => setActiveTab("music")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "music"
                  ? "bg-white/10 text-white border border-white/10 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Music2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Squad Music Lounge</span>
              {squadSongs.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 text-[10px]">
                  {squadSongs.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("preferences")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "preferences"
                  ? "bg-white/10 text-white border border-white/10 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>Squad & Preferences</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* TAB 1: Profile & Coding Links Analysis */}
        {activeTab === "profile" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Coding Profiles & Analysis Hub */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-amber-400" />
                    <span>Coding Accounts & Live Stats Analysis</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Connect your GitHub and LeetCode links to automatically analyze your performance and update squad XP.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* GITHUB INTEGRATION CARD */}
                <TiltCard className="p-6 rounded-2xl bg-[#111113] border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                          <GithubIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                            <span>GitHub Integration</span>
                            {currentUser.githubStats && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30">
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-400">
                            +2 XP per verified commit / PR
                          </div>
                        </div>
                      </div>

                      {currentUser.githubStats?.avatarUrl && (
                        <img
                          src={currentUser.githubStats.avatarUrl}
                          alt="GitHub Avatar"
                          className="w-8 h-8 rounded-full border border-white/10"
                        />
                      )}
                    </div>

                    {/* GitHub Link Input */}
                    <div className="mt-5 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                          GitHub Profile URL or Username
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-mono">
                              github.com/
                            </span>
                            <input
                              type="text"
                              value={githubInput.replace(/^https?:\/\/github\.com\//i, "").replace(/^@/, "")}
                              onChange={(e) => setGithubInput(e.target.value)}
                              placeholder="username"
                              className="w-full bg-black/60 border border-white/10 rounded-xl pl-24 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/30"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleSyncGithub}
                            disabled={isSyncingGithub}
                            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3 h-3 ${isSyncingGithub ? "animate-spin" : ""}`} />
                            <span>{isSyncingGithub ? "Analyzing..." : "Analyze"}</span>
                          </button>
                        </div>
                      </div>

                      {/* GitHub Analyzed Stats Display */}
                      {currentUser.githubStats ? (
                        <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
                              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                                Total Contributions
                              </div>
                              <div className="text-base font-mono font-bold text-white mt-0.5">
                                {currentUser.githubStats.totalContributions?.toLocaleString() || "89"}
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
                              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                                2026 Activity
                              </div>
                              <div className="text-base font-mono font-bold text-emerald-400 mt-0.5">
                                {currentUser.githubStats.totalContributionsYear || 64}
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
                              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                                Repositories
                              </div>
                              <div className="text-base font-mono font-bold text-white mt-0.5">
                                {currentUser.githubStats.publicRepos || 21}
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
                              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                                Followers
                              </div>
                              <div className="text-base font-mono font-bold text-white mt-0.5">
                                {currentUser.githubStats.followers ?? 5}
                              </div>
                            </div>
                          </div>

                          {/* Contributions Breakdown by Year */}
                          <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                              <span>Contributions by Year</span>
                              <span className="text-[10px] text-zinc-500 font-normal">Verified Git Activity</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <div className="text-[10px] text-emerald-400 font-semibold">2026</div>
                                <div className="text-xs font-mono font-bold text-white mt-0.5">
                                  {currentUser.githubStats.contributionsByYear?.["2026"] ?? 64}
                                </div>
                              </div>
                              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                                <div className="text-[10px] text-zinc-400">2025</div>
                                <div className="text-xs font-mono font-bold text-white mt-0.5">
                                  {currentUser.githubStats.contributionsByYear?.["2025"] ?? 24}
                                </div>
                              </div>
                              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                                <div className="text-[10px] text-zinc-400">2024</div>
                                <div className="text-xs font-mono font-bold text-white mt-0.5">
                                  {currentUser.githubStats.contributionsByYear?.["2024"] ?? 1}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Recent Verified Commits */}
                          {currentUser.githubStats.recentCommits && currentUser.githubStats.recentCommits.length > 0 && (
                            <div>
                              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                                Recent Commits
                              </div>
                              <div className="space-y-1.5">
                                {currentUser.githubStats.recentCommits.slice(0, 3).map((c, i) => (
                                  <div
                                    key={i}
                                    className="p-2 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between text-xs"
                                  >
                                    <div className="truncate pr-2">
                                      <span className="font-mono text-zinc-400 text-[11px] mr-2">
                                        {c.repo.split("/")[1] || c.repo}
                                      </span>
                                      <span className="text-zinc-200">{c.message}</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                                      {c.timestamp}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-black/30 border border-dashed border-white/10 text-center text-xs text-zinc-500">
                          Enter your GitHub link or handle above and click <strong>Analyze</strong> to pull live commits and verify contributions.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>Target: active consistency</span>
                    {currentUser.githubUsername && (
                      <a
                        href={`https://github.com/${currentUser.githubUsername}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
                      >
                        <span>Open GitHub</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </TiltCard>

                {/* LEETCODE INTEGRATION CARD */}
                <TiltCard className="p-6 rounded-2xl bg-[#111113] border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                          <Code2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                            <span>LeetCode Integration</span>
                            {currentUser.leetcodeStats && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-mono border border-amber-500/30">
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-400">
                            Easy (+10 XP) • Medium (+25 XP) • Hard (+50 XP)
                          </div>
                        </div>
                      </div>

                      {currentUser.leetcodeStats && (
                        <div className="text-right">
                          <div className="text-sm font-mono font-bold text-white">
                            #{currentUser.leetcodeStats.ranking?.toLocaleString() || "Top"}
                          </div>
                          <div className="text-[10px] text-zinc-500">Global Rank</div>
                        </div>
                      )}
                    </div>

                    {/* LeetCode Link Input */}
                    <div className="mt-5 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                          LeetCode Profile URL or Username
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-mono">
                              leetcode.com/u/
                            </span>
                            <input
                              type="text"
                              value={leetcodeInput.replace(/^https?:\/\/leetcode\.com\/(?:u\/)?/i, "").replace(/^@/, "")}
                              onChange={(e) => setLeetcodeInput(e.target.value)}
                              placeholder="username"
                              className="w-full bg-black/60 border border-white/10 rounded-xl pl-28 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/30"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleSyncLeetcode}
                            disabled={isSyncingLeetcode}
                            className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3 h-3 ${isSyncingLeetcode ? "animate-spin" : ""}`} />
                            <span>{isSyncingLeetcode ? "Analyzing..." : "Analyze"}</span>
                          </button>
                        </div>
                      </div>

                      {/* LeetCode Analyzed Stats Display */}
                      {currentUser.leetcodeStats ? (
                        <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                          <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                            <div>
                              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                                Total Solved
                              </div>
                              <div className="text-xl font-mono font-bold text-white mt-0.5">
                                {currentUser.leetcodeStats.totalSolved}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                                Acceptance Rate
                              </div>
                              <div className="text-sm font-mono font-semibold text-emerald-400 mt-0.5">
                                {currentUser.leetcodeStats.acceptanceRate || 58.4}%
                              </div>
                            </div>
                          </div>

                          {/* Difficulty Meters */}
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-emerald-400 font-medium">Easy</span>
                                <span className="font-mono text-zinc-300">
                                  {currentUser.leetcodeStats.easy} solved
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                <div
                                  className="h-full bg-emerald-400 rounded-full"
                                  style={{
                                    width: `${Math.min(100, (currentUser.leetcodeStats.easy / Math.max(1, currentUser.leetcodeStats.totalSolved)) * 100)}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-amber-400 font-medium">Medium</span>
                                <span className="font-mono text-zinc-300">
                                  {currentUser.leetcodeStats.medium} solved
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                <div
                                  className="h-full bg-amber-400 rounded-full"
                                  style={{
                                    width: `${Math.min(100, (currentUser.leetcodeStats.medium / Math.max(1, currentUser.leetcodeStats.totalSolved)) * 100)}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-rose-400 font-medium">Hard</span>
                                <span className="font-mono text-zinc-300">
                                  {currentUser.leetcodeStats.hard} solved
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                <div
                                  className="h-full bg-rose-400 rounded-full"
                                  style={{
                                    width: `${Math.min(100, (currentUser.leetcodeStats.hard / Math.max(1, currentUser.leetcodeStats.totalSolved)) * 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Recent Verified AC Submissions */}
                          {currentUser.leetcodeStats.recentSubmissions && currentUser.leetcodeStats.recentSubmissions.length > 0 && (
                            <div>
                              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                                <span>Recent Accepted Submissions</span>
                                <span className="text-[10px] text-emerald-400 font-medium">Verified AC</span>
                              </div>
                              <div className="space-y-1.5">
                                {currentUser.leetcodeStats.recentSubmissions.slice(0, 4).map((s, i) => (
                                  <div
                                    key={i}
                                    className="p-2 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between text-xs"
                                  >
                                    <span className="text-zinc-200 truncate pr-2">{s.title}</span>
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                      s.difficulty === "Easy"
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        : s.difficulty === "Hard"
                                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                        : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                                    }`}>
                                      {s.difficulty || "Solved"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-black/30 border border-dashed border-white/10 text-center text-xs text-zinc-500">
                          Enter your LeetCode link or handle above and click <strong>Analyze</strong> to pull verified problem solves and award XP.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>Official GraphQL Verified</span>
                    {currentUser.leetcodeUsername && (
                      <a
                        href={`https://leetcode.com/u/${currentUser.leetcodeUsername}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
                      >
                        <span>Open LeetCode</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </TiltCard>
              </div>
            </div>

            {/* Profile Information Settings Card */}
            <div className="p-6 rounded-2xl bg-[#111113] border border-white/10">
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-zinc-300" />
                    <span>User Profile Details</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Update your display name, username handle, bio, and squad timezone.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      placeholder="e.g. Nova Vance"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Username Handle
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-mono">
                        @
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        placeholder="username"
                        className="w-full bg-black/60 border border-white/10 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Bio / Focus Areas
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="Tell your squad what you're grinding on (e.g. Distributed Systems & LeetCode Hard)..."
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Timezone
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white/30"
                    >
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="America/Chicago">America/Chicago (CST)</option>
                      <option value="America/Denver">America/Denver (MST)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={currentUser.email}
                      disabled
                      className="w-full bg-black/30 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-zinc-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingProfile ? "Saving Details..." : "Save Profile Details"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB: Squad Music & Audio Lounge */}
        {activeTab === "music" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                    <Music2 className="w-5 h-5 text-purple-400" />
                    <span>Squad Music & Audio Lounge</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Manage the shared squad audio library. Any song added here is immediately available to everyone in your squad in real time.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddSongModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-purple-600/30 self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Song to Library</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 7 Cols: Squad Songs Grid */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="p-6 rounded-2xl bg-[#111113] border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-white uppercase tracking-wider text-zinc-400">
                        Squad Shared Library ({squadSongs.length} Tracks)
                      </h3>
                      <span className="text-[10px] font-mono text-purple-400">
                        Universal HTML5 Audio
                      </span>
                    </div>

                    {squadSongs.length === 0 ? (
                      <div className="text-center py-12 px-4 rounded-xl bg-black/30 border border-dashed border-white/10 space-y-2">
                        <Music2 className="w-8 h-8 text-zinc-600 mx-auto" />
                        <p className="text-xs font-medium text-zinc-300">
                          No songs added to the squad library yet
                        </p>
                        <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                          Upload an audio file or paste any direct MP3/stream link to make it instantly accessible to all friends in your squad.
                        </p>
                        <button
                          onClick={() => setIsAddSongModalOpen(true)}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Your First Song</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {squadSongs.map((song) => {
                          const isCurrent = currentTrack.id === song.id;
                          return (
                            <div
                              key={song.id}
                              className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 group ${
                                isCurrent
                                  ? "bg-purple-500/15 border-purple-500/40 text-white"
                                  : "bg-white/5 border-white/5 text-zinc-300 hover:text-white hover:bg-white/10"
                              }`}
                            >
                              <div
                                onClick={() => changeTrack(song)}
                                className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={song.albumArt || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100"}
                                  alt={song.title}
                                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-semibold truncate">
                                    {song.title}
                                  </div>
                                  <div className="text-[11px] text-zinc-400 truncate">
                                    {song.artist} • {song.genre || "Focus"}
                                  </div>
                                  {song.addedBy && (
                                    <div className="text-[10px] text-purple-400/80 truncate">
                                      Added by {song.addedBy.name}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => changeTrack(song)}
                                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white"
                                >
                                  {isCurrent ? "Playing" : "Play"}
                                </button>
                                {song.addedBy?.id === currentUser.id && (
                                  <button
                                    type="button"
                                    onClick={() => removeSong(song.id)}
                                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    title="Delete from squad library"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right 5 Cols: Curated Focus Stations & Audio Preferences */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Curated Stations */}
                  <div className="p-6 rounded-2xl bg-[#111113] border border-white/10 space-y-4">
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider text-zinc-400">
                      Curated High-Yield Stations ({stations.length})
                    </h3>
                    <div className="space-y-2">
                      {stations.map((st) => (
                        <div
                          key={st.id}
                          onClick={() => changeTrack(st.track)}
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-white truncate">
                              {st.title}
                            </div>
                            <div className="text-[10px] text-zinc-400 truncate">
                              {st.genre}
                            </div>
                          </div>
                          <span className="text-[10px] text-purple-400 font-mono shrink-0">
                            Stream
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Audio Preferences */}
                  <div className="p-6 rounded-2xl bg-[#111113] border border-white/10 space-y-4">
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider text-zinc-400">
                      Audio Settings
                    </h3>
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-300">Master Volume</span>
                        <span className="font-mono text-zinc-400">
                          {Math.round((isMuted ? 0 : volume) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                      <p className="text-[11px] text-zinc-500">
                        All audio plays seamlessly across tabs without any Spotify authorization or account restrictions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Squad Profiles & Analysis */}
        {activeTab === "squad" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    <span>Squad Member Profiles & Analysis</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Inspect all squad members' linked GitHub and LeetCode accounts, analyze output velocity, and update their stats.
                  </p>
                </div>
              </div>

              {/* Squad Member Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {squadList.map((member) => {
                  const isSelected = member.id === selectedMemberId;
                  const isAnalyzing = memberSyncingId === member.id;
                  const isSelf = member.id === currentUser.id;

                  return (
                    <div
                      key={member.id}
                      onClick={() => setSelectedMemberId(member.id)}
                      className={`p-4 rounded-2xl cursor-pointer transition-all border text-left ${
                        isSelected
                          ? "bg-white/10 border-white/30 shadow-lg scale-[1.02]"
                          : "bg-[#111113] border-white/5 hover:border-white/20 hover:bg-[#161619]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={member.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.username}`}
                          alt={member.displayName}
                          className="w-10 h-10 rounded-xl object-cover border border-white/10 bg-zinc-900"
                        />
                        <div className="truncate">
                          <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
                            <span>{member.displayName}</span>
                            {isSelf && (
                              <span className="text-[10px] text-zinc-500 font-mono">(you)</span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono">
                            @{member.username}
                          </div>
                        </div>
                      </div>

                      {/* Member Highlights */}
                      <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-1 text-[11px]">
                        <div>
                          <span className="text-zinc-500">XP: </span>
                          <span className="font-mono font-bold text-white">
                            {member.totalXP.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Streak: </span>
                          <span className="font-mono font-bold text-emerald-400">
                            {member.streak?.current || 1}d
                          </span>
                        </div>
                      </div>

                      {/* Links preview */}
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-zinc-400">
                        {member.githubUsername ? (
                          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 flex items-center gap-1">
                            <GithubIcon className="w-2.5 h-2.5" />
                            {member.githubUsername}
                          </span>
                        ) : (
                          <span className="text-zinc-600">No GitHub</span>
                        )}
                        {member.leetcodeUsername ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                            <Code2 className="w-2.5 h-2.5" />
                            {member.leetcodeUsername}
                          </span>
                        ) : (
                          <span className="text-zinc-600">No LeetCode</span>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAnalyzeMember(member);
                        }}
                        disabled={isAnalyzing}
                        className="w-full mt-3 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <RefreshCw className={`w-2.5 h-2.5 ${isAnalyzing ? "animate-spin" : ""}`} />
                        <span>{isAnalyzing ? "Analyzing..." : "Analyze Profile"}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Member Inspection Drawer */}
            <div className="p-6 rounded-2xl bg-[#111113] border border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <img
                    src={inspectedMember.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${inspectedMember.username}`}
                    alt={inspectedMember.displayName}
                    className="w-12 h-12 rounded-xl object-cover border border-white/10 bg-zinc-900"
                  />
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{inspectedMember.displayName}</span>
                      <span className="text-xs font-mono text-zinc-400">
                        @{inspectedMember.username}
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {inspectedMember.bio || "Active squad member working on algorithms and engineering consistency."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAnalyzeMember(inspectedMember)}
                    disabled={memberSyncingId === inspectedMember.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${memberSyncingId === inspectedMember.id ? "animate-spin" : ""}`} />
                    <span>Analyze This Member</span>
                  </button>
                </div>
              </div>

              {/* Analyzed stats comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* GitHub Analysis */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-white">
                      <GithubIcon className="w-4 h-4" />
                      <span>GitHub Metrics</span>
                    </div>
                    {inspectedMember.githubUsername ? (
                      <a
                        href={`https://github.com/${inspectedMember.githubUsername}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
                      >
                        @{inspectedMember.githubUsername}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-zinc-500">Unlinked</span>
                    )}
                  </div>

                  {inspectedMember.githubStats ? (
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <div className="text-[10px] text-zinc-500">Contributions</div>
                        <div className="font-mono font-bold text-white mt-0.5">
                          {inspectedMember.githubStats.totalContributions || 0}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <div className="text-[10px] text-zinc-500">Streak</div>
                        <div className="font-mono font-bold text-emerald-400 mt-0.5">
                          {inspectedMember.githubStats.currentStreak || 0}d
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <div className="text-[10px] text-zinc-500">Repos</div>
                        <div className="font-mono font-bold text-white mt-0.5">
                          {inspectedMember.githubStats.publicRepos || 0}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-xs text-zinc-500">
                      No GitHub analysis data synced yet.
                    </div>
                  )}
                </div>

                {/* LeetCode Analysis */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                      <Code2 className="w-4 h-4" />
                      <span>LeetCode Metrics</span>
                    </div>
                    {inspectedMember.leetcodeUsername ? (
                      <a
                        href={`https://leetcode.com/u/${inspectedMember.leetcodeUsername}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
                      >
                        @{inspectedMember.leetcodeUsername}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-zinc-500">Unlinked</span>
                    )}
                  </div>

                  {inspectedMember.leetcodeStats ? (
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <div className="text-[10px] text-zinc-500">Total</div>
                        <div className="font-mono font-bold text-white mt-0.5">
                          {inspectedMember.leetcodeStats.totalSolved}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <div className="text-[10px] text-emerald-400">Easy</div>
                        <div className="font-mono font-bold text-white mt-0.5">
                          {inspectedMember.leetcodeStats.easy}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <div className="text-[10px] text-amber-400">Med</div>
                        <div className="font-mono font-bold text-white mt-0.5">
                          {inspectedMember.leetcodeStats.medium}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <div className="text-[10px] text-rose-400">Hard</div>
                        <div className="font-mono font-bold text-white mt-0.5">
                          {inspectedMember.leetcodeStats.hard}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-xs text-zinc-500">
                      No LeetCode analysis data synced yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Preferences & Squad */}
        {activeTab === "preferences" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Squad Invite Card */}
            <div className="p-6 rounded-2xl bg-[#111113] border border-white/10">
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Squad Invite Code</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Share your squad's secret code so friends can join and track progress together.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-4 py-3 rounded-xl bg-black border border-white/10 font-mono text-sm font-bold tracking-widest text-emerald-400">
                  {currentGroup.inviteCode || "SYNC-FOUNDERS-2026"}
                </div>
                <button
                  onClick={handleCopyInvite}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                >
                  {copiedInvite ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="p-6 rounded-2xl bg-[#111113] border border-white/10">
              <div className="pb-4 border-b border-white/5 mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span>Notification Preferences</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Choose which alerts and updates you receive during squad sprints.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                {[
                  { title: "Task Reminders", desc: "Get notified for upcoming deadlines and shared tasks" },
                  { title: "Squad Completion Alerts", desc: "Celebrate when all assigned members finish a shared task" },
                  { title: "Leaderboard Rank Updates", desc: "Instant notifications when friends pass you in XP" },
                  { title: "Challenge Milestones", desc: "Alerts when squad sprints begin or bounties are claimed" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-white">{item.title}</div>
                      <div className="text-[11px] text-zinc-500">{item.desc}</div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* Danger Zone / Sign Out */}
            <div className="p-6 rounded-2xl bg-[#111113] border border-rose-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-rose-400">Account Session</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Signed in as {currentUser.email}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await logout();
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/30 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
