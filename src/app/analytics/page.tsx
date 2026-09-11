"use client";

import React, { useState } from "react";
import { useSync } from "@/context/SyncContext";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Code2,
  GitCommit,
  Sparkles,
  Flame,
  CheckCircle2,
} from "lucide-react";

export default function AnalyticsPage() {
  const { members, analytics, currentUser, participants } = useSync();
  const [range, setRange] = useState<"7d" | "30d">("7d");

  const memberPalette = [
    "#ffffff", // White
    "#e4e4e7", // Zinc-200
    "#a1a1aa", // Zinc-400
    "#71717a", // Zinc-500
    "#52525b", // Zinc-600
    "#3f3f46", // Zinc-700
  ];

  const days7 = ["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"];
  const days30 = ["Day 5", "Day 10", "Day 15", "Day 20", "Day 25", "Day 30"];
  const trendDates = range === "7d" ? days7 : days30;

  // Multi-member dynamic trend dataset
  const multiMemberTrendData = trendDates.map((dName, dIdx) => {
    const point: Record<string, any> = { date: dName };
    members.forEach((m) => {
      const memData = analytics[m.userId];
      const memberName = (m.userSnapshot?.displayName || memData?.displayName || "Member").split(" ")[0];
      const history = range === "7d" ? memData?.xpHistory7Days : memData?.xpHistory30Days;
      const historyItem = history?.[dIdx];

      let val = 0;
      if (historyItem) {
        val = historyItem.xp;
      } else {
        const total = m.userSnapshot?.totalXP || 100;
        val =
          range === "7d"
            ? Math.round(total * (0.05 + dIdx * 0.03))
            : Math.round(total * ((dIdx + 1) / trendDates.length));
      }
      point[memberName] = val;
    });
    return point;
  });

  // Task completion comparisons
  const taskCompletionData = members.map((m) => {
    const memData = analytics[m.userId];
    return {
      name: (m.userSnapshot?.displayName || "Member").split(" ")[0],
      tasks: m.userSnapshot?.tasksCompleted || 0,
      leetcode: memData?.leetcode?.totalSolved || 0,
      streak: m.userSnapshot?.streak || 1,
    };
  });

  // Personal vs Group Average computed dynamically
  const myAnalytics = analytics[currentUser.id];
  const myStreak = currentUser.streak?.current || 1;
  const myTotalXP = currentUser.totalXP || 0;
  const myTasks = participants.filter((p) => p.userId === currentUser.id && p.completed).length;
  const myLeetcode = myAnalytics?.leetcode?.totalSolved || currentUser.leetcodeStats?.totalSolved || 0;
  const myGithub = myAnalytics?.github?.totalContributionsYear || currentUser.githubStats?.totalContributions || 0;

  const squadStreaks = members.map((m) => m.userSnapshot?.streak || 1);
  const avgStreak = Math.max(1, Math.round(squadStreaks.reduce((a, b) => a + b, 0) / Math.max(members.length, 1)));

  const squadTasks = members.map((m) => m.userSnapshot?.tasksCompleted || 0);
  const avgTasks = Math.max(0, Math.round(squadTasks.reduce((a, b) => a + b, 0) / Math.max(members.length, 1)));

  const squadLeet = members.map((m) => analytics[m.userId]?.leetcode?.totalSolved || 0);
  const avgLeet = Math.max(0, Math.round(squadLeet.reduce((a, b) => a + b, 0) / Math.max(members.length, 1)));

  const squadXP = members.map((m) => m.userSnapshot?.totalXP || 0);
  const avgXP = Math.max(1, Math.round(squadXP.reduce((a, b) => a + b, 0) / Math.max(members.length, 1)));

  const radarComparisonData = [
    {
      metric: "Consistency Score",
      You: myAnalytics?.consistencyScore || Math.min(100, myStreak * 5 + 35),
      SquadAverage: Math.min(100, Math.round(avgStreak * 5 + 30)),
    },
    {
      metric: "Task Completion Rate",
      You: Math.min(100, Math.max(25, myTasks > 0 ? 85 : 45)),
      SquadAverage: Math.min(100, Math.max(25, avgTasks > 0 ? 75 : 40)),
    },
    {
      metric: "LeetCode Velocity",
      You: Math.min(100, Math.max(20, Math.round(myLeetcode * 2.8))),
      SquadAverage: Math.min(100, Math.max(20, Math.round(avgLeet * 2.8))),
    },
    {
      metric: "Git & Code Activity",
      You: Math.min(100, Math.max(25, Math.round((myGithub / 100) * 80))),
      SquadAverage: 65,
    },
    {
      metric: "Streak Endurance",
      You: Math.min(100, Math.max(20, myStreak * 9)),
      SquadAverage: Math.min(100, Math.max(20, avgStreak * 9)),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Squad Analytics & Velocity
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Aggregated trends, coding output, consistency metrics, and comparative milestones.
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#141416] border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setRange("7d")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              range === "7d" ? "bg-white text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            Past 7 Days
          </button>
          <button
            onClick={() => setRange("30d")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              range === "30d" ? "bg-white text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            Past 30 Days
          </button>
        </div>
      </div>

      {/* 1. Multi-member XP Velocity Line Chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="surface-card p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-white">
              Accumulated XP Trajectories
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Comparative progress across all {members.length} squad {members.length === 1 ? "member" : "members"}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
            {members.map((m, idx) => {
              const name = (m.userSnapshot?.displayName || "Member").split(" ")[0];
              const color = memberPalette[idx % memberPalette.length];
              return (
                <span key={m.userId} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span>{name}</span>
                </span>
              );
            })}
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={multiMemberTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#161618",
                  borderColor: "rgba(255,255,255,0.12)",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  color: "#ffffff",
                }}
              />
              {members.map((m, idx) => {
                const name = (m.userSnapshot?.displayName || "Member").split(" ")[0];
                const color = memberPalette[idx % memberPalette.length];
                return (
                  <Line
                    key={m.userId}
                    type="monotone"
                    dataKey={name}
                    stroke={color}
                    strokeWidth={idx === 0 ? 2.5 : 1.8}
                    dot={{ r: idx === 0 ? 3 : 2 }}
                    isAnimationActive={true}
                    animationDuration={1500 + idx * 100}
                    animationEasing="ease-out"
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 2. Task & Coding Volume Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Volume Completed */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="surface-card p-6"
        >
          <div className="mb-4">
            <h3 className="text-sm font-semibold tracking-tight text-white">
              Completed Tasks by Member
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Verified individual and shared task completions.
            </p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskCompletionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#161618",
                    borderColor: "rgba(255,255,255,0.12)",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                    color: "#ffffff",
                  }}
                />
                <Bar
                  dataKey="tasks"
                  fill="#ffffff"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={1400}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* LeetCode Solved Volume */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="surface-card p-6"
        >
          <div className="mb-4">
            <h3 className="text-sm font-semibold tracking-tight text-white">
              LeetCode Total Solved
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Problem solving totals across Easy, Medium, and Hard tiers.
            </p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskCompletionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#161618",
                    borderColor: "rgba(255,255,255,0.12)",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                    color: "#ffffff",
                  }}
                />
                <Bar
                  dataKey="leetcode"
                  fill="#a1a1aa"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={1600}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* 3. Personal Progress vs Group Average */}
      <div className="surface-card p-6 sm:p-8 space-y-4">
        <div className="pb-2">
          <h3 className="text-sm font-semibold tracking-tight text-white">
            Personal Progress vs Squad Average
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Indexed index ratings based on weekly pace, verification rates, and streaks.
          </p>
        </div>

        <div className="space-y-4 pt-2">
          {radarComparisonData.map((item) => (
            <div key={item.metric} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-white">{item.metric}</span>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-white">You: {item.You}</span>
                  <span className="text-zinc-500">Squad Avg: {item.SquadAverage}</span>
                </div>
              </div>

              <div className="relative w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 left-0 bg-zinc-600 rounded-full"
                  style={{ width: `${item.SquadAverage}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 left-0 bg-white rounded-full opacity-90"
                  style={{ width: `${item.You}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
