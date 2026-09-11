"use client";

import React, { useState } from "react";
import { useSync } from "@/context/SyncContext";
import { ChallengeMetric, Challenge } from "@/types";
import { TiltCard } from "@/components/ui/TiltCard";
import {
  Trophy,
  Plus,
  Calendar,
  Sparkles,
  CheckCircle2,
  Users,
  Code2,
  GitCommit,
  Flame,
  X,
} from "lucide-react";

export default function ChallengesPage() {
  const { challenges, members, createChallenge, allUsers } = useSync();
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [metric, setMetric] = useState<ChallengeMetric>("leetcode_solved");
  const [targetValue, setTargetValue] = useState(30);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]
  );

  const filteredChallenges = challenges.filter((c) =>
    activeTab === "active" ? c.status === "active" : c.status === "completed"
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createChallenge({
      title: title.trim(),
      description: description.trim(),
      startDate: new Date().toISOString().split("T")[0],
      endDate,
      metric,
      targetValue: Number(targetValue),
      participantIds: members.map((m) => m.userId),
    });

    setIsCreateOpen(false);
    setTitle("");
    setDescription("");
  };

  const getMetricIcon = (m: ChallengeMetric) => {
    switch (m) {
      case "leetcode_solved":
        return <Code2 className="w-4 h-4 text-amber-400" />;
      case "github_contributions":
        return <GitCommit className="w-4 h-4 text-emerald-400" />;
      case "xp_gained":
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-white" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Squad Challenges
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Timed sprints and collective milestones with 100 XP bounties.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Active / Completed Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#141416] border border-white/10">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === "active"
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Active ({challenges.filter((c) => c.status === "active").length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === "completed"
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Completed ({challenges.filter((c) => c.status === "completed").length})
            </button>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Challenge</span>
          </button>
        </div>
      </div>

      {/* Challenges List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredChallenges.length === 0 ? (
          <div className="md:col-span-2 surface-card p-12 text-center text-zinc-500 text-xs">
            No {activeTab} challenges found. Create a sprint to motivate your squad!
          </div>
        ) : (
          filteredChallenges.map((challenge) => {
            const isCompleted = challenge.status === "completed";
            const winner = challenge.winnerId ? allUsers[challenge.winnerId] : null;

            return (
              <TiltCard
                key={challenge.id}
                className="surface-card p-6 flex flex-col justify-between space-y-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                        {getMetricIcon(challenge.metric)}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white">
                          {challenge.title}
                        </h3>
                        <span className="text-[11px] text-zinc-400">
                          Target: {challenge.targetValue}{" "}
                          {challenge.metric.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white font-mono text-xs font-medium">
                      +{challenge.xpReward} XP Bounty
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                    {challenge.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-zinc-500 mt-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      Ends {challenge.endDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-zinc-500" />
                      {challenge.participantIds.length} Squad Members
                    </span>
                  </div>
                </div>

                {/* Progress breakdown for each participant */}
                <div className="pt-3 border-t border-white/5 space-y-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">
                    Participant Live Progress
                  </span>

                  <div className="space-y-2">
                    {challenge.participantIds.map((uid) => {
                      const user = allUsers[uid];
                      const val = challenge.currentProgress?.[uid] || 0;
                      const pct = Math.min(
                        100,
                        Math.round((val / challenge.targetValue) * 100)
                      );

                      return (
                        <div key={uid} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-300 font-medium">
                              {user?.displayName || "Member"}
                            </span>
                            <span className="font-mono text-zinc-400">
                              {val} / {challenge.targetValue} ({pct}%)
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                pct >= 100 ? "bg-emerald-400" : "bg-white"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {isCompleted && winner && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-300 font-medium">
                        <Trophy className="w-4 h-4" />
                        <span>Winner: {winner.displayName}</span>
                      </div>
                      <span className="font-mono text-white">
                        +{challenge.xpReward} XP Awarded
                      </span>
                    </div>
                  )}
                </div>
              </TiltCard>
            );
          })
        )}
      </div>

      {/* Create Challenge Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#111111] border border-white/10 shadow-2xl p-6 text-white">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-base font-semibold tracking-tight">
                Create Squad Challenge
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Challenge Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 50 LeetCode Mediums Sprint"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c1c1e] border border-white/10 text-white text-xs focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Rules, guidelines, and eligible problem categories..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c1e] border border-white/10 text-white text-xs focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Metric Target
                  </label>
                  <select
                    value={metric}
                    onChange={(e) =>
                      setMetric(e.target.value as ChallengeMetric)
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c1e] border border-white/10 text-white text-xs focus:outline-none"
                  >
                    <option value="leetcode_solved">LeetCode Problems</option>
                    <option value="github_contributions">
                      GitHub Commits
                    </option>
                    <option value="tasks_completed">Completed Tasks</option>
                    <option value="xp_gained">Total XP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Target Goal
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={targetValue}
                    onChange={(e) => setTargetValue(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c1e] border border-white/10 text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c1e] border border-white/10 text-white text-xs focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                <span className="text-zinc-400">Winner Reward:</span>
                <span className="font-mono text-emerald-400 font-medium">
                  +100 XP Bounty
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold"
                >
                  Launch Challenge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
