"use client";

import React, { useState } from "react";
import { useSync } from "@/context/SyncContext";
import {
  X,
  Users,
  Copy,
  Check,
  Shield,
  LogOut,
  Sparkles,
  Link2,
} from "lucide-react";

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GroupSettingsModal({ isOpen, onClose }: GroupSettingsModalProps) {
  const { currentGroup, members, currentUser, joinGroupWithCode, addToast } = useSync();

  const [copied, setCopied] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const isOwner = currentGroup.ownerId === currentUser.id;

  if (!isOpen) return null;

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}/?join=${currentGroup.inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast({
      title: "Invite Link Copied",
      description: "Direct join link copied to your clipboard.",
      type: "default",
    });
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    const res = await joinGroupWithCode(joinCodeInput.trim());
    if (res.success) {
      addToast({
        title: "Joined Squad",
        description: res.message,
        type: "success",
      });
      setJoinCodeInput("");
    } else {
      addToast({
        title: "Join Failed",
        description: res.message,
        type: "error",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#111111] border border-white/10 shadow-2xl p-6 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-white" />
            <div>
              <h3 className="text-base font-semibold tracking-tight">
                Squad Settings & Invites
              </h3>
              <p className="text-xs text-zinc-400">
                {currentGroup.name} · {currentGroup.memberCount} active members
              </p>
            </div>
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
          {/* Invite Code / Link Banner */}
          <div className="p-4 rounded-xl bg-[#161618] border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">
                Private Squad Invite
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-white font-bold tracking-wider">
                {currentGroup.inviteCode}
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Anyone with this link or code can join this private squad and participate in shared challenges.
            </p>
            <div className="pt-2 flex gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-medium border border-white/10 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied Link!</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Copy Invite Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Members List with Roles */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-300">
                Squad Members
              </span>
              <span className="text-[11px] text-zinc-500">
                Role Permissions
              </span>
            </div>

            <div className="divide-y divide-white/5 rounded-xl bg-[#161618] border border-white/10 overflow-hidden">
              {members.map((member) => {
                const isYou = member.userId === currentUser.id;
                return (
                  <div
                    key={member.userId}
                    className="p-3 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={member.userSnapshot.photoURL}
                        alt={member.userSnapshot.displayName}
                        className="w-7 h-7 rounded-full object-cover border border-white/10"
                      />
                      <div>
                        <div className="font-medium text-white flex items-center gap-1.5">
                          <span>{member.userSnapshot.displayName}</span>
                          {isYou && (
                            <span className="text-[10px] text-zinc-400">
                              (You)
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Level {member.userSnapshot.level} · {member.userSnapshot.totalXP.toLocaleString()} XP
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold ${
                          member.role === "owner"
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                            : member.role === "admin"
                            ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                            : "bg-zinc-500/15 text-zinc-400 border border-zinc-500/20"
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Join Another Squad via Code */}
          <form onSubmit={handleJoin} className="pt-2 border-t border-white/10">
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Switch or Join Another Squad
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                placeholder="Enter invite code..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#1c1c1e] border border-white/10 text-white text-xs uppercase font-mono focus:outline-none focus:border-white/30"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold transition-colors"
              >
                Join
              </button>
            </div>
          </form>

          {/* Leave Squad Option */}
          <div className="pt-2 flex items-center justify-between text-xs text-zinc-500">
            <span>{isOwner ? "Squad Owner Controls" : "Member Options"}</span>
            <button
              onClick={() => {
                addToast({
                  title: "Squad Status",
                  description: `You are active in ${currentGroup.name}.`,
                  type: "default",
                });
                onClose();
              }}
              className="text-zinc-500 hover:text-rose-400 transition-colors flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave Squad</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
