"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMusicMeet } from "@/context/MusicMeetContext";
import { useSync } from "@/context/SyncContext";
import {
  Play,
  Pause,
  Headphones,
  Video,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Radio,
  Volume2,
  Users,
  Check,
  Disc3,
  Flame,
  Music2,
  X,
} from "lucide-react";

export function MusicMeetDock() {
  const pathname = usePathname();
  const { currentUser, allUsers } = useSync();
  const {
    currentTrack,
    isPlaying,
    presences,
    listeningWith,
    focusRoom,
    stations,
    isDockExpanded,
    togglePlay,
    changeTrack,
    tuneInToMember,
    stopTuneIn,
    toggleDockExpanded,
    setDockExpanded,
    loadCustomTrack,
    toggleGroupListening,
  } = useMusicMeet();

  const [customInput, setCustomInput] = useState("");
  const [showSquadFlyout, setShowSquadFlyout] = useState(false);

  // Active friends presence (excluding current user or showing everyone)
  const squadPresences = Object.values(presences).filter(
    (p) => p.userId !== currentUser.id && p.track
  );

  const tunedInFriend = listeningWith ? allUsers[listeningWith] : null;

  const handleLaunchMeet = () => {
    window.open(focusRoom.meetUrl, "_blank", "noopener,noreferrer");
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      const ok = loadCustomTrack(customInput);
      if (ok) setCustomInput("");
    }
  };

  return (
    <>
      {/* Floating Global Music & Meet Dock */}
      <div
        className={`fixed z-40 transition-all duration-300 ease-out ${
          isDockExpanded ? "bottom-6" : "bottom-20 md:bottom-5"
        } left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-4xl`}
      >
        <div className="relative rounded-2xl bg-[#0d0d0f]/90 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-2.5 sm:p-3 text-white">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Now Playing track info & sound waves */}
            <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial">
              {/* Album Art with Spotify Badge */}
              <div className="relative shrink-0 group cursor-pointer" onClick={toggleDockExpanded}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentTrack.albumArt}
                  alt={currentTrack.title}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover border border-white/15 shadow-md transition-transform group-hover:scale-105"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#1DB954] flex items-center justify-center shadow-sm">
                  <Disc3 className="w-2.5 h-2.5 text-black animate-spin-slow" />
                </div>
              </div>

              {/* Title, Artist, and Listening With */}
              <div className="min-w-0 pr-1">
                <div className="flex items-center gap-2">
                  <span
                    onClick={toggleDockExpanded}
                    className="text-xs sm:text-sm font-semibold text-white truncate cursor-pointer hover:underline"
                  >
                    {currentTrack.title}
                  </span>
                  {/* Animated sound wave bars when active */}
                  {isPlaying ? (
                    <div className="flex items-end gap-0.5 h-3.5 px-1 py-0.5 shrink-0" title="Now Playing">
                      <span className="w-0.5 bg-[#1DB954] rounded-full animate-eq-1" />
                      <span className="w-0.5 bg-[#1DB954] rounded-full animate-eq-2" />
                      <span className="w-0.5 bg-[#1DB954] rounded-full animate-eq-3" />
                      <span className="w-0.5 bg-[#1DB954] rounded-full animate-eq-4" />
                    </div>
                  ) : (
                    <span className="text-[10px] text-zinc-500 font-medium shrink-0">
                      Paused
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-zinc-400 truncate mt-0.5">
                  <span className="truncate">{currentTrack.artist}</span>
                  {tunedInFriend && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-medium shrink-0">
                      <Headphones className="w-2.5 h-2.5" />
                      With {tunedInFriend.displayName.split(" ")[0]}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Center: Play/Pause Controls */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-white text-black hover:bg-zinc-200 flex items-center justify-center transition-transform hover:scale-105 shadow-md active:scale-95"
                title={isPlaying ? "Pause Stream" : "Play Stream"}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current translate-x-0.5" />
                )}
              </button>

              {listeningWith && (
                <button
                  onClick={stopTuneIn}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-zinc-300 transition-colors border border-white/10"
                  title="Disconnect sync and listen independently"
                >
                  Leave Sync
                </button>
              )}
            </div>

            {/* Right: Squad Listening Stack & Google Meet Launch */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Squad Listeners Stack */}
              <div className="relative">
                <button
                  onClick={() => setShowSquadFlyout(!showSquadFlyout)}
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors"
                  title="View what squad is listening to"
                >
                  <div className="flex -space-x-2 overflow-hidden">
                    {squadPresences.slice(0, 3).map((p) => {
                      const u = allUsers[p.userId];
                      if (!u) return null;
                      return (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={p.userId}
                          src={u.photoURL}
                          alt={u.displayName}
                          className="inline-block h-5 w-5 rounded-full ring-1 ring-black object-cover"
                        />
                      );
                    })}
                  </div>
                  <Headphones className="w-3.5 h-3.5 text-zinc-400 ml-1" />
                  <span className="hidden sm:inline text-[11px] text-zinc-300 font-medium">
                    Squad Beats
                  </span>
                </button>

                {/* Squad Flyout Menu */}
                {showSquadFlyout && (
                  <div className="absolute right-0 bottom-full mb-3 w-72 rounded-2xl bg-[#161618] border border-white/15 p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                      <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-emerald-400" />
                        Squad Live Listening
                      </span>
                      <button
                        onClick={() => setShowSquadFlyout(false)}
                        className="text-zinc-500 hover:text-white text-xs"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-2">
                      {squadPresences.map((p) => {
                        const user = allUsers[p.userId];
                        const isTunedIntoThis = listeningWith === p.userId;
                        if (!user || !p.track) return null;

                        return (
                          <div
                            key={p.userId}
                            className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-2 hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={user.photoURL}
                                alt={user.displayName}
                                className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-white truncate">
                                  {user.displayName}
                                </div>
                                <div className="text-[10px] text-zinc-400 truncate flex items-center gap-1">
                                  <span>{p.track.title}</span>
                                  <span className="text-zinc-600">·</span>
                                  <span>{p.track.artist}</span>
                                </div>
                              </div>
                            </div>

                            {isTunedIntoThis ? (
                              <span className="text-[10px] text-emerald-400 font-semibold px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20 shrink-0 flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" /> Tuned
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  tuneInToMember(p.userId);
                                  setShowSquadFlyout(false);
                                }}
                                className="text-[10px] font-medium px-2 py-1 bg-white/10 hover:bg-white text-zinc-200 hover:text-black rounded-lg transition-colors shrink-0"
                              >
                                Tune In
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 1-Click Google Meet Launch Button */}
              <button
                onClick={handleLaunchMeet}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
                title={`Launch Google Meet: ${focusRoom.meetUrl}`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <Video className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px] hidden xs:inline">
                  {focusRoom.activeMemberIds.length} in Meet
                </span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </button>

              {/* Co-working Room Link */}
              <Link
                href="/room"
                className={`p-2 rounded-xl border text-xs transition-colors ${
                  pathname === "/room"
                    ? "bg-white text-black border-white"
                    : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white"
                }`}
                title="Go to Virtual Focus Room"
              >
                <Users className="w-3.5 h-3.5" />
              </Link>

              {/* Expand / Minimize Player Drawer Toggle */}
              <button
                onClick={toggleDockExpanded}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors"
                title={isDockExpanded ? "Minimize Player" : "Expand Spotify Player"}
                aria-label={isDockExpanded ? "Minimize Player" : "Expand Player"}
              >
                {isDockExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Expanded Spotify Console Drawer */}
          {isDockExpanded && (
            <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Embedded Live Spotify Web Player */}
                <div className="lg:col-span-7 rounded-xl overflow-hidden bg-black/50 border border-white/10 shadow-inner">
                  <iframe
                    title="Spotify Web Embed Player"
                    src={currentTrack.embedUri}
                    width="100%"
                    height="152"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="rounded-xl border-0"
                  />
                </div>

                {/* Focus Stations & Custom Link Controls */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
                  {/* Curated Stations */}
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">
                      Curated Focus Stations
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {stations.slice(0, 4).map((st) => (
                        <button
                          key={st.id}
                          onClick={() => changeTrack(st.track)}
                          className={`px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors flex items-center gap-2 border ${
                            currentTrack.id === st.track.id
                              ? "bg-white/15 border-white/30 text-white font-medium"
                              : "bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          <Disc3 className="w-3 h-3 text-[#1DB954] shrink-0" />
                          <span className="truncate text-[11px]">{st.title.split(" ")[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Spotify URL Input */}
                  <form onSubmit={handleCustomSubmit} className="flex gap-1.5">
                    <input
                      type="text"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Paste Spotify track/playlist URL..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 font-mono"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold transition-colors shrink-0"
                    >
                      Load
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
