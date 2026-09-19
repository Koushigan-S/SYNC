"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMusicMeet } from "@/context/MusicMeetContext";
import { useSync } from "@/context/SyncContext";
import { formatAudioTime } from "@/lib/services/music-service";
import { AddSongModal } from "@/components/music/AddSongModal";
import {
  Play,
  Pause,
  Headphones,
  Video,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Radio,
  Volume2,
  VolumeX,
  Users,
  Disc3,
  Music2,
  X,
  Search,
  Plus,
  SkipBack,
  SkipForward,
  Trash2,
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
    squadSongs,
    allAvailableTracks,
    isDockExpanded,
    volume,
    isMuted,
    isBroadcasting,
    currentTime,
    duration,
    togglePlay,
    changeTrack,
    seekTo,
    tuneInToMember,
    goSolo,
    toggleBroadcast,
    toggleDockExpanded,
    loadCustomTrack,
    removeSong,
    toggleMute,
    setVolume,
    playNextTrack,
    playPrevTrack,
  } = useMusicMeet();

  const [showSquadFlyout, setShowSquadFlyout] = useState(false);
  const [isAddSongModalOpen, setIsAddSongModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Active friends presence (strictly squad library songs, no lofi or arbitrary tracks)
  const squadPresences = Object.values(presences).filter(
    (p) =>
      p.userId !== currentUser.id &&
      p.track &&
      !p.track.id.includes("station-lofi") &&
      !p.track.title?.toLowerCase().includes("lofi") &&
      !p.track.title?.toLowerCase().includes("snowfall") &&
      squadSongs.some(
        (s) =>
          s.id === p.track?.id ||
          s.audioUrl === p.track?.audioUrl ||
          s.title.toLowerCase() === p.track?.title?.toLowerCase()
      )
  );

  const tunedInFriend = listeningWith ? allUsers[listeningWith] : null;

  const handleLaunchMeet = () => {
    window.open(focusRoom.meetUrl, "_blank", "noopener,noreferrer");
  };


  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seekTo(val);
  };

  // Filter songs by search query
  const filteredSquadSongs = squadSongs.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const effectiveDuration =
    !currentTrack.audioUrl || currentTrack.id === "standby-track"
      ? 0
      : duration > 0
      ? duration
      : currentTrack.duration || 0;
  const progressPercent =
    effectiveDuration > 0
      ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100))
      : 0;

  return (
    <>
      {/* Floating Global Music & Meet Dock */}
      <div
        className={`fixed z-40 transition-all duration-300 ease-out ${
          isDockExpanded ? "bottom-6" : "bottom-20 md:bottom-5"
        } left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-4xl`}
      >
        <div className="relative rounded-2xl bg-[#0d0d0f]/92 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-2.5 sm:p-3 text-white">
          {/* Seek Progress Scrobbler Line on Top of Dock */}
          <div className="absolute -top-1 left-3 right-3 h-1 group cursor-pointer">
            <div className="w-full h-full rounded-full bg-white/10 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-150"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={effectiveDuration}
              value={currentTime}
              onChange={handleSeekChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="Seek audio position"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-0.5">
            {/* Left: Now Playing track info & sound waves */}
            <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial">
              {/* Album Art with Music Badge */}
              <div
                className="relative shrink-0 group cursor-pointer"
                onClick={toggleDockExpanded}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentTrack.albumArt || "/icon.png"}
                  alt={currentTrack.title}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover border border-white/15 shadow-md transition-transform group-hover:scale-105"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center shadow-sm">
                  <Disc3
                    className={`w-2.5 h-2.5 text-white ${
                      isPlaying ? "animate-spin-slow" : ""
                    }`}
                  />
                </div>
              </div>

              {/* Title, Artist, and Timers */}
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
                    <div
                      className="flex items-end gap-0.5 h-3.5 px-1 py-0.5 shrink-0"
                      title="Now Playing"
                    >
                      <span className="w-0.5 bg-purple-400 rounded-full animate-eq-1" />
                      <span className="w-0.5 bg-purple-400 rounded-full animate-eq-2" />
                      <span className="w-0.5 bg-purple-400 rounded-full animate-eq-3" />
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-zinc-400 truncate mt-0.5">
                  <span className="truncate">{currentTrack.artist}</span>
                  {effectiveDuration > 0 && (
                    <>
                      <span className="text-zinc-600 font-mono hidden sm:inline">•</span>
                      <span className="font-mono text-[10px] text-zinc-400 hidden sm:inline">
                        {formatAudioTime(currentTime)} / {formatAudioTime(effectiveDuration)}
                      </span>
                    </>
                  )}
                  {tunedInFriend ? (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium">
                      <Headphones className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                      <span>w/ {tunedInFriend.displayName.split(" ")[0]}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          goSolo();
                        }}
                        className="ml-1 text-[9px] text-zinc-400 hover:text-white underline font-semibold cursor-pointer"
                        title="Leave synced stream and go solo"
                      >
                        Solo
                      </button>
                    </div>
                  ) : isBroadcasting ? (
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                      <Radio className="w-2.5 h-2.5 animate-pulse" />
                      <span>DJing Jam</span>
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Center / Right: Global Playback Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Skip Previous Button */}
              <button
                onClick={playPrevTrack}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer hidden sm:flex items-center justify-center"
                title="Previous Track"
                aria-label="Previous Track"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>

              {/* Play / Pause Button */}
              <button
                onClick={togglePlay}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-black hover:bg-zinc-200 flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
                title={isPlaying ? "Pause Focus Beats" : "Play Focus Beats"}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              {/* Skip Next Button */}
              <button
                onClick={playNextTrack}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer hidden sm:flex items-center justify-center"
                title="Next Track"
                aria-label="Next Track"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              {/* Mute / Unmute Button */}
              <button
                onClick={toggleMute}
                className={`p-2 rounded-xl transition-colors border cursor-pointer ${
                  isMuted
                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                    : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-400 hover:text-white"
                }`}
                title={isMuted ? "Unmute Audio" : "Mute Audio"}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              {/* Squad Audio Presence & Jam Flyout Toggle */}
              <div className="relative">
                <button
                  onClick={() => setShowSquadFlyout((prev) => !prev)}
                  className={`px-2.5 py-2 rounded-xl transition-all border flex items-center gap-1.5 cursor-pointer ${
                    listeningWith
                      ? "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 text-emerald-300 shadow-sm"
                      : isBroadcasting
                      ? "bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/40 text-purple-300"
                      : squadPresences.length > 0
                      ? "bg-white/10 hover:bg-white/15 border-white/20 text-white"
                      : "bg-white/5 hover:bg-white/10 border-white/5 text-zinc-400"
                  }`}
                  title="Squad Jams & Friends' Music"
                >
                  {/* Stacked Avatars */}
                  {squadPresences.length > 0 && (
                    <div className="flex -space-x-1.5 overflow-hidden mr-0.5">
                      {squadPresences.slice(0, 3).map((p) => {
                        const user = allUsers[p.userId];
                        return (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            key={p.userId}
                            src={
                              user?.photoURL ||
                              (user as any)?.avatar ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.displayName || "Member")}`
                            }
                            alt={user?.displayName || "Member"}
                            className="w-4 h-4 rounded-full ring-1 ring-[#0d0d0f] object-cover"
                          />
                        );
                      })}
                    </div>
                  )}
                  <Headphones
                    className={`w-4 h-4 ${
                      listeningWith ? "text-emerald-400" : "text-purple-400"
                    }`}
                  />
                  <span className="text-xs font-mono font-medium hidden sm:inline">
                    {listeningWith
                      ? "Synced"
                      : squadPresences.length > 0
                      ? `${squadPresences.length}`
                      : "Jam"}
                  </span>
                </button>

                {/* Squad Listening Jams Popover */}
                {showSquadFlyout && (
                  <div className="absolute bottom-12 right-0 w-80 sm:w-88 rounded-2xl bg-[#141416]/95 backdrop-blur-2xl border border-white/15 shadow-2xl p-3.5 space-y-3 z-50 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-1.5">
                        <Headphones className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-semibold text-white">
                          Squad Audio Jams
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={toggleBroadcast}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-colors flex items-center gap-1 cursor-pointer ${
                            isBroadcasting
                              ? "bg-purple-600 text-white border-purple-500"
                              : "bg-white/10 hover:bg-white/20 border-white/15 text-white"
                          }`}
                          title="Broadcast your track to all squad members"
                        >
                          <Radio className="w-2.5 h-2.5" />
                          <span>{isBroadcasting ? "Broadcasting" : "Start Jam"}</span>
                        </button>
                        <button
                          onClick={() => setShowSquadFlyout(false)}
                          className="text-zinc-400 hover:text-white p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Active Synced Banner */}
                    {tunedInFriend && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                          <div className="truncate">
                            <div className="text-[11px] text-emerald-300 font-semibold truncate">
                              Listening with {tunedInFriend.displayName}
                            </div>
                            <div className="text-[10px] text-zinc-400 truncate">
                              Auto-following: {currentTrack.title}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={goSolo}
                          className="px-2 py-1 rounded-lg bg-emerald-500 text-black font-semibold text-[10px] hover:bg-emerald-400 shrink-0 ml-2 cursor-pointer"
                        >
                          Leave
                        </button>
                      </div>
                    )}

                    {/* Squad Members Currently Playing */}
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                      {squadPresences.length === 0 ? (
                        <div className="text-center py-5 px-3 rounded-xl bg-white/5 border border-dashed border-white/10">
                          <Music2 className="w-6 h-6 text-zinc-500 mx-auto mb-1.5" />
                          <p className="text-xs text-zinc-300 font-medium">
                            No squad jams right now
                          </p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            Play a song or start broadcasting to invite friends!
                          </p>
                        </div>
                      ) : (
                        squadPresences.map((p) => {
                          const user = allUsers[p.userId];
                          const isCurrentTune = listeningWith === p.userId;
                          return (
                            <div
                              key={p.userId}
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="relative shrink-0">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={
                                      user?.photoURL ||
                                      (user as any)?.avatar ||
                                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.displayName || "Member")}`
                                    }
                                    alt={user?.displayName || "Member"}
                                    className="w-8 h-8 rounded-full object-cover ring-1 ring-white/15"
                                  />
                                  {p.isPlaying && (
                                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-purple-400 ring-2 ring-[#141416]" />
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-white truncate">
                                      {user?.displayName || "Member"}
                                    </span>
                                    {p.isBroadcasting && (
                                      <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                        DJ
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-zinc-400 truncate">
                                    {p.track?.title || "Focus Beats"} • {p.track?.artist || "Squad"}
                                  </div>
                                </div>
                              </div>

                              {/* Tune In Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (isCurrentTune) {
                                    goSolo();
                                  } else {
                                    tuneInToMember(p.userId);
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer transition-colors ${
                                  isCurrentTune
                                    ? "bg-emerald-500 text-black hover:bg-emerald-400"
                                    : "bg-white/10 hover:bg-white/20 text-white border border-white/15"
                                }`}
                              >
                                <Headphones className="w-3 h-3" />
                                <span>{isCurrentTune ? "Synced" : "Tune In"}</span>
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Add Song Button */}
              <button
                onClick={() => setIsAddSongModalOpen(true)}
                className="p-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 transition-colors flex items-center gap-1 cursor-pointer"
                title="Add song to squad library"
              >
                <Plus className="w-4 h-4" />
                <span className="text-xs font-medium hidden md:inline">Add Song</span>
              </button>

              {/* Google Meet 1-Click Launch Button */}
              <button
                onClick={handleLaunchMeet}
                className="px-2.5 sm:px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 active:scale-95 transition-all cursor-pointer"
                title="Launch Google Meet study room"
              >
                <Video className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Meet</span>
                {focusRoom.activeMemberIds.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                )}
              </button>

              {/* Focus Room Link */}
              <Link
                href="/room"
                className={`p-2 rounded-xl border transition-colors ${
                  pathname === "/room"
                    ? "bg-white/20 border-white/30 text-white"
                    : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-400 hover:text-white"
                }`}
                title="Open Focus Room"
              >
                <Users className="w-4 h-4" />
              </Link>

              {/* Expand / Minimize Player Drawer Toggle */}
              <button
                onClick={toggleDockExpanded}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title={isDockExpanded ? "Minimize Player" : "Expand Player"}
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

          {/* Expanded Music Lounge Drawer */}
          {isDockExpanded && (
            <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Now Playing Visualizer Card */}
                <div className="lg:col-span-5 rounded-xl overflow-hidden bg-black/60 border border-white/10 p-3.5 flex flex-col justify-between relative group">
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/15 shadow-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentTrack.albumArt || "/icon.png"}
                        alt={currentTrack.title}
                        className={`w-full h-full object-cover transition-transform duration-500 ${
                          isPlaying ? "scale-105" : "grayscale-[30%]"
                        }`}
                      />
                      {isPlaying && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <div className="flex items-end gap-1 h-4">
                            <span className="w-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s] h-3" />
                            <span className="w-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s] h-4" />
                            <span className="w-1 bg-purple-400 rounded-full animate-bounce h-2" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-mono border border-purple-500/20">
                          Squad Audio
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          Native HTML5 Audio
                        </span>
                      </div>
                      <div className="font-semibold text-sm text-white truncate">
                        {currentTrack.title}
                      </div>
                      <div className="text-xs text-zinc-400 truncate">
                        {currentTrack.artist}
                      </div>
                    </div>
                  </div>

                  {/* Volume Slider & Seek Info */}
                  <div className="pt-3 mt-3 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                      <span>{formatAudioTime(currentTime)}</span>
                      <span className="text-zinc-600">/</span>
                      <span>{formatAudioTime(effectiveDuration)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={toggleMute} className="text-zinc-400 hover:text-white">
                        {isMuted ? (
                          <VolumeX className="w-3.5 h-3.5 text-red-400" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        title="Volume"
                      />
                      <span className="text-[10px] text-zinc-500 font-mono ml-auto">
                        {Math.round((isMuted ? 0 : volume) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Track Selector & Squad Library Console */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-2.5">
                  {/* Squad Library Header & Action */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-semibold">
                        <Music2 className="w-3.5 h-3.5" />
                        <span>Squad Library</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-purple-500/30 text-[10px] text-white">
                          {squadSongs.length}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddSongModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-purple-600/30 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Song</span>
                    </button>
                  </div>

                  {/* Squad Songs Library */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Search squad tracks or artists..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {filteredSquadSongs.length === 0 ? (
                        <div className="col-span-2 text-center py-6 px-4 rounded-xl bg-black/20 border border-dashed border-white/10">
                          <p className="text-xs text-zinc-400 font-medium">
                            No squad songs added yet
                          </p>
                          <p className="text-[10px] text-zinc-500 mt-1">
                            Click &quot;Add Song&quot; above to add your first YouTube or audio stream!
                          </p>
                        </div>
                      ) : (
                        filteredSquadSongs.map((track) => {
                          const isCurrent = currentTrack.id === track.id;
                          return (
                            <div
                              key={track.id}
                              className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 group ${
                                isCurrent
                                  ? "bg-purple-500/15 border-purple-500/40 text-white"
                                  : "bg-white/5 hover:bg-white/10 border-white/5 text-zinc-300 hover:text-white"
                              }`}
                            >
                              <div
                                onClick={() => changeTrack(track)}
                                className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={track.albumArt || "/icon.png"}
                                  alt={track.title}
                                  className="w-8 h-8 rounded-lg object-cover shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold truncate">
                                    {track.title}
                                  </div>
                                  <div className="text-[10px] text-zinc-400 truncate">
                                    {track.artist}
                                  </div>
                                </div>
                              </div>

                              {track.addedBy?.id === currentUser.id && (
                                <button
                                  onClick={() => removeSong(track.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-opacity cursor-pointer"
                                  title="Remove from squad library"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Song Modal */}
      <AddSongModal
        isOpen={isAddSongModalOpen}
        onClose={() => setIsAddSongModalOpen(false)}
      />
    </>
  );
}
