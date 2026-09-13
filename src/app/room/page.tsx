"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSync } from "@/context/SyncContext";
import { useMusicMeet } from "@/context/MusicMeetContext";
import {
  Video,
  ExternalLink,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Headphones,
  Radio,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Users,
  Copy,
  Check,
  Edit2,
  Disc3,
  Flame,
  Clock,
  Music,
  CheckCircle2,
  Target,
  Coffee,
  Volume2,
  Share2,
  Plus,
  Music2,
  Trash2,
} from "lucide-react";
import { TiltCard } from "@/components/ui/TiltCard";
import { AddSongModal } from "@/components/music/AddSongModal";

export default function FocusRoomPage() {
  const { currentUser, allUsers, members, tasks, addToast } = useSync();
  const {
    currentTrack,
    isPlaying,
    presences,
    listeningWith,
    focusRoom,
    stations,
    squadSongs,
    togglePlay,
    changeTrack,
    tuneInToMember,
    stopTuneIn,
    goSolo,
    joinFocusRoom,
    leaveFocusRoom,
    setMeetUrl,
    toggleGroupListening,
    togglePomodoro,
    resetPomodoro,
    userMicEnabled,
    userVideoEnabled,
    toggleUserMic,
    toggleUserVideo,
    loadCustomTrack,
    removeSong,
  } = useMusicMeet();

  const [isEditingMeetUrl, setIsEditingMeetUrl] = useState(false);
  const [meetUrlInput, setMeetUrlInput] = useState(focusRoom.meetUrl);
  const [customTrackInput, setCustomTrackInput] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [isAddSongModalOpen, setIsAddSongModalOpen] = useState(false);

  const isInRoom = focusRoom.activeMemberIds.includes(currentUser.id);

  // Format pomodoro time mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const pomodoroPct = Math.round(
    ((focusRoom.pomodoro.durationSeconds - focusRoom.pomodoro.timeLeftSeconds) /
      focusRoom.pomodoro.durationSeconds) *
      100
  );

  const handleCopyMeet = () => {
    navigator.clipboard.writeText(focusRoom.meetUrl);
    setCopiedLink(true);
    addToast({
      title: "Google Meet link copied!",
      description: "Share it with any squad member to hop on call.",
      type: "success",
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveMeetUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (meetUrlInput.trim()) {
      setMeetUrl(meetUrlInput.trim());
      setIsEditingMeetUrl(false);
    }
  };

  const handleCustomTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTrackInput.trim()) {
      const ok = loadCustomTrack(customTrackInput);
      if (ok) setCustomTrackInput("");
    }
  };

  // Find a member's active task
  const getMemberFocusTask = (userId: string) => {
    const today = new Date().toISOString().split("T")[0];
    const userTasks = tasks.filter(
      (t) =>
        t.assignedParticipantIds.includes(userId) &&
        (t.scheduledDate === today || !t.isSquadComplete)
    );
    return userTasks[0]?.title || "Algorithm Practice & Systems Deep Work";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header: Google Meet Co-Working Lounge & Controls */}
      <div className="surface-card p-6 sm:p-8 relative overflow-hidden border-white/10">
        {/* Subtle background ambient gradient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Squad Study Lounge
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {focusRoom.activeMemberIds.length} Squad Members Active
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-2.5">
              Virtual Co-Working & Squad Music Lounge
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
              Hop on Google Meet, work to squad-shared focus beats, see what your friends are listening to, and join synchronized Pomodoro sprints with XP rewards.
            </p>

            {/* Meet Link Display & Editor */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {isEditingMeetUrl ? (
                <form onSubmit={handleSaveMeetUrl} className="flex items-center gap-2">
                  <input
                    type="url"
                    value={meetUrlInput}
                    onChange={(e) => setMeetUrlInput(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="px-3 py-1.5 rounded-xl bg-black/70 border border-white/20 text-xs text-white placeholder:text-zinc-600 font-mono w-64 sm:w-80 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingMeetUrl(false)}
                    className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-400"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300">
                  <Video className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono text-zinc-200 truncate max-w-[200px] sm:max-w-xs">
                    {focusRoom.meetUrl}
                  </span>
                  <button
                    onClick={handleCopyMeet}
                    className="p-1 hover:text-white transition-colors"
                    title="Copy Google Meet Link"
                  >
                    {copiedLink ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsEditingMeetUrl(true)}
                    className="p-1 hover:text-white transition-colors"
                    title="Change Meet URL"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons: 1-Click Launch Meet & Room Enter/Leave */}
          <div className="flex flex-wrap items-center gap-3">
            {isInRoom ? (
              <button
                onClick={leaveFocusRoom}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 transition-colors"
              >
                Leave Room
              </button>
            ) : (
              <button
                onClick={joinFocusRoom}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                Join Room
              </button>
            )}

            <a
              href={focusRoom.meetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all hover:scale-105 shadow-lg shadow-emerald-500/20 flex items-center gap-2 active:scale-95"
            >
              <Video className="w-4 h-4 fill-current" />
              <span>Launch Google Meet</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Grid: Co-Working Participant Tiles + Squad Jukebox / Pomodoro */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Squad Video & Participant Grid */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-white" />
              Live Squad Co-Working Grid ({focusRoom.activeMemberIds.length} Online)
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={toggleUserMic}
                className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1.5 ${
                  userMicEnabled
                    ? "bg-white text-black border-white"
                    : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                }`}
                title={userMicEnabled ? "Mic is Live" : "Mic is Muted"}
              >
                {userMicEnabled ? (
                  <Mic className="w-3.5 h-3.5" />
                ) : (
                  <MicOff className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span className="hidden sm:inline">
                  {userMicEnabled ? "Mic On" : "Muted"}
                </span>
              </button>

              <button
                onClick={toggleUserVideo}
                className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1.5 ${
                  userVideoEnabled
                    ? "bg-white text-black border-white"
                    : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                }`}
                title={userVideoEnabled ? "Camera is Live" : "Camera Off"}
              >
                {userVideoEnabled ? (
                  <Camera className="w-3.5 h-3.5" />
                ) : (
                  <CameraOff className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span className="hidden sm:inline">
                  {userVideoEnabled ? "Cam On" : "Cam Off"}
                </span>
              </button>
            </div>
          </div>

          {/* Member Tiles Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {members.map((member) => {
              const isCurrentUser = member.userId === currentUser.id;
              const isMemberActiveInRoom = focusRoom.activeMemberIds.includes(
                member.userId
              );
              const presence = presences[member.userId];
              const focusTask = getMemberFocusTask(member.userId);
              const isTunedInToThisMember = listeningWith === member.userId;

              return (
                <TiltCard
                  key={member.userId}
                  className={`surface-card p-4 relative overflow-hidden transition-all ${
                    isCurrentUser
                      ? "border-emerald-500/30 ring-1 ring-emerald-500/20"
                      : "hover:border-white/20"
                  }`}
                >
                  {/* Participant Header / Status */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={member.userSnapshot?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                          alt={member.userSnapshot?.displayName || "Member"}
                          className="w-10 h-10 rounded-full object-cover border border-white/15"
                        />
                        {isMemberActiveInRoom && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-black" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <span>{member.userSnapshot?.displayName || "Member"}</span>
                          {isCurrentUser && (
                            <span className="px-1.5 py-0.2 rounded bg-white/10 text-[9px] text-zinc-400 font-mono">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          Level {member.userSnapshot?.level || 1} · {member.role}
                        </div>
                      </div>
                    </div>

                    {/* Mic / Cam / Room Status */}
                    <div className="flex items-center gap-1.5">
                      {isCurrentUser ? (
                        <div className="flex items-center gap-1">
                          <span
                            className={`p-1 rounded-md ${
                              userMicEnabled
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-rose-500/20 text-rose-400"
                            }`}
                          >
                            {userMicEnabled ? (
                              <Mic className="w-3 h-3" />
                            ) : (
                              <MicOff className="w-3 h-3" />
                            )}
                          </span>
                          <span
                            className={`p-1 rounded-md ${
                              userVideoEnabled
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-zinc-800 text-zinc-500"
                            }`}
                          >
                            {userVideoEnabled ? (
                              <Camera className="w-3 h-3" />
                            ) : (
                              <CameraOff className="w-3 h-3" />
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-zinc-400">
                          {isMemberActiveInRoom ? "In Meet" : "Offline"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Focus Task Card */}
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 mb-3 text-xs">
                    <div className="text-[10px] uppercase font-semibold text-zinc-500 flex items-center gap-1 mb-1">
                      <Target className="w-3 h-3 text-amber-400" />
                      Active Focus Task
                    </div>
                    <div className="text-zinc-200 text-xs font-medium truncate">
                      {focusTask}
                    </div>
                  </div>

                  {/* Live Squad Track & Tune-In Action */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                    {presence?.track ? (
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="relative shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={presence.track.albumArt}
                            alt={presence.track.title}
                            className="w-7 h-7 rounded-lg object-cover border border-white/10"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-medium text-white truncate flex items-center gap-1.5">
                            <span className="truncate">{presence.track.title}</span>
                            {/* Animated sound waves */}
                            <span className="flex items-end gap-0.5 h-2.5 shrink-0">
                              <span className="w-0.5 bg-purple-400 rounded-full animate-eq-1" />
                              <span className="w-0.5 bg-purple-400 rounded-full animate-eq-2" />
                              <span className="w-0.5 bg-purple-400 rounded-full animate-eq-3" />
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400 truncate">
                            {presence.track.artist}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-zinc-500 italic">
                        Not playing music
                      </div>
                    )}

                    {/* Tune In / Squad Jam Action */}
                    {!isCurrentUser && presence?.track && (
                      <div className="flex items-center gap-1.5">
                        {presence.listenersCount && presence.listenersCount > 0 ? (
                          <span
                            className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full"
                            title={`${presence.listenersCount} members listening together`}
                          >
                            👥 {presence.listenersCount}
                          </span>
                        ) : null}

                        {isTunedInToThisMember ? (
                          <button
                            type="button"
                            onClick={goSolo}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black text-[10px] font-bold flex items-center gap-1 hover:bg-emerald-400 transition-colors shadow-sm cursor-pointer"
                            title="Click to leave sync and go solo"
                          >
                            <Check className="w-3 h-3" />
                            <span>In Sync</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => tuneInToMember(member.userId)}
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white text-zinc-200 hover:text-black text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title={`Join ${allUsers[member.userId]?.displayName || "Friend"}'s focus track`}
                          >
                            <Headphones className="w-3 h-3 text-[#1DB954]" />
                            <span>Join In</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </TiltCard>
              );
            })}
          </div>

          {/* 3. Squad Shared Jukebox & Music Lounge */}
          <div className="surface-card p-6 border-white/10 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Disc3 className={`w-4 h-4 ${isPlaying ? "animate-spin-slow" : ""}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Squad Audio Jukebox & Shared Library
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Live synchronized audio stream. Add, share, and play squad audio tracks together.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* 1-Click Play / Pause Button for instant audible streaming */}
                <button
                  onClick={togglePlay}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isPlaying
                      ? "bg-white text-black border-white shadow-sm"
                      : "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                  }`}
                  title={isPlaying ? "Pause Focus Beats" : "Play Focus Beats"}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause Audio</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      <span>Play Focus Audio</span>
                    </>
                  )}
                </button>

                {/* Add Song Button */}
                <button
                  onClick={() => setIsAddSongModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Song</span>
                </button>

                {/* Mode Switch: Broadcast vs Solo */}
                <button
                  onClick={toggleGroupListening}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    focusRoom.isGroupListening
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-sm"
                      : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>
                    {focusRoom.isGroupListening
                      ? "🎧 Broadcast: Listen Together"
                      : "Solo Stream Mode"}
                  </span>
                </button>
              </div>
            </div>

            {/* Room Broadcast Stage Banner */}
            {focusRoom.isGroupListening && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-300 font-semibold">
                    Room Soundstage Active — Everyone in the Focus Lounge is listening in sync!
                  </span>
                </div>
                <div className="text-[11px] text-emerald-400/80 font-mono">
                  👥 {focusRoom.activeMemberIds.length} members in lounge
                </div>
              </div>
            )}

            {/* SYNC Soundstage Jukebox Console */}
            <div className="rounded-2xl overflow-hidden bg-black/60 border border-white/10 p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
                <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-white/15 shadow-2xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentTrack.albumArt || "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=400"}
                      alt={currentTrack.title}
                      className={`w-full h-full object-cover transition-transform duration-700 ${
                        isPlaying ? "scale-105" : "grayscale-[30%]"
                      }`}
                    />
                    {isPlaying && (
                      <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                        <div className="flex items-end gap-1 h-6">
                          <span className="w-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s] h-4" />
                          <span className="w-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s] h-6" />
                          <span className="w-1 bg-purple-400 rounded-full animate-bounce h-3" />
                          <span className="w-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.2s] h-5" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 text-xs font-mono border border-purple-500/25">
                        Squad Audio
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500">
                        Lossless HTML5 Audio
                      </span>
                    </div>
                    <div className="font-bold text-base sm:text-lg text-white truncate">
                      {currentTrack.title}
                    </div>
                    <div className="text-xs sm:text-sm text-zinc-400 truncate">
                      {currentTrack.artist}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isPlaying ? "bg-purple-400 animate-pulse" : "bg-zinc-600"
                        }`}
                      />
                      <span className="text-xs text-zinc-400 font-mono">
                        {isPlaying ? "Live Audio Stream Playing" : "Stream Paused"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="px-4 py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pause Audio</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play Audio</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Shared Squad Songs Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Music2 className="w-3 h-3" />
                  Squad Added Songs ({squadSongs.length})
                </span>
                <button
                  onClick={() => setIsAddSongModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Song</span>
                </button>
              </div>

              {squadSongs.length === 0 ? (
                <div className="p-8 rounded-2xl bg-black/40 border border-dashed border-white/10 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3 text-purple-400">
                    <Music2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">Squad Music Library is Empty</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mb-4">
                    Add your own MP3 files or audio stream links. All squad members will immediately be able to listen and tune in!
                  </p>
                  <button
                    onClick={() => setIsAddSongModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Song</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {squadSongs.map((track) => {
                    const isActive = currentTrack.id === track.id;
                    return (
                      <div
                        key={track.id}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2.5 group ${
                          isActive
                            ? "bg-purple-500/15 border-purple-500/40 text-white shadow-sm"
                            : "bg-white/5 border-white/5 text-zinc-300 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <div
                          onClick={() => changeTrack(track)}
                          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={track.albumArt || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100"}
                            alt={track.title}
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-white truncate">
                              {track.title}
                            </div>
                            <div className="text-[10px] text-zinc-400 truncate">
                              {track.artist}
                            </div>
                            {track.addedBy && (
                              <div className="text-[9px] text-purple-400/80 truncate">
                                Added by {track.addedBy.name.split(" ")[0]}
                              </div>
                            )}
                          </div>
                        </div>

                        {track.addedBy?.id === currentUser.id && (
                          <button
                            onClick={() => removeSong(track.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-opacity cursor-pointer"
                            title="Remove song"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Focus Stations Carousel / Grid */}
            {stations.length > 0 && (
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-2">
                  Curated High-Yield Focus Stations
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {stations.map((station) => {
                    const isActive = currentTrack.id === station.track.id;
                    return (
                      <button
                        key={station.id}
                        onClick={() => changeTrack(station.track)}
                        className={`p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                          isActive
                            ? "bg-purple-500/15 border-purple-500/30 text-white shadow-sm"
                            : "bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <div className="text-xs font-semibold text-white truncate">
                          {station.title.split(" ")[0]}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                          {station.genre}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Direct Audio URL Loader */}
            <form onSubmit={handleCustomTrackSubmit} className="flex gap-2">
              <input
                type="url"
                value={customTrackInput}
                onChange={(e) => setCustomTrackInput(e.target.value)}
                placeholder="Paste direct audio stream URL (https://.../song.mp3 or web radio)"
                className="flex-1 px-3 py-2 rounded-xl bg-black/70 border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/40 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold transition-colors shrink-0 cursor-pointer"
              >
                Play Link
              </button>
            </form>
          </div>
        </div>

        {/* Right 4 Cols: Synchronized Squad Pomodoro Timer & Gamification */}
        <div className="lg:col-span-4 space-y-6">
          {/* Synchronized Pomodoro Timer Card */}
          <div className="surface-card p-6 border-white/10 space-y-6 text-center">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Synchronized Pomodoro
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-mono font-semibold border border-amber-500/20">
                +15 XP Bonus
              </span>
            </div>

            {/* Timer Display with Circular Progress Aesthetic */}
            <div className="py-4">
              <div className="relative inline-flex items-center justify-center">
                {/* SVG Progress Circle */}
                <svg className="w-48 h-48 -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="84"
                    className="stroke-white/10"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="84"
                    className={`transition-all duration-1000 ${
                      focusRoom.pomodoro.mode === "focus"
                        ? "stroke-white"
                        : "stroke-emerald-400"
                    }`}
                    strokeWidth="8"
                    strokeDasharray={527}
                    strokeDashoffset={527 - (527 * pomodoroPct) / 100}
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>

                {/* Inner Countdown Text */}
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-bold font-mono text-white tracking-tight">
                    {formatTime(focusRoom.pomodoro.timeLeftSeconds)}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mt-1">
                    {focusRoom.pomodoro.mode === "focus"
                      ? "Deep Focus Sprint"
                      : "Rest & Hydrate"}
                  </span>
                </div>
              </div>
            </div>

            {/* Pomodoro Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={togglePomodoro}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
                  focusRoom.pomodoro.isActive
                    ? "bg-amber-500 hover:bg-amber-400 text-black"
                    : "bg-white hover:bg-zinc-200 text-black"
                }`}
              >
                {focusRoom.pomodoro.isActive ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" /> Start Sprint
                  </>
                )}
              </button>

              <button
                onClick={() => resetPomodoro(focusRoom.pomodoro.mode)}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switchers (25m Focus / 5m Break) */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => resetPomodoro("focus")}
                className={`py-2 rounded-xl text-xs font-medium transition-colors border ${
                  focusRoom.pomodoro.mode === "focus"
                    ? "bg-white/15 border-white/30 text-white"
                    : "bg-white/5 border-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                25m Focus
              </button>
              <button
                onClick={() => resetPomodoro("break")}
                className={`py-2 rounded-xl text-xs font-medium transition-colors border ${
                  focusRoom.pomodoro.mode === "break"
                    ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                    : "bg-white/5 border-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                5m Break
              </button>
            </div>

            {/* Sprint Stats */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
              <span>Sprints Completed Today</span>
              <span className="font-mono font-semibold text-white">
                {focusRoom.pomodoro.sessionsCompleted} sessions (+
                {focusRoom.pomodoro.sessionsCompleted * 15} XP)
              </span>
            </div>
          </div>

          {/* Quick Squad Tips & Rules */}
          <div className="surface-card p-5 border-white/10 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Focus Lounge Protocol
            </h4>
            <ul className="text-xs text-zinc-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>Keep your Google Meet camera on for ambient accountability.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>Turn on &quot;Squad Broadcast&quot; if everyone wants to jam to the same focus track.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>Every 25-minute Pomodoro sprint awards +15 XP to all active room members upon completion!</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add Song Modal */}
      <AddSongModal
        isOpen={isAddSongModalOpen}
        onClose={() => setIsAddSongModalOpen(false)}
      />
    </div>
  );
}
