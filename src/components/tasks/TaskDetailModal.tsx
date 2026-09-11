"use client";

import React from "react";
import { useSync } from "@/context/SyncContext";
import { Task } from "@/types";
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Users,
  Sparkles,
  Trash2,
  Lock,
  Globe,
} from "lucide-react";

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
}

export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const {
    currentUser,
    allUsers,
    participants,
    toggleTaskCompletion,
    deleteTask,
  } = useSync();

  if (!task) return null;

  const assignedParticipants = task.assignedParticipantIds.map((uid) => {
    const partRecord = participants.find(
      (p) => p.taskId === task.id && p.userId === uid
    );
    const userProfile = allUsers[uid];
    return {
      userId: uid,
      displayName: userProfile?.displayName || "Member",
      photoURL: userProfile?.photoURL || "",
      completed: partRecord ? partRecord.completed : false,
      completedAt: partRecord?.completedAt,
    };
  });

  const totalAssigned = assignedParticipants.length;
  const completedCount = assignedParticipants.filter((p) => p.completed).length;
  const percentage = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

  const currentUserParticipant = assignedParticipants.find(
    (p) => p.userId === currentUser.id
  );
  const isCurrentUserCompleted = currentUserParticipant?.completed || false;
  const isCreator = task.creatorId === currentUser.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#111111] border border-white/10 shadow-2xl p-6 text-white">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                  task.priority === "high"
                    ? "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                    : task.priority === "medium"
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                    : "bg-zinc-500/15 text-zinc-400 border border-zinc-500/20"
                }`}
              >
                {task.priority} Priority
              </span>

              {task.visibility === "only_me" ? (
                <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <Lock className="w-3 h-3" />
                  Personal Task
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <Globe className="w-3 h-3 text-emerald-400" />
                  Squad Task
                </span>
              )}
            </div>

            <h3 className="text-lg font-semibold tracking-tight text-white">
              {task.title}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Scheduled by {task.creatorName}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-5">
          {/* Notes */}
          {task.notes && (
            <div className="p-3.5 rounded-xl bg-[#1c1c1e] border border-white/5 text-xs text-zinc-300 leading-relaxed">
              {task.notes}
            </div>
          )}

          {/* Time & Deadline info */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>{task.scheduledDate}</span>
            </div>
            {task.scheduledTime && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>{task.scheduledTime}</span>
              </div>
            )}
            {task.repeat !== "never" && (
              <span className="px-2 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/5 text-[10px]">
                Repeats {task.repeat}
              </span>
            )}
          </div>

          {/* Participant Breakdown (Critical requirement) */}
          <div className="p-4 rounded-xl bg-[#161618] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-semibold text-white">
                  Squad Participation
                </span>
              </div>
              <span className="text-xs font-mono font-medium text-zinc-300">
                {completedCount} of {totalAssigned} completed ({percentage}%)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  percentage === 100 ? "bg-emerald-400" : "bg-white"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Participant List */}
            <div className="divide-y divide-white/5 pt-1">
              {assignedParticipants.map((participant) => {
                const isYou = participant.userId === currentUser.id;
                return (
                  <div
                    key={participant.userId}
                    className="flex items-center justify-between py-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={participant.photoURL}
                        alt={participant.displayName}
                        className="w-6 h-6 rounded-full object-cover border border-white/15"
                      />
                      <div className="flex flex-col">
                        <span className="text-zinc-200 font-medium">
                          {participant.displayName} {isYou && "(You)"}
                        </span>
                        {participant.completed && participant.completedAt && (
                          <span className="text-[10px] text-zinc-500">
                            Completed at{" "}
                            {new Date(participant.completedAt).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {participant.completed ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          Done
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-zinc-500 text-xs">
                          <Circle className="w-3.5 h-3.5" />
                          In progress
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Squad Bonus Callout */}
            {totalAssigned > 1 && (
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Full Squad Completion Bonus</span>
                </div>
                <span
                  className={`font-mono font-medium ${
                    percentage === 100 ? "text-emerald-400" : "text-zinc-400"
                  }`}
                >
                  {percentage === 100 ? "Awarded (+30 XP each)" : "+30 XP when all finish"}
                </span>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            {isCreator ? (
              <button
                onClick={() => {
                  deleteTask(task.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Task</span>
              </button>
            ) : (
              <div />
            )}

            {/* Only current user can toggle their own completion */}
            {task.assignedParticipantIds.includes(currentUser.id) ? (
              <button
                onClick={() => toggleTaskCompletion(task.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium transition-all shadow-md ${
                  isCurrentUserCompleted
                    ? "bg-white/10 hover:bg-white/15 text-zinc-300 border border-white/15"
                    : "bg-white hover:bg-zinc-200 text-black font-semibold"
                }`}
              >
                {isCurrentUserCompleted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Completed · Undo</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark My Part Done (+20 XP)</span>
                  </>
                )}
              </button>
            ) : (
              <span className="text-xs text-zinc-500">
                You are not an assigned participant for this task.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
