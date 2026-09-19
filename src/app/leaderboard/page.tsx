"use client";

import React, { useState } from "react";
import { useSync } from "@/context/SyncContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Flame,
  CheckCircle2,
  Code2,
  GitCommit,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Minus,
  Zap,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { TiltCard } from "@/components/ui/TiltCard";
import Link from "next/link";

type LeaderboardTimeframe = "weekly" | "monthly" | "all_time";

export default function LeaderboardPage() {
  const { members, currentUser, analytics } = useSync();
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>("weekly");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Calculate sorted members based on selected timeframe
  const sortedMembers = [...members].sort((a, b) => {
    if (timeframe === "weekly") {
      return (b.userSnapshot?.weeklyXP || 0) - (a.userSnapshot?.weeklyXP || 0);
    }
    if (timeframe === "monthly") {
      return (b.userSnapshot?.monthlyXP || 0) - (a.userSnapshot?.monthlyXP || 0);
    }
    return (b.userSnapshot?.totalXP || 0) - (a.userSnapshot?.totalXP || 0);
  });

  const getRankMovement = (userId: string) => {
    const memData = analytics[userId];
    if (!memData) return 0;
    return memData.rankMovement;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Squad Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Healthy competition powered by verified task completions, LeetCode, and code pushes.
          </p>
        </div>

        {/* Timeframe Filter Pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#141416] border border-white/10 self-start sm:self-auto">
          {(
            [
              { key: "weekly", label: "This Week" },
              { key: "monthly", label: "This Month" },
              { key: "all_time", label: "All Time" },
            ] as { key: LeaderboardTimeframe; label: string }[]
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTimeframe(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                timeframe === t.key
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sortedMembers.slice(0, 3).map((member, index) => {
          const isYou = member.userId === currentUser.id;
          const userAnalytic = analytics[member.userId];
          const rank = index + 1;
          const xpValue =
            timeframe === "weekly"
              ? member.userSnapshot?.weeklyXP || 0
              : timeframe === "monthly"
              ? member.userSnapshot?.monthlyXP || 0
              : member.userSnapshot?.totalXP || 0;

          return (
            <TiltCard
              key={member.userId}
              className={`surface-card p-5 relative overflow-hidden flex flex-col justify-between ${
                isYou ? "border-white/25 ring-1 ring-white/15" : ""
              }`}
            >
              {/* Subtle top indicator */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                      rank === 1
                        ? "bg-white text-black"
                        : rank === 2
                        ? "bg-zinc-300 text-black"
                        : "bg-zinc-700 text-white"
                    }`}
                  >
                    #{rank}
                  </span>
                  {isYou && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white font-medium">
                      You
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>{member.userSnapshot?.streak || 1}d streak</span>
                </div>
              </div>

              {/* Avatar & Info */}
              <div className="mt-4 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    member.userSnapshot?.photoURL ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      member.userSnapshot?.displayName || "Member"
                    )}`
                  }
                  alt={member.userSnapshot?.displayName || "Member"}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white/15"
                />
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {member.userSnapshot?.displayName || "Member"}
                  </h3>
                  <div className="text-xs text-zinc-400">
                    @{member.userSnapshot?.username || "member"} · Level {member.userSnapshot?.level || 1}
                  </div>
                </div>
              </div>

              {/* Metric Breakdown */}
              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                    {timeframe === "weekly"
                      ? "Weekly XP"
                      : timeframe === "monthly"
                      ? "Monthly XP"
                      : "Total XP"}
                  </span>
                  <span className="font-mono text-base font-semibold text-white">
                    {xpValue.toLocaleString()} XP
                  </span>
                </div>

                <div className="flex items-center gap-3 text-zinc-400">
                  <div className="flex items-center gap-1" title="LeetCode Solved">
                    <Code2 className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{userAnalytic?.leetcode.totalSolved || 0}</span>
                  </div>
                  <div className="flex items-center gap-1" title="GitHub Commits">
                    <GitCommit className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{userAnalytic?.github.totalContributionsYear || 0}</span>
                  </div>
                </div>
              </div>
            </TiltCard>
          );
        })}
      </div>

      {/* Full Animated Leaderboard Table */}
      <div className="surface-card overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          <div className="flex items-center gap-6">
            <span className="w-8 text-center">Rank</span>
            <span>Squad Member</span>
          </div>
          <div className="flex items-center gap-8 text-right">
            <span className="hidden sm:inline w-20">LeetCode</span>
            <span className="hidden sm:inline w-20">GitHub</span>
            <span className="hidden sm:inline w-20">Tasks</span>
            <span className="w-24 text-right">XP Earned</span>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          <AnimatePresence>
            {sortedMembers.map((member, index) => {
              const rank = index + 1;
              const isYou = member.userId === currentUser.id;
              const movement = getRankMovement(member.userId);
              const userAnalytic = analytics[member.userId];
              const xpValue =
                timeframe === "weekly"
                  ? member.userSnapshot?.weeklyXP || 0
                  : timeframe === "monthly"
                  ? member.userSnapshot?.monthlyXP || 0
                  : member.userSnapshot?.totalXP || 0;

              return (
                <motion.div
                  key={member.userId}
                  layout
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  onClick={() => setSelectedMemberId(member.userId)}
                  className={`p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.03] transition-colors ${
                    isYou ? "bg-white/[0.04]" : ""
                  }`}
                >
                  {/* Left: Rank, Movement & Member */}
                  <div className="flex items-center gap-4">
                    <div className="w-8 flex items-center justify-center gap-1 font-mono text-xs">
                      <span className="font-semibold text-white">#{rank}</span>
                      {movement > 0 ? (
                        <ArrowUp className="w-3 h-3 text-emerald-400" />
                      ) : movement < 0 ? (
                        <ArrowDown className="w-3 h-3 text-rose-400" />
                      ) : (
                        <Minus className="w-3 h-3 text-zinc-600" />
                      )}
                    </div>

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        member.userSnapshot?.photoURL ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          member.userSnapshot?.displayName || "Member"
                        )}`
                      }
                      alt={member.userSnapshot?.displayName || "Member"}
                      className="w-9 h-9 rounded-full object-cover border border-white/10"
                    />

                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <span>{member.userSnapshot?.displayName || "Member"}</span>
                        {isYou && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white font-normal">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 flex items-center gap-2 mt-0.5">
                        <span>Level {member.userSnapshot?.level || 1}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-amber-400/90 font-mono">
                          <Flame className="w-2.5 h-2.5" />
                          {member.userSnapshot?.streak || 1}d
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Detailed stats */}
                  <div className="flex items-center gap-8 text-right text-xs">
                    <div className="hidden sm:inline w-20 text-zinc-300 font-mono">
                      {userAnalytic?.leetcode.totalSolved || 0} solved
                    </div>
                    <div className="hidden sm:inline w-20 text-zinc-300 font-mono">
                      {userAnalytic?.github.totalContributionsYear || 0} commits
                    </div>
                    <div className="hidden sm:inline w-20 text-zinc-300 font-mono">
                      {member.userSnapshot?.tasksCompleted || 0} done
                    </div>
                    <div className="w-24 text-right">
                      <div className="font-mono font-semibold text-white">
                        {xpValue.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                        XP
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Compare or View Friends Link Banner */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-zinc-300">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Want a detailed head-to-head breakdown with a squad member?</span>
        </div>
        <Link
          href="/friends"
          className="text-white hover:text-zinc-300 font-medium flex items-center gap-1 transition-colors"
        >
          <span>Open Head-to-Head Comparison</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
