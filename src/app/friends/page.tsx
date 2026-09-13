"use client";

import React, { useState } from "react";
import { useSync } from "@/context/SyncContext";
import { useMusicMeet } from "@/context/MusicMeetContext";
import {
  Users,
  Flame,
  Code2,
  GitCommit,
  CheckCircle2,
  TrendingUp,
  Award,
  ArrowRight,
  Sparkles,
  ChevronDown,
  Activity,
  Layers,
  Headphones,
  Disc3,
  ExternalLink,
  Check,
} from "lucide-react";
import { TiltCard } from "@/components/ui/TiltCard";

export default function FriendsPage() {
  const { members, currentUser, analytics, allUsers } = useSync();
  const { presences, tuneInToMember, listeningWith } = useMusicMeet();

  // Head-to-head comparison member IDs
  const availableMemberIds = members.map((m) => m.userId);
  const currentUid = currentUser?.id || "";

  // Compute safe fallback analytics so properties are never undefined
  const fallbackAnalytics = {
    userId: currentUid,
    displayName: currentUser?.displayName || "Squad Member",
    username: currentUser?.username || "user",
    photoURL:
      currentUser?.photoURL ||
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    level: currentUser?.level || 1,
    totalXP: currentUser?.totalXP || 0,
    weeklyXP: 0,
    monthlyXP: 0,
    rank: 1,
    rankMovement: 0,
    streak: currentUser?.streak?.current || 1,
    tasksCompleted: 0,
    consistencyScore: 50,
    leetcode: {
      username: currentUser?.username || "user",
      totalSolved: 0,
      easy: 0,
      medium: 0,
      hard: 0,
      ranking: 100000,
      recentSubmissions: [],
    },
    github: {
      username: currentUser?.username || "user",
      totalContributionsYear: 0,
      currentStreak: currentUser?.streak?.current || 1,
      contributionsByWeek: Array.from({ length: 16 }, () =>
        Array.from({ length: 7 }, () => 0)
      ),
      recentCommits: [],
    },
    xpHistory7Days: [],
    xpHistory30Days: [],
  };

  const defaultAId = availableMemberIds[0] || currentUid;
  const defaultBId = availableMemberIds[1] || availableMemberIds[0] || currentUid;
  const defaultSelectedId = availableMemberIds[0] || currentUid;

  const [memberAId, setMemberAId] = useState<string>("");
  const [memberBId, setMemberBId] = useState<string>("");
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");

  const effectiveAId = memberAId && analytics[memberAId] ? memberAId : defaultAId;
  const effectiveBId = memberBId && analytics[memberBId] ? memberBId : defaultBId;
  const effectiveSelectedId =
    selectedProfileId && analytics[selectedProfileId]
      ? selectedProfileId
      : defaultSelectedId;

  const memberA = analytics[effectiveAId] || analytics[currentUid] || fallbackAnalytics;
  const memberB = analytics[effectiveBId] || analytics[currentUid] || fallbackAnalytics;

  const activeProfile =
    analytics[effectiveSelectedId] || analytics[currentUid] || fallbackAnalytics;

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-5">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          Squad Profiles & Comparison
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Deep-dive into individual coding consistency, contribution grids, live squad music presence, and head-to-head stats.
        </p>
      </div>

      {/* 1. Squad Member Cards Grid */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
          Active Members ({members.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {members.length === 0 ? (
            <div className="col-span-full surface-card p-6 text-center text-zinc-400 text-xs rounded-2xl border border-white/5">
              Syncing squad members...
            </div>
          ) : (
            members.map((member) => {
              const isSelected = effectiveSelectedId === member.userId;
              const memAnalytic = analytics[member.userId];
              const musicPresence = presences[member.userId];

              return (
                <TiltCard
                  key={member.userId}
                  onClick={() => setSelectedProfileId(member.userId)}
                  className={`surface-card p-4 cursor-pointer transition-all ${
                    isSelected
                      ? "border-white/30 ring-1 ring-white/20 bg-[#161618]"
                      : "hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={member.userSnapshot?.photoURL || fallbackAnalytics.photoURL}
                      alt={member.userSnapshot?.displayName || "Member"}
                      className="w-11 h-11 rounded-full object-cover border border-white/10"
                    />
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {member.userSnapshot?.displayName || "Member"}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Level {member.userSnapshot?.level || 1} · Lvl{" "}
                        {member.userSnapshot?.rank ? `#${member.userSnapshot.rank}` : ""}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Streak</span>
                      <span className="font-mono text-zinc-200">
                        {member.userSnapshot?.streak || 1}d
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">LeetCode</span>
                      <span className="font-mono text-zinc-200">
                        {memAnalytic?.leetcode.totalSolved || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">GitHub</span>
                      <span className="font-mono text-zinc-200">
                        {memAnalytic?.github.totalContributionsYear || 0}
                      </span>
                    </div>
                  </div>

                {/* Live Music Pill */}
                {musicPresence?.track && (
                  <div
                    className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="flex items-end gap-0.5 h-3 shrink-0" title="Now playing">
                        <span className="w-0.5 bg-purple-400 rounded-full animate-eq-1" />
                        <span className="w-0.5 bg-purple-400 rounded-full animate-eq-2" />
                        <span className="w-0.5 bg-purple-400 rounded-full animate-eq-3" />
                      </span>
                      <span className="text-[11px] text-zinc-300 truncate font-medium">
                        {musicPresence.track.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {member.userId !== currentUser.id && (
                        <button
                          onClick={() => tuneInToMember(member.userId)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                            listeningWith === member.userId
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-white/10 hover:bg-white text-zinc-300 hover:text-black"
                          }`}
                          title="Tune In to this friend's track"
                        >
                          {listeningWith === member.userId ? (
                            <>
                              <Check className="w-2.5 h-2.5" /> Tuned
                            </>
                          ) : (
                            <>
                              <Headphones className="w-2.5 h-2.5" /> Tune In
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </TiltCard>
            );
          }))}
        </div>
      </div>

      {/* 2. Detailed Member Profile View */}
      {activeProfile && (
        <div className="surface-card p-6 sm:p-8 space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeProfile.photoURL}
                alt={activeProfile.displayName}
                className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-white">
                    {activeProfile.displayName}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[11px] font-mono">
                    Rank #{activeProfile.rank}
                  </span>
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  @{activeProfile.username} · Level {activeProfile.level} ·{" "}
                  <span className="text-white font-mono">
                    {activeProfile.totalXP.toLocaleString()} XP
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              {presences[effectiveSelectedId]?.track && (
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={presences[effectiveSelectedId].track!.albumArt}
                    alt={presences[effectiveSelectedId].track!.title}
                    className="w-9 h-9 rounded-lg object-cover border border-white/10 shrink-0"
                  />
                  <div className="min-w-0 pr-1">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954]" />
                      Focus Audio
                    </div>
                    <div className="text-xs font-semibold text-white truncate max-w-[130px]">
                      {presences[effectiveSelectedId].track!.title}
                    </div>
                  </div>
                  {effectiveSelectedId !== currentUser?.id && (
                    <button
                      onClick={() => tuneInToMember(effectiveSelectedId)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white text-zinc-200 hover:text-black text-[11px] font-semibold transition-colors flex items-center gap-1 shrink-0"
                    >
                      <Headphones className="w-3 h-3" />
                      Tune In
                    </button>
                  )}
                </div>
              )}

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                  Consistency Score
                </span>
                <span className="text-lg font-mono font-bold text-emerald-400">
                  {activeProfile.consistencyScore} / 100
                </span>
              </div>
            </div>
          </div>

          {/* LeetCode & Coding Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LeetCode Breakdown */}
            <div className="p-5 rounded-2xl bg-[#161618] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                    LeetCode Problem Matrix
                  </h4>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  Total Solved: {activeProfile.leetcode.totalSolved}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-400 font-semibold block uppercase">
                    Easy
                  </span>
                  <span className="text-base font-mono font-bold text-white mt-0.5 block">
                    {activeProfile.leetcode.easy}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-[10px] text-amber-400 font-semibold block uppercase">
                    Medium
                  </span>
                  <span className="text-base font-mono font-bold text-white mt-0.5 block">
                    {activeProfile.leetcode.medium}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <span className="text-[10px] text-rose-400 font-semibold block uppercase">
                    Hard
                  </span>
                  <span className="text-base font-mono font-bold text-white mt-0.5 block">
                    {activeProfile.leetcode.hard}
                  </span>
                </div>
              </div>

              {/* Recent Submissions */}
              <div className="pt-2">
                <span className="text-[11px] text-zinc-500 font-medium block mb-2">
                  Recent Submissions
                </span>
                <div className="space-y-1.5 text-xs">
                  {activeProfile.leetcode.recentSubmissions?.map((sub, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-white/5 flex items-center justify-between text-zinc-300"
                    >
                      <span>{sub.title}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {sub.difficulty} · {sub.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* GitHub Contributions */}
            <div className="p-5 rounded-2xl bg-[#161618] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                    GitHub Activity & Commits
                  </h4>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  {activeProfile.github.totalContributionsYear || activeProfile.github.totalContributions || 0} this year
                </span>
              </div>

              {/* GitHub Contribution Heatmap Simulation */}
              <div className="pt-2">
                <span className="text-[11px] text-zinc-500 font-medium block mb-2">
                  16-Week Activity Heatmap
                </span>
                <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-2 custom-scrollbar">
                  {(activeProfile.github.contributionsByWeek || []).flatMap((week, wi) =>
                    week.map((level, di) => (
                      <div
                        key={`${wi}-${di}`}
                        title={`${level * 2} contributions`}
                        className={`w-3 h-3 rounded-[3px] ${
                          level === 0
                            ? "bg-zinc-800/80"
                            : level === 1
                            ? "bg-zinc-600"
                            : level === 2
                            ? "bg-zinc-400"
                            : "bg-white"
                        }`}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Recent Git Commits */}
              <div className="pt-2">
                <span className="text-[11px] text-zinc-500 font-medium block mb-2">
                  Recent Verified Commits
                </span>
                <div className="space-y-1.5 text-xs">
                  {(activeProfile.github.recentCommits || []).map((c, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-white/5 flex items-center justify-between text-zinc-300"
                    >
                      <div className="truncate max-w-[260px]">
                        <span className="font-mono text-zinc-400 text-[10px] block">
                          {c.repo}
                        </span>
                        <span className="text-white text-xs truncate">{c.message}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 shrink-0">
                        {c.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Head-to-Head Comparison View (Core Requirement) */}
      <div className="surface-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-white" />
              Head-to-Head Squad Comparison
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Select two members to evaluate performance across XP, coding metrics, and consistency.
            </p>
          </div>

          {/* Member Selectors */}
          <div className="flex items-center gap-2">
            <select
              value={effectiveAId}
              onChange={(e) => setMemberAId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#1c1c1e] border border-white/10 text-xs text-white focus:outline-none"
            >
              {members.length > 0 ? (
                members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.userSnapshot?.displayName || m.userId}
                  </option>
                ))
              ) : (
                <option value={currentUid}>
                  {currentUser?.displayName || "Squad Member"}
                </option>
              )}
            </select>

            <span className="text-xs font-bold text-zinc-500">VS</span>

            <select
              value={effectiveBId}
              onChange={(e) => setMemberBId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#1c1c1e] border border-white/10 text-xs text-white focus:outline-none"
            >
              {members.length > 0 ? (
                members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.userSnapshot?.displayName || m.userId}
                  </option>
                ))
              ) : (
                <option value={currentUid}>
                  {currentUser?.displayName || "Squad Member"}
                </option>
              )}
            </select>
          </div>
        </div>

        {/* Comparison Header Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#161618] border border-white/10 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={memberA.photoURL}
              alt={memberA.displayName}
              className="w-10 h-10 rounded-full object-cover border border-white/15"
            />
            <div>
              <div className="text-sm font-semibold text-white">
                {memberA.displayName}
              </div>
              <div className="text-xs text-zinc-400 font-mono">
                Level {memberA.level} · #{memberA.rank}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#161618] border border-white/10 flex items-center justify-end gap-3 text-right">
            <div>
              <div className="text-sm font-semibold text-white">
                {memberB.displayName}
              </div>
              <div className="text-xs text-zinc-400 font-mono">
                Level {memberB.level} · #{memberB.rank}
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={memberB.photoURL}
              alt={memberB.displayName}
              className="w-10 h-10 rounded-full object-cover border border-white/15"
            />
          </div>
        </div>

        {/* Dual Stat Comparison Bars */}
        <div className="space-y-4 pt-2">
          {(
            [
              {
                label: "Total XP",
                valA: memberA.totalXP,
                valB: memberB.totalXP,
                unit: "XP",
              },
              {
                label: "Active Streak",
                valA: memberA.streak || 0,
                valB: memberB.streak || 0,
                unit: "days",
              },
              {
                label: "Tasks Completed",
                valA: memberA.tasksCompleted || 0,
                valB: memberB.tasksCompleted || 0,
                unit: "tasks",
              },
              {
                label: "LeetCode Solved",
                valA: memberA.leetcode?.totalSolved || 0,
                valB: memberB.leetcode?.totalSolved || 0,
                unit: "problems",
              },
              {
                label: "GitHub Contributions",
                valA: memberA.github?.totalContributionsYear || memberA.github?.totalContributions || 0,
                valB: memberB.github?.totalContributionsYear || memberB.github?.totalContributions || 0,
                unit: "commits",
              },
              {
                label: "Consistency Score",
                valA: memberA.consistencyScore || 0,
                valB: memberB.consistencyScore || 0,
                unit: "/ 100",
              },
            ]
          ).map((stat) => {
            const total = stat.valA + stat.valB || 1;
            const pctA = Math.round((stat.valA / total) * 100);
            const pctB = 100 - pctA;
            const diff = stat.valA - stat.valB;

            return (
              <div key={stat.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-white">
                    {stat.valA.toLocaleString()} {stat.unit}
                  </span>
                  <span className="text-zinc-400 font-medium">
                    {stat.label}
                  </span>
                  <span className="font-mono font-semibold text-white">
                    {stat.valB.toLocaleString()} {stat.unit}
                  </span>
                </div>

                {/* Dual bar indicator */}
                <div className="h-2 w-full rounded-full bg-white/10 flex overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-500"
                    style={{ width: `${pctA}%` }}
                  />
                  <div
                    className="h-full bg-zinc-500 transition-all duration-500"
                    style={{ width: `${pctB}%` }}
                  />
                </div>

                <div className="text-[10px] text-center text-zinc-500 font-mono">
                  {diff > 0
                    ? `${memberA.displayName.split(" ")[0]} +${diff.toLocaleString()}`
                    : diff < 0
                    ? `${memberB.displayName.split(" ")[0]} +${Math.abs(diff).toLocaleString()}`
                    : "Tied"}
                </div>
              </div>
            );
          })}

          {/* Focus Music Taste & Live Soundtrack Comparison */}
          <div className="p-4 rounded-xl bg-[#161618] border border-white/10 space-y-3 mt-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Disc3 className="w-3.5 h-3.5 text-purple-400" />
                Focus Soundtrack & Vibe Comparison
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">Squad Audio Live</span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              {/* Member A Vibe */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  {(memberA.displayName || "Member").split(" ")[0]}&apos;s Focus Beat
                </div>
                <div className="text-xs font-semibold text-white truncate">
                  {presences[effectiveAId]?.track?.title || "Ambient Silence"}
                </div>
                <div className="text-[10px] text-zinc-400">
                  Genre: {presences[effectiveAId]?.track?.genre || "Deep Focus"}
                </div>
                {presences[effectiveAId]?.track && effectiveAId !== currentUser?.id && (
                  <button
                    onClick={() => tuneInToMember(effectiveAId)}
                    className="w-full py-1.5 rounded-lg bg-white/10 hover:bg-white text-zinc-200 hover:text-black text-[10px] font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <Headphones className="w-2.5 h-2.5" />
                    Tune In to {(memberA.displayName || "Member").split(" ")[0]}
                  </button>
                )}
              </div>

              {/* Member B Vibe */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2 text-right">
                <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  {(memberB.displayName || "Member").split(" ")[0]}&apos;s Focus Beat
                </div>
                <div className="text-xs font-semibold text-white truncate">
                  {presences[effectiveBId]?.track?.title || "Ambient Silence"}
                </div>
                <div className="text-[10px] text-zinc-400">
                  Genre: {presences[effectiveBId]?.track?.genre || "Deep Focus"}
                </div>
                {presences[effectiveBId]?.track && effectiveBId !== currentUser?.id && (
                  <button
                    onClick={() => tuneInToMember(effectiveBId)}
                    className="w-full py-1.5 rounded-lg bg-white/10 hover:bg-white text-zinc-200 hover:text-black text-[10px] font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <Headphones className="w-2.5 h-2.5" />
                    Tune In to {(memberB.displayName || "Member").split(" ")[0]}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
