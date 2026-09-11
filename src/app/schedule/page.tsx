"use client";

import React, { useState } from "react";
import { useSync } from "@/context/SyncContext";
import { Task } from "@/types";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { TiltCard } from "@/components/ui/TiltCard";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  CheckCircle2,
  Circle,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Lock,
  Globe,
} from "lucide-react";

type ScheduleView = "day" | "week" | "month" | "list";
type FilterType = "all" | "mine" | "shared" | "today" | "completed" | "overdue";

export default function SchedulePage() {
  const {
    tasks,
    participants,
    currentUser,
    toggleTaskCompletion,
  } = useSync();

  const [currentView, setCurrentView] = useState<ScheduleView>("list");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  // Filtering
  const filteredTasks = tasks.filter((task) => {
    // Search query filter
    if (
      searchQuery &&
      !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !task.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    const isAssigned = task.assignedParticipantIds.includes(currentUser.id);
    const myParticipant = participants.find(
      (p) => p.taskId === task.id && p.userId === currentUser.id
    );
    const isCompleted = myParticipant?.completed || false;

    if (activeFilter === "mine") {
      return task.visibility === "only_me" || task.creatorId === currentUser.id;
    }
    if (activeFilter === "shared") {
      return task.visibility !== "only_me";
    }
    if (activeFilter === "today") {
      return task.scheduledDate === todayStr;
    }
    if (activeFilter === "completed") {
      return isCompleted;
    }
    if (activeFilter === "overdue") {
      return !isCompleted && task.scheduledDate < todayStr;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Schedule & Squad Tasks
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Personal agendas and collaborative squad timelines with participant tracking.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#141416] border border-white/10 self-start sm:self-auto">
          {(["day", "week", "month", "list"] as ScheduleView[]).map((view) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                currentView === view
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
          {(
            [
              { key: "all", label: "All Tasks" },
              { key: "today", label: "Due Today" },
              { key: "shared", label: "Shared Squad" },
              { key: "mine", label: "Personal" },
              { key: "completed", label: "Completed" },
              { key: "overdue", label: "Overdue" },
            ] as { key: FilterType; label: string }[]
          ).map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                activeFilter === filter.key
                  ? "bg-white/15 border-white/20 text-white font-medium"
                  : "bg-[#141416] border-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#141416] border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
          />
        </div>
      </div>

      {/* View Renderings */}
      {currentView === "list" && (
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="surface-card p-12 text-center space-y-2">
              <CalendarIcon className="w-8 h-8 text-zinc-600 mx-auto" />
              <h4 className="text-sm font-semibold text-white">No tasks found</h4>
              <p className="text-xs text-zinc-500">
                Try switching filters or schedule a new task.
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => {
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
              const isOverdue = !isMyComplete && task.scheduledDate < todayStr;

              return (
                <TiltCard
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="surface-card-hover p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* Completion Checkbox */}
                    {isAssignedToMe ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskCompletion(task.id);
                        }}
                        className="p-1 text-zinc-400 hover:text-white transition-colors shrink-0 mt-0.5"
                      >
                        {isMyComplete ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-zinc-600 hover:text-zinc-400" />
                        )}
                      </button>
                    ) : (
                      <div className="w-5 h-5 shrink-0" />
                    )}

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`text-sm font-semibold tracking-tight truncate ${
                            isMyComplete
                              ? "line-through text-zinc-500"
                              : "text-white"
                          }`}
                        >
                          {task.title}
                        </h3>

                        {task.visibility === "only_me" ? (
                          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] text-zinc-400 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            Personal
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 flex items-center gap-1">
                            <Globe className="w-2.5 h-2.5" />
                            Squad
                          </span>
                        )}

                        {isOverdue && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-400">
                            Overdue
                          </span>
                        )}
                      </div>

                      {task.notes && (
                        <p className="text-xs text-zinc-400 line-clamp-1">
                          {task.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-zinc-500 pt-0.5">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3 text-zinc-500" />
                          {task.scheduledDate === todayStr
                            ? "Today"
                            : task.scheduledDate}
                        </span>

                        {task.scheduledTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            {task.scheduledTime}
                          </span>
                        )}

                        {totalAssigned > 1 && (
                          <span className="flex items-center gap-1 text-zinc-400 font-mono">
                            <Users className="w-3 h-3 text-zinc-500" />
                            {completedCount}/{totalAssigned} Done
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:self-center pl-8 sm:pl-0">
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white">
                      +{task.xpReward} XP
                    </span>
                  </div>
                </TiltCard>
              );
            })
          )}
        </div>
      )}

      {/* Day View Timeline */}
      {currentView === "day" && (
        <div className="surface-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">
              Today’s Hour-by-Hour Timeline ({todayStr})
            </h3>
          </div>

          <div className="space-y-4 divide-y divide-white/5">
            {["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"].map(
              (hour) => {
                const hourTasks = tasks.filter(
                  (t) =>
                    t.scheduledDate === todayStr &&
                    t.scheduledTime &&
                    t.scheduledTime.startsWith(hour.slice(0, 2))
                );

                return (
                  <div key={hour} className="pt-3 flex items-start gap-4">
                    <span className="w-14 text-xs font-mono text-zinc-500">
                      {hour}
                    </span>
                    <div className="flex-1 space-y-2">
                      {hourTasks.length === 0 ? (
                        <div className="h-6 border-b border-white/[0.04]" />
                      ) : (
                        hourTasks.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => setSelectedTask(t)}
                            className="p-3 rounded-xl bg-[#1c1c1e] border border-white/10 hover:border-white/25 cursor-pointer text-xs flex items-center justify-between"
                          >
                            <span className="font-medium text-white">
                              {t.title}
                            </span>
                            <span className="font-mono text-zinc-400">
                              +{t.xpReward} XP
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* Week Calendar Grid */}
      {currentView === "week" && (
        <div className="surface-card p-6">
          <div className="grid grid-cols-7 gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
              <div
                key={d}
                className="p-3 rounded-xl bg-[#161618] border border-white/5 min-h-[160px] flex flex-col justify-between"
              >
                <div>
                  <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    {d}
                  </div>
                  <div className="text-xs font-mono text-zinc-500 mt-0.5">
                    Sept {8 + i}
                  </div>
                </div>

                <div className="space-y-1 mt-2">
                  {i === 3 && (
                    <div className="p-1.5 rounded-lg bg-white/10 border border-white/15 text-[10px] text-white">
                      ETM Review
                    </div>
                  )}
                  {i === 3 && (
                    <div className="p-1.5 rounded-lg bg-white/10 border border-white/15 text-[10px] text-white">
                      DBMS 3NF
                    </div>
                  )}
                  {i === 4 && (
                    <div className="p-1.5 rounded-lg bg-white/5 text-[10px] text-zinc-300">
                      System Arch
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Month Calendar Grid */}
      {currentView === "month" && (
        <div className="surface-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">
              September 2026
            </h3>
            <span className="text-xs text-zinc-500">30 Days</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div key={i} className="text-[10px] text-zinc-500 font-semibold py-1">
                {d}
              </div>
            ))}
            {Array.from({ length: 30 }, (_, i) => {
              const dayNum = i + 1;
              const hasTask = dayNum === 10 || dayNum === 11 || dayNum === 12;
              const isCurrent = dayNum === 11;

              return (
                <div
                  key={dayNum}
                  className={`p-2 rounded-xl text-xs flex flex-col items-center justify-center min-h-[46px] border ${
                    isCurrent
                      ? "bg-white text-black font-semibold border-white"
                      : hasTask
                      ? "bg-[#1c1c1e] text-white border-white/10"
                      : "bg-[#141416]/50 text-zinc-500 border-white/5"
                  }`}
                >
                  <span>{dayNum}</span>
                  {hasTask && !isCurrent && (
                    <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      <TaskDetailModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}
