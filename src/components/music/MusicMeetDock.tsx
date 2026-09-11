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
  VolumeX,
  Users,
  Check,
  Disc3,
  Flame,
  Music2,
  X,
  Search,
  Loader2,
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
    isSpotifyConfigured,
    volume,
    isMuted,
    isBroadcasting,
    togglePlay,
    changeTrack,
    tuneInToMember,
    stopTuneIn,
    goSolo,
    toggleBroadcast,
    toggleDockExpanded,
    setDockExpanded,
    loadCustomTrack,
    searchTracks,
    toggleGroupListening,
    toggleMute,
  } = useMusicMeet();

  const [customInput, setCustomInput] = useState("");
  const [showSquadFlyout, setShowSquadFlyout] = useState(false);
  const [dockTab, setDockTab] = useState<"stations" | "search" | "url">("stations");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSpotifyEmbed, setShowSpotifyEmbed] = useState(false);

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

  const handleSearch = async (e?: React.FormEvent, directQuery?: string) => {
    if (e) e.preventDefault();
    const q = directQuery || searchQuery;
    if (!q.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchTracks(q);
      setSearchResults(results);
    } catch (err) {
      console.error("Spotify search error:", err);
    } finally {
      setIsSearching(false);
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
                  <Disc3 className={`w-2.5 h-2.5 text-black ${isPlaying ? "animate-spin-slow" : ""}`} />
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
              {/* Play / Pause Toggle Button */}
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
                            src={user?.photoURL || (user as any)?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                            alt={user?.displayName || "Member"}
                            className="w-4 h-4 rounded-full ring-1 ring-[#0d0d0f] object-cover"
                          />
                        );
                      })}
                    </div>
                  )}
                  <Headphones className={`w-4 h-4 ${listeningWith ? "text-emerald-400" : "text-[#1DB954]"}`} />
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
                        <Headphones className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-semibold text-white">Squad Audio Jams</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={toggleBroadcast}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-colors flex items-center gap-1 cursor-pointer ${
                            isBroadcasting
                              ? "bg-purple-500 text-black border-purple-400"
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
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black text-[10px] font-bold hover:bg-emerald-400 transition-colors shrink-0 cursor-pointer"
                        >
                          Go Solo
                        </button>
                      </div>
                    )}

                    {squadPresences.length === 0 ? (
                      <div className="text-[11px] text-zinc-500 py-4 text-center leading-relaxed">
                        No other friends actively streaming music right now.
                        <br />
                        <span className="text-zinc-400">Click &ldquo;Start Jam&rdquo; above to invite your squad!</span>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        <div className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500 px-0.5">
                          Teammates Online
                        </div>
                        {squadPresences.map((p) => {
                          const user = allUsers[p.userId];
                          const isTune = listeningWith === p.userId;
                          return (
                            <div
                              key={p.userId}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                                isTune
                                  ? "bg-emerald-500/10 border-emerald-500/30"
                                  : "bg-white/5 hover:bg-white/10 border-white/5"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={p.track?.albumArt || user?.photoURL || (user as any)?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                                  alt={p.track?.title || "Track"}
                                  className="w-9 h-9 rounded-lg object-cover shrink-0 border border-white/10"
                                />
                                <div className="min-w-0">
                                  <div className="font-semibold text-xs text-white truncate flex items-center gap-1.5">
                                    <span>{user?.displayName || "Squad Member"}</span>
                                    {p.isBroadcasting && (
                                      <span className="px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 text-[9px] font-mono border border-purple-500/30">
                                        DJ
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-zinc-300 truncate">
                                    {p.track?.title}
                                  </div>
                                  <div className="text-[10px] text-zinc-500 truncate">
                                    {p.track?.artist}
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isTune) goSolo();
                                  else tuneInToMember(p.userId);
                                }}
                                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                                  isTune
                                    ? "bg-emerald-500 text-black shadow-sm"
                                    : "bg-white/10 text-white hover:bg-white/20 border border-white/10 hover:border-white/20"
                                }`}
                              >
                                {isTune ? "✓ In Sync" : "🎧 Join In"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Google Meet Lounge Quick Hop */}
              <button
                onClick={handleLaunchMeet}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-colors"
                title="Hop into Google Meet Lounge"
              >
                <Video className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Meet Lounge</span>
              </button>

              {/* Focus Room Link */}
              <Link
                href="/room"
                className={`p-2 rounded-xl border transition-colors ${
                  pathname === "/room"
                    ? "bg-white text-black border-white"
                    : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-400 hover:text-white"
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
                {/* SYNC Studio High-Fidelity Soundstage Card */}
                <div className="lg:col-span-6 rounded-xl overflow-hidden bg-black/60 border border-white/10 p-3.5 flex flex-col justify-between relative group">
                  {showSpotifyEmbed ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-400">Spotify Web Embed</span>
                        <button
                          type="button"
                          onClick={() => setShowSpotifyEmbed(false)}
                          className="text-[10px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10"
                        >
                          ✕ Close Embed
                        </button>
                      </div>
                      <iframe
                        title="Spotify Web Embed Player"
                        src={currentTrack.embedUri}
                        width="100%"
                        height="130"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className="rounded-lg border-0"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/15 shadow-md">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={currentTrack.albumArt || "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=300"}
                            alt={currentTrack.title}
                            className={`w-full h-full object-cover transition-transform duration-500 ${
                              isPlaying ? "scale-105" : "grayscale-[30%]"
                            }`}
                          />
                          {isPlaying && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <div className="flex items-end gap-1 h-4">
                                <span className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s] h-3" />
                                <span className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s] h-4" />
                                <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-2" />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                              {currentTrack.genre || "Focus Station"}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500">
                              320kbps Lossless
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

                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isPlaying ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"
                            }`}
                          />
                          <span className="text-[11px] text-zinc-400 font-mono">
                            {isPlaying ? "Live Audio Stream Active" : "Audio Paused"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {currentTrack.spotifyUrl && (
                            <a
                              href={currentTrack.spotifyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-zinc-300 hover:text-white flex items-center gap-1 transition-colors"
                              title="Open on Spotify Web"
                            >
                              <span>Spotify Web</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowSpotifyEmbed(true)}
                            className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                            title="Load Spotify Embed Player"
                          >
                            Embed Widget
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Spotify Controls with Tabbed Modes */}
                <div className="lg:col-span-6 flex flex-col justify-between space-y-2.5">
                  {/* Mode Navigation Pills */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10 self-start">
                    <button
                      type="button"
                      onClick={() => setDockTab("stations")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                        dockTab === "stations"
                          ? "bg-white text-black font-semibold"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Focus Stations
                    </button>
                    <button
                      type="button"
                      onClick={() => setDockTab("search")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 ${
                        dockTab === "search"
                          ? "bg-white text-black font-semibold"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Search className="w-3 h-3" />
                      <span>Search API</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDockTab("url")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                        dockTab === "url"
                          ? "bg-white text-black font-semibold"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Paste Link
                    </button>
                  </div>

                  {/* Mode 1: Curated Stations */}
                  {dockTab === "stations" && (
                    <div className="grid grid-cols-2 gap-1.5">
                      {stations.map((st) => (
                        <button
                          key={st.id}
                          onClick={() => changeTrack(st.track)}
                          className={`px-2.5 py-2 rounded-lg text-left text-xs transition-colors flex items-center gap-2 border ${
                            currentTrack.id === st.track.id
                              ? "bg-white/15 border-white/30 text-white font-medium"
                              : "bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          <Disc3 className="w-3.5 h-3.5 text-[#1DB954] shrink-0" />
                          <div className="truncate min-w-0">
                            <div className="truncate text-xs text-white">{st.title}</div>
                            <div className="text-[10px] text-zinc-500 truncate">{st.genre}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Mode 2: Live Spotify Search */}
                  {dockTab === "search" && (
                    <div className="space-y-2">
                      <form onSubmit={handleSearch} className="flex gap-1.5">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search track, artist, album..."
                            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30 font-sans"
                          />
                          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5 pointer-events-none" />
                        </div>
                        <button
                          type="submit"
                          disabled={isSearching || !searchQuery.trim()}
                          className="px-3 py-1.5 rounded-xl bg-[#1DB954] text-black hover:bg-[#1ed760] disabled:opacity-50 text-xs font-semibold transition-colors shrink-0 flex items-center gap-1"
                        >
                          {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : "Search"}
                        </button>
                      </form>

                      {/* Quick Search Chips */}
                      {searchResults.length === 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {["Hans Zimmer", "Lofi Beats", "Synthwave", "Chopin", "Deep Focus"].map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                setSearchQuery(tag);
                                handleSearch(undefined, tag);
                              }}
                              className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-zinc-400 hover:text-white transition-colors"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Search Results List */}
                      {searchResults.length > 0 && (
                        <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                          {searchResults.map((tr) => (
                            <div
                              key={tr.id}
                              onClick={() => changeTrack(tr)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={tr.albumArt}
                                  alt={tr.title}
                                  className="w-7 h-7 rounded object-cover shrink-0"
                                />
                                <div className="truncate min-w-0">
                                  <div className="text-xs font-medium text-white truncate">{tr.title}</div>
                                  <div className="text-[10px] text-zinc-400 truncate">{tr.artist}</div>
                                </div>
                              </div>
                              <button
                                type="button"
                                className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] font-semibold shrink-0"
                              >
                                Play
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mode 3: Custom Spotify URL Input */}
                  {dockTab === "url" && (
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
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
