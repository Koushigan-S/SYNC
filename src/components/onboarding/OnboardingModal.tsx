"use client";

import React, { useState } from "react";
import { useSync } from "@/context/SyncContext";
import {
  X,
  Sparkles,
  Users,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { DEMO_INVITE_CODE } from "@/lib/constants";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const { createGroup, joinGroupWithCode, createTask, addToast } = useSync();

  const [step, setStep] = useState(1);
  const [groupChoice, setGroupChoice] = useState<"create" | "join">("create");
  const [groupName, setGroupName] = useState("Alpha Squad");
  const [groupImage, setGroupImage] = useState("");
  const [inviteCodeInput, setInviteCodeInput] = useState(DEMO_INVITE_CODE);
  const [copied, setCopied] = useState(false);
  const [firstTaskTitle, setFirstTaskTitle] = useState("Solve 2 LeetCode Mediums & Push to GitHub");

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(DEMO_INVITE_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFinish = () => {
    if (groupChoice === "create" && groupName.trim()) {
      createGroup(groupName.trim(), undefined, groupImage || undefined);
    } else if (groupChoice === "join" && inviteCodeInput.trim()) {
      joinGroupWithCode(inviteCodeInput.trim());
    }

    if (firstTaskTitle.trim()) {
      createTask({
        title: firstTaskTitle.trim(),
        scheduledDate: new Date().toISOString().split("T")[0],
        repeat: "never",
        visibility: "only_me",
        assignedParticipantIds: [],
        priority: "medium",
      });
    }

    addToast({
      title: "Welcome to SYNC! 🚀",
      description: "You're all set up. Progress is better together.",
      type: "success",
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#111111] border border-white/10 shadow-2xl p-6 text-white">
        {/* Header with step indicators */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <span
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? "w-6 bg-white"
                    : s < step
                    ? "w-3 bg-zinc-500"
                    : "w-3 bg-zinc-800"
                }`}
              />
            ))}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white text-black font-bold text-2xl flex items-center justify-center mx-auto shadow-xl">
              S
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Welcome to SYNC
              </h2>
              <p className="text-sm text-zinc-400 italic mt-1 font-serif">
                “Progress is better together.”
              </p>
            </div>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
              A private productivity and healthy-competition platform for close friends. Shared schedules, participant-level verification, LeetCode & GitHub stats, and squad bonuses.
            </p>
          </div>
        )}

        {/* Step 2: Create or Join */}
        {step === 2 && (
          <div className="py-6 space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold tracking-tight">
                Squad Setup
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Join an existing circle of friends or start a new private squad.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGroupChoice("create")}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-colors ${
                  groupChoice === "create"
                    ? "bg-white/10 border-white/30 text-white"
                    : "bg-[#1c1c1e] border-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                <Sparkles className="w-5 h-5 text-amber-300 mb-3" />
                <div>
                  <div className="text-xs font-semibold text-white">
                    Create Squad
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    Start fresh with your friends
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setGroupChoice("join")}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-colors ${
                  groupChoice === "join"
                    ? "bg-white/10 border-white/30 text-white"
                    : "bg-[#1c1c1e] border-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                <Users className="w-5 h-5 text-sky-400 mb-3" />
                <div>
                  <div className="text-xs font-semibold text-white">
                    Join with Code
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    Enter an existing invite
                  </div>
                </div>
              </button>
            </div>

            {groupChoice === "join" && (
              <div className="pt-2">
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Enter Squad Invite Code
                </label>
                <input
                  type="text"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value)}
                  placeholder="e.g. SYNC-FOUNDERS-2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c1c1e] border border-white/10 text-white text-xs uppercase font-mono tracking-wider focus:outline-none focus:border-white/30"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Group Details */}
        {step === 3 && (
          <div className="py-6 space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold tracking-tight">
                {groupChoice === "create" ? "Name Your Squad" : "Squad Details"}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Give your group an identity.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Squad Name *
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Founders Squad, Algorithms Crew"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c1c1e] border border-white/10 text-white text-xs focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Cover Image URL (Optional)
              </label>
              <input
                type="text"
                value={groupImage}
                onChange={(e) => setGroupImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c1c1e] border border-white/10 text-white text-xs focus:outline-none focus:border-white/30"
              />
            </div>
          </div>
        )}

        {/* Step 4: Invite Friends */}
        {step === 4 && (
          <div className="py-6 space-y-4 text-center">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">
                Invite Your Friends
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Share this unique invite code with the members you want in your squad.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#1c1c1e] border border-white/10 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">
                  Invite Code
                </span>
                <span className="font-mono text-base font-bold text-white tracking-wider">
                  {DEMO_INVITE_CODE}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Set First Goal */}
        {step === 5 && (
          <div className="py-6 space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold tracking-tight">
                Set Your First Goal
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Kick off your personal streak with an achievable target for today.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                First Task
              </label>
              <input
                type="text"
                value={firstTaskTitle}
                onChange={(e) => setFirstTaskTitle(e.target.value)}
                placeholder="e.g. Read Chapter 2 & solve 1 problem"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c1c1e] border border-white/10 text-white text-xs focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <span className="text-zinc-400">First Completion Reward:</span>
              <span className="font-mono text-emerald-400 font-medium">+20 XP</span>
            </div>
          </div>
        )}

        {/* Step 6: Land on Dashboard */}
        {step === 6 && (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold tracking-tight">
                You’re Ready
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                Step into your squad dashboard. Track schedules, earn XP, solve problems, and climb the leaderboard.
              </p>
            </div>
          </div>
        )}

        {/* Footer Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 6 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold transition-colors"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold transition-colors shadow-lg"
            >
              <span>Launch Dashboard</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
