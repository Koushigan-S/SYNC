"use client";

import React, { useState } from "react";
import {
  X,
  Music2,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useMusicMeet } from "@/context/MusicMeetContext";
import { useSync } from "@/context/SyncContext";
import {
  extractYouTubeVideoId,
  fetchYouTubeDetails,
} from "@/lib/services/music-service";

interface AddSongModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Default clean album artwork for squad audio tracks
const DEFAULT_ALBUM_ART =
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80";

export function AddSongModal({ isOpen, onClose }: AddSongModalProps) {
  const { currentUser, addToast } = useSync();
  const { addNewSong } = useMusicMeet();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  if (!isOpen) return null;

  const handleAudioUrlChange = async (val: string) => {
    setAudioUrl(val);
    const ytId = extractYouTubeVideoId(val);
    if (ytId) {
      setIsFetchingDetails(true);
      try {
        const details = await fetchYouTubeDetails(val);
        if (details) {
          if (!title.trim() && details.title) {
            setTitle(details.title);
          }
          if (!artist.trim() && details.author) {
            setArtist(details.author);
          }
        }
      } catch {
        // ignore
      } finally {
        setIsFetchingDetails(false);
      }
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioUrl.trim()) {
      addToast({
        title: "Missing audio link",
        description: "Please enter a valid audio stream or YouTube link.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const ytId = extractYouTubeVideoId(audioUrl);
      const cleanArt = ytId
        ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
        : DEFAULT_ALBUM_ART;

      const trackTitle = title.trim() || (ytId ? "YouTube Audio Track" : "Audio Track");
      const trackArtist = artist.trim() || (ytId ? "YouTube Artist" : "Squad Artist");

      await addNewSong({
        title: trackTitle,
        artist: trackArtist,
        album: "Squad Library",
        genre: ytId ? "YouTube Audio" : "Squad Audio",
        albumArt: cleanArt,
        audioUrl: audioUrl.trim(),
        streamUrl: audioUrl.trim(),
        addedBy: {
          id: currentUser.id,
          name: currentUser.displayName,
          photoURL: currentUser.photoURL,
        },
      });

      addToast({
        title: "🎵 Song Added to Squad Library!",
        description: `"${trackTitle}" is now available to all squad members.`,
        type: "success",
      });

      resetAndClose();
    } catch (err: any) {
      console.error("Failed to add song:", err);
      addToast({
        title: "Failed to add song",
        description: err?.message || "Please check your audio URL and try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setTitle("");
    setArtist("");
    setAudioUrl("");
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#121214] border border-white/10 shadow-2xl p-5 sm:p-6 text-white max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Music2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Add Song to Squad Library
              </h2>
              <p className="text-xs text-zinc-400">
                Shared in real-time with everyone in your squad
              </p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Direct Audio Stream / YouTube Form */}
        <form onSubmit={handleLinkSubmit} className="mt-5 space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="block text-xs font-semibold text-zinc-200">
                Audio URL or YouTube Link <span className="text-purple-400">*</span>
              </label>
              {extractYouTubeVideoId(audioUrl) ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-medium flex items-center gap-1 animate-in fade-in">
                  ▶ YouTube Audio Detected
                </span>
              ) : null}
            </div>
            <input
              type="url"
              required
              placeholder="Paste YouTube link (youtube.com/watch?v=...) or MP3 stream URL"
              value={audioUrl}
              onChange={(e) => handleAudioUrlChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/60 font-mono"
            />
            <div className="text-[11px] text-zinc-400 mt-1.5 flex items-center justify-between">
              <span>Supports YouTube videos &amp; music links, or direct MP3/stream links.</span>
              {isFetchingDetails && (
                <span className="text-purple-400 text-[10px] flex items-center gap-1 shrink-0">
                  <Loader2 className="w-3 h-3 animate-spin" /> Fetching info...
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
                Track Title <span className="text-purple-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Auto-detected or enter title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
                Artist Name
              </label>
              <input
                type="text"
                placeholder="Auto-detected or enter artist"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-white/5">
            <button
              type="button"
              onClick={resetAndClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/30 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Adding Song...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Add to Squad Library</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
