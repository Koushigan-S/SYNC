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
  const { members, analytics, currentUser } = useSync();
  const [range, setRange] = useState<"7d" | "30d">("7d");

  // Multi-member XP trend dataset for 7 days
  const multiMember7Days = [
    { date: "Fri", Nova: 60, Rahul: 50, Arun: 40, Karthik: 20 },
    { date: "Sat", Nova: 45, Rahul: 70, Arun: 30, Karthik: 35 },
    { date: "Sun", Nova: 75, Rahul: 40, Arun: 50, Karthik: 30 },
    { date: "Mon", Nova: 90, Rahul: 85, Arun: 60, Karthik: 50 },
    { date: "Tue", Nova: 65, Rahul: 60, Arun: 70, Karthik: 45 },
    { date: "Wed", Nova: 85, Rahul: 75, Arun: 65, Karthik: 50 },
    { date: "Thu", Nova: 90, Rahul: 60, Arun: 65, Karthik: 60 },
  ];

  // Task completion comparisons
  const taskCompletionData = members.map((m) => {
    const memData = analytics[m.userId];
    return {
      name: m.userSnapshot.displayName.split(" ")[0],
      tasks: m.userSnapshot.tasksCompleted || 25,
      leetcode: memData?.leetcode.totalSolved || 0,
      streak: m.userSnapshot.streak,
    };
  });

  // Personal vs Group Average
  const radarComparisonData = [
    { metric: "Daily XP", You: 82, SquadAverage: 65 },
    { metric: "Task Finish %", You: 94, SquadAverage: 81 },
    { metric: "LeetCode Velocity", You: 88, SquadAverage: 76 },
    { metric: "Git Consistency", You: 96, SquadAverage: 82 },
    { metric: "Active Streak", You: 90, SquadAverage: 70 },
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
              Comparative progress across all 4 squad members.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-white" /> Nova
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" /> Rahul
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" /> Arun
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" /> Karthik
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={multiMember7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              <Line
                type="monotone"
                dataKey="Nova"
                stroke="#ffffff"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
              />
              <Line
                type="monotone"
                dataKey="Rahul"
                stroke="#a1a1aa"
                strokeWidth={1.8}
                dot={{ r: 2.5 }}
                isAnimationActive={true}
                animationDuration={1600}
                animationEasing="ease-out"
              />
              <Line
                type="monotone"
                dataKey="Arun"
                stroke="#71717a"
                strokeWidth={1.5}
                dot={{ r: 2 }}
                isAnimationActive={true}
                animationDuration={1700}
                animationEasing="ease-out"
              />
              <Line
                type="monotone"
                dataKey="Karthik"
                stroke="#52525b"
                strokeWidth={1.5}
                dot={{ r: 2 }}
                isAnimationActive={true}
                animationDuration={1800}
                animationEasing="ease-out"
              />
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
