"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSync } from "@/context/SyncContext";
import { motion } from "framer-motion";
import { getLevelProgress } from "@/lib/constants";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { TiltCard } from "@/components/ui/TiltCard";
import { Task } from "@/types";
import {
  Flame,
  Trophy,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  Circle,
  Users,
  Calendar,
  Sparkles,
  Clock,
  ArrowRight,
  ChevronRight,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DashboardPage() {
  const {
    currentUser,
    members,
    tasks,
    participants,
    activities,
    analytics,
    toggleTaskCompletion,
  } = useSync();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activityFilter, setActivityFilter] = useState<"all" | "tasks" | "code">("all");

  const todayStr = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter((t) => t.scheduledDate === todayStr);

  const levelInfo = getLevelProgress(currentUser.totalXP);
  const userAnalytics = analytics[currentUser.id] || Object.values(analytics)[0];
  const chartData = userAnalytics?.xpHistory7Days || [];

  // Sort members by totalXP for compact leaderboard
  const sortedMembers = [...members].sort(
    (a, b) => (b.userSnapshot?.totalXP || 0) - (a.userSnapshot?.totalXP || 0)
  );

  const filteredActivities = activities.filter((act) => {
    if (activityFilter === "tasks") {
      return (
        act.type === "task_completed" || act.type === "squad_task_completed"
      );
    }
    if (activityFilter === "code") {
      return act.type === "leetcode_solved" || act.type === "github_push";
    }
    return true;
  });

  // Calculate greeting based on hour
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Greeting & Editorial Date Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">
            {formattedDate}
          </span>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mt-1">
            {greeting}, {currentUser.displayName.split(" ")[0]}.
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Your squad has completed 14 shared tasks this week. Keep the momentum alive.
          </p>
        </div>

        {/* Most Improved Member Callout */}
        <div className="flex items-center gap-3 p-3 px-4 rounded-2xl bg-[#141416] border border-white/[0.09] self-start md:self-auto">
          <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
              Most Improved this week
            </div>
            <div className="text-xs font-medium text-white flex items-center gap-1.5 mt-0.5">
              <span>Arun Patel</span>
              <span className="text-emerald-400 font-mono text-[11px]">(+38% XP)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Hero Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total XP & Weekly Change */}
        <TiltCard className="surface-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium tracking-tight">Total XP</span>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-mono">
              {currentUser.totalXP.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>+510 XP this week</span>
            </div>
          </div>
        </TiltCard>

        {/* Level Progression */}
        <TiltCard className="surface-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium tracking-tight">Level Progress</span>
            <span className="text-xs font-mono font-medium text-white">
              Lvl {levelInfo.currentLevel}
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline justify-between text-xs text-zinc-400 mb-2">
              <span className="text-lg sm:text-xl font-semibold text-white">
                {levelInfo.percentage}%
              </span>
              <span className="font-mono text-[11px]">
                {currentUser.totalXP} / {levelInfo.nextLevelXP} XP
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${levelInfo.percentage}%` }}
              />
            </div>
          </div>
        </TiltCard>

        {/* Squad Rank */}
        <TiltCard className="surface-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium tracking-tight">Squad Rank</span>
            <Trophy className="w-4 h-4 text-amber-300" />
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-mono">
              #1{" "}
              <span className="text-xs font-normal text-zinc-500">
                of {members.length}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              +1 spot climbed this week
            </div>
          </div>
        </TiltCard>

        {/* Active Streak */}
        <TiltCard className="surface-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium tracking-tight">Active Streak</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-mono">
              {currentUser.streak.current}{" "}
              <span className="text-xs font-normal text-zinc-500">days</span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              Personal best: {currentUser.streak.longest} days
            </div>
          </div>
        </TiltCard>
      </div>

      {/* 3. Seven-Day Interactive XP Progress Chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="surface-card p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-white">
              7-Day XP & Progress Velocity
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Daily accumulated XP through tasks, coding challenges, and squad milestones.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-white" />
              <span>Earned XP</span>
            </div>
            <Link
              href="/analytics"
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Full Analytics</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="monochromeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                stroke="#52525b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#52525b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#161618",
                  borderColor: "rgba(255,255,255,0.12)",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  color: "#ffffff",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                }}
                itemStyle={{ color: "#ffffff" }}
              />
              <Area
                type="monotone"
                dataKey="xp"
                stroke="#ffffff"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#monochromeGradient)"
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
                activeDot={{ r: 5, fill: "#ffffff", stroke: "#000000", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 4. Main Two-Column Layout: Today's Schedule & Squad Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <h3 className="text-sm font-semibold tracking-tight text-white">
                Today’s Schedule
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-mono">
                {todayTasks.length}
              </span>
            </div>

            <Link
              href="/schedule"
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>View Calendar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {todayTasks.length === 0 ? (
              <div className="surface-card p-8 text-center text-zinc-500 text-xs">
                No tasks scheduled for today. Create one to get started!
              </div>
            ) : (
              todayTasks.map((task) => {
                const assignedParts = task.assignedParticipantIds.map((uid) =>
                  participants.find(
                    (p) => p.taskId === task.id && p.userId === uid
                  )
                );
                const totalAssigned = task.assignedParticipantIds.length;
                const completedCount = assignedParts.filter((p) => p?.completed).length;

                const myParticipant = participants.find(
                  (p) => p.taskId === task.id && p.userId === currentUser.id
                );
                const isMyComplete = myParticipant?.completed || false;
                const isAssignedToMe = task.assignedParticipantIds.includes(currentUser.id);

                return (
                  <TiltCard
                    key={task.id}
                    maxTilt={3}
                    className="surface-card-hover p-4 flex items-center justify-between gap-4 cursor-pointer"
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Checkbox toggle for current user */}
                      {isAssignedToMe ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskCompletion(task.id);
                          }}
                          className="shrink-0 p-1 text-zinc-400 hover:text-white transition-colors"
                        >
                          {isMyComplete ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Circle className="w-5 h-5 text-zinc-500 hover:text-zinc-300" />
                          )}
                        </button>
                      ) : (
                        <div className="w-5 h-5 shrink-0" />
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-sm font-medium tracking-tight truncate ${
                              isMyComplete
                                ? "line-through text-zinc-500"
                                : "text-white"
                            }`}
                          >
                            {task.title}
                          </h4>
                          {task.priority === "high" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1">
                          {task.scheduledTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-zinc-500" />
                              {task.scheduledTime}
                            </span>
                          )}

                          {totalAssigned > 1 && (
                            <span className="flex items-center gap-1 text-zinc-400">
                              <Users className="w-3 h-3 text-zinc-500" />
                              {completedCount} of {totalAssigned} finished
                            </span>
                          )}

                          <span className="font-mono text-zinc-500">
                            +{task.xpReward} XP
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {totalAssigned > 1 && (
                        <div className="hidden sm:flex -space-x-1.5">
                          {task.assignedParticipantIds.slice(0, 3).map((uid) => {
                            const userPart = participants.find(
                              (p) => p.taskId === task.id && p.userId === uid
                            );
                            return (
                              <div
                                key={uid}
                                className={`w-5 h-5 rounded-full border border-black flex items-center justify-center text-[9px] font-medium ${
                                  userPart?.completed
                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                    : "bg-white/10 text-zinc-400"
                                }`}
                              >
                                {uid.split("-")[1]?.charAt(0).toUpperCase()}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <ChevronRight className="w-4 h-4 text-zinc-600" />
                    </div>
                  </TiltCard>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Compact Squad Leaderboard */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-zinc-400" />
              <h3 className="text-sm font-semibold tracking-tight text-white">
                Squad Leaderboard
              </h3>
            </div>
            <Link
              href="/leaderboard"
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Full Board</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="surface-card p-3 divide-y divide-white/5">
            {sortedMembers.map((member, index) => {
              const isCurrent = member.userId === currentUser.id;
              return (
                <div
                  key={member.userId}
                  className={`p-2.5 flex items-center justify-between rounded-xl transition-colors ${
                    isCurrent ? "bg-white/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-4 text-center font-mono text-xs font-semibold text-zinc-500">
                      #{index + 1}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={member.userSnapshot?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                      alt={member.userSnapshot?.displayName || "Member"}
                      className="w-7 h-7 rounded-full object-cover border border-white/10"
                    />
                    <div>
                      <div className="text-xs font-medium text-white flex items-center gap-1">
                        <span>{member.userSnapshot?.displayName || "Member"}</span>
                        {isCurrent && (
                          <span className="text-[10px] text-zinc-400">
                            (You)
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {member.userSnapshot?.streak || 1} day streak
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono font-medium text-white">
                      {(member.userSnapshot?.totalXP || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      Lvl {member.userSnapshot?.level || 1}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Live Squad Activity Feed */}
      <div className="surface-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-white">
              Squad Activity Feed
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live updates of tasks finished, problems solved, and squad milestones.
            </p>
          </div>

          <div className="flex gap-1.5">
            {(["all", "tasks", "code"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActivityFilter(tab)}
                className={`px-3 py-1 rounded-lg text-xs capitalize transition-colors ${
                  activityFilter === tab
                    ? "bg-white/10 text-white font-medium"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab === "code" ? "Coding" : tab}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-white/5 pt-1">
          {filteredActivities.slice(0, 5).map((activity) => (
            <div
              key={activity.id}
              className="py-3 flex items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activity.userPhotoURL}
                  alt={activity.userName}
                  className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0"
                />
                <div className="truncate">
                  <span className="font-medium text-white">
                    {activity.userName}
                  </span>{" "}
                  <span className="text-zinc-400">{activity.description}</span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {activity.xpAwarded > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px] font-medium">
                    +{activity.xpAwarded} XP
                  </span>
                )}
                <span className="text-[10px] text-zinc-500">
                  {activity.timestamp}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Details Modal */}
      <TaskDetailModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}
