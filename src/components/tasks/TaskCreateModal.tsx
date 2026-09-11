"use client";

import React, { useState } from "react";
import { useSync } from "@/context/SyncContext";
import { TaskRepeat, TaskVisibility, TaskPriority } from "@/types";
import { X, Calendar, Clock, AlertCircle, Sparkles, Users, Lock, Globe } from "lucide-react";

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TaskCreateModal({ isOpen, onClose }: TaskCreateModalProps) {
  const { createTask, members, challenges } = useSync();

  const todayStr = new Date().toISOString().split("T")[0];
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [scheduledDate, setScheduledDate] = useState(todayStr);
  const [scheduledTime, setScheduledTime] = useState("14:00");
  const [hasDeadline, setHasDeadline] = useState(true);
  const [deadlineTime, setDeadlineTime] = useState("20:00");
  const [repeat, setRepeat] = useState<TaskRepeat>("never");
  const [visibility, setVisibility] = useState<TaskVisibility>("group");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    members.map((m) => m.userId)
  );
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [challengeId, setChallengeId] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTask({
      title: title.trim(),
      notes: notes.trim() || undefined,
      scheduledDate,
      scheduledTime,
      deadline: hasDeadline ? `${scheduledDate}T${deadlineTime}:00Z` : undefined,
      repeat,
      visibility,
      assignedParticipantIds:
        visibility === "only_me"
          ? []
          : visibility === "selected"
          ? selectedParticipants
          : members.map((m) => m.userId),
      priority,
      challengeId: challengeId || undefined,
    });

    onClose();
    setTitle("");
    setNotes("");
  };

  const toggleParticipant = (userId: string) => {
    if (selectedParticipants.includes(userId)) {
      if (selectedParticipants.length > 1) {
        setSelectedParticipants(selectedParticipants.filter((id) => id !== userId));
      }
    } else {
      setSelectedParticipants([...selectedParticipants, userId]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#111111] border border-white/10 shadow-2xl p-6 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-white">
              Schedule New Task
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Create a personal or squad task with participant-based tracking.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed Systems Chapter 4 Revision"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c1c1e] border border-white/10 text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Notes & Deliverables (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Add key objectives, links to review notes, or problem sets..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c1c1e] border border-white/10 text-white placeholder:text-zinc-600 text-xs focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {/* Schedule Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                Date
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c1e] border border-white/10 text-white text-xs focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                Time
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c1e] border border-white/10 text-white text-xs focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          {/* Deadline & Repeat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  Target Deadline
                </label>
                <input
                  type="checkbox"
                  checked={hasDeadline}
                  onChange={(e) => setHasDeadline(e.target.checked)}
                  className="rounded border-white/20 bg-[#1c1c1e]"
                />
              </div>
              {hasDeadline ? (
                <input
                  type="time"
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c1e] border border-white/10 text-white text-xs focus:outline-none focus:border-white/30"
                />
              ) : (
                <div className="px-3 py-2 rounded-xl bg-[#1c1c1e]/40 border border-white/5 text-zinc-500 text-xs">
                  No strict deadline
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Repeat Frequency
              </label>
              <select
                value={repeat}
                onChange={(e) => setRepeat(e.target.value as TaskRepeat)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c1e] border border-white/10 text-white text-xs focus:outline-none focus:border-white/30"
              >
                <option value="never">Never (Single task)</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">
              Visibility & Participants
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setVisibility("group")}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs transition-colors ${
                  visibility === "group"
                    ? "bg-white/10 border-white/30 text-white font-medium"
                    : "bg-[#1c1c1e] border-white/10 text-zinc-400 hover:text-white"
                }`}
              >
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>All Squad</span>
              </button>
              <button
                type="button"
                onClick={() => setVisibility("selected")}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs transition-colors ${
                  visibility === "selected"
                    ? "bg-white/10 border-white/30 text-white font-medium"
                    : "bg-[#1c1c1e] border-white/10 text-zinc-400 hover:text-white"
                }`}
              >
                <Users className="w-4 h-4 text-sky-400" />
                <span>Selected</span>
              </button>
              <button
                type="button"
                onClick={() => setVisibility("only_me")}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs transition-colors ${
                  visibility === "only_me"
                    ? "bg-white/10 border-white/30 text-white font-medium"
                    : "bg-[#1c1c1e] border-white/10 text-zinc-400 hover:text-white"
                }`}
              >
                <Lock className="w-4 h-4 text-zinc-400" />
                <span>Only Me</span>
              </button>
            </div>
          </div>

          {/* Participant Picker (if selected) */}
          {visibility === "selected" && (
            <div className="p-3 rounded-xl bg-[#1c1c1e] border border-white/10">
              <span className="text-[11px] font-medium text-zinc-400 block mb-2">
                Assign Participants (individual completion tracked)
              </span>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => {
                  const isSelected = selectedParticipants.includes(m.userId);
                  return (
                    <button
                      key={m.userId}
                      type="button"
                      onClick={() => toggleParticipant(m.userId)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors ${
                        isSelected
                          ? "bg-white text-black font-medium"
                          : "bg-white/5 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <span>{m.userSnapshot.displayName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Priority & Challenge Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Priority
              </label>
              <div className="flex gap-2">
                {(["low", "medium", "high"] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-1.5 capitalize rounded-lg text-xs border transition-colors ${
                      priority === p
                        ? "bg-white/15 border-white/30 text-white font-medium"
                        : "bg-[#1c1c1e] border-white/10 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Link to Challenge
              </label>
              <select
                value={challengeId}
                onChange={(e) => setChallengeId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c1e] border border-white/10 text-white text-xs focus:outline-none focus:border-white/30"
              >
                <option value="">None</option>
                {challenges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reward Summary Pill */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
            <div className="flex items-center gap-2 text-zinc-300">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Potential Earned Reward</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-white">+20 Base</span>
              {hasDeadline && <span className="text-zinc-400">+10 Early</span>}
              {visibility !== "only_me" && (
                <span className="text-emerald-400">+30 Squad Bonus</span>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-medium transition-colors shadow-sm"
            >
              Schedule Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
