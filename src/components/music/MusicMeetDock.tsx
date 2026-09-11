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
    togglePlay,
    changeTrack,
    tuneInToMember,
    stopTuneIn,
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
                  {tunedInFriend && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                      <Headphones className="w-2.5 h-2.5" />
                      <span>w/ {tunedInFriend.displayName.split(" ")[0]}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Center / Right: Global Playback Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Play / Pause Toggle Button */}
              <button
                onClick={togglePlay}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-black hover:bg-zinc-200 flex items-center justify-center transition-all shadow-md active:scale-95"
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
                className={`p-2 rounded-xl transition-colors border ${
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

              {/* Squad Audio Presence Flyout Toggle */}
              <div className="relative">
                <button
                  onClick={() => setShowSquadFlyout((prev) => !prev)}
                  className={`p-2 rounded-xl transition-colors border flex items-center gap-1.5 ${
                    squadPresences.length > 0
                      ? "bg-white/10 hover:bg-white/15 border-white/20 text-white"
                      : "bg-white/5 hover:bg-white/10 border-white/5 text-zinc-400"
                  }`}
                  title="Squad Listening Presence"
                >
                  <Headphones className="w-4 h-4 text-[#1DB954]" />
                  <span className="text-xs font-mono font-medium hidden sm:inline">
                    {squadPresences.length}
                  </span>
                </button>

                {/* Squad Listening Presence Popover */}
                {showSquadFlyout && (
                  <div className="absolute bottom-12 right-0 w-64 rounded-2xl bg-[#141416] border border-white/15 shadow-2xl p-3 space-y-2 z-50 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between pb-1 border-b border-white/10">
                      <span className="text-xs font-semibold text-white">Squad Beats</span>
                      <button
                        onClick={() => setShowSquadFlyout(false)}
                        className="text-zinc-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {squadPresences.length === 0 ? (
                      <div className="text-[11px] text-zinc-500 py-3 text-center">
                        No other squad members actively streaming music right now.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {squadPresences.map((p) => {
                          const user = allUsers[p.userId];
                          const isTune = listeningWith === p.userId;
                          return (
                            <div
                              key={p.userId}
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-between gap-2 text-xs transition-colors"
                            >
                              <div className="min-w-0">
                                <div className="font-medium text-white truncate">
                                  {user?.displayName || "Squad Member"}
                                </div>
                                <div className="text-[10px] text-zinc-400 truncate">
                                  {p.track?.title}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (isTune) stopTuneIn();
                                  else tuneInToMember(p.userId);
                                }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors shrink-0 ${
                                  isTune
                                    ? "bg-emerald-500 text-black"
                                    : "bg-white/10 text-white hover:bg-white/20"
                                }`}
                              >
                                {isTune ? "Tuned" : "Tune In"}
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
                {/* Embedded Live Spotify Web Player */}
                <div className="lg:col-span-6 rounded-xl overflow-hidden bg-black/50 border border-white/10 shadow-inner">
                  <iframe
                    title="Spotify Web Embed Player"
                    src={currentTrack.embedUri}
                    width="100%"
                    height="160"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="rounded-xl border-0"
                  />
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
