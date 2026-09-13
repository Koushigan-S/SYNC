"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Music2,
  UploadCloud,
  Link as LinkIcon,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Headphones,
} from "lucide-react";
import { useMusicMeet } from "@/context/MusicMeetContext";
import { useSync } from "@/context/SyncContext";
import { uploadSongFile } from "@/lib/services/music-service";

interface AddSongModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COVERS = [
  {
    name: "Lofi Study",
    url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&auto=format&fit=crop&q=80",
  },
  {
    name: "Synthwave Night",
    url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80",
  },
  {
    name: "Minimalist Piano",
    url: "https://images.unsplash.com/photo-1520523839898-5071270438a3?w=400&auto=format&fit=crop&q=80",
  },
  {
    name: "Cosmic Ambient",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80",
  },
  {
    name: "Cyber Pulse",
    url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80",
  },
];

const GENRES = [
  "Lofi Chill",
  "Synthwave",
  "Classical Piano",
  "Deep Focus",
  "Electronic Sprint",
  "Ambient Soundscape",
  "Hip Hop Beats",
  "Vocal / Acoustic",
];

export function AddSongModal({ isOpen, onClose }: AddSongModalProps) {
  const { currentGroup, currentUser, addToast } = useSync();
  const { addNewSong } = useMusicMeet();

  const [activeTab, setActiveTab] = useState<"link" | "upload">("link");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form Fields
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [genre, setGenre] = useState(GENRES[0]);
  const [selectedCover, setSelectedCover] = useState(PRESET_COVERS[0].url);
  const [customCoverUrl, setCustomCoverUrl] = useState("");

  // Upload File
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !audioUrl.trim()) {
      addToast({
        title: "Missing details",
        description: "Please enter both a track title and a valid audio link.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const coverArt = customCoverUrl.trim() || selectedCover;
      await addNewSong({
        title: title.trim(),
        artist: artist.trim() || "Squad Artist",
        album: "Squad Library",
        genre,
        albumArt: coverArt,
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
        description: `"${title}" is now available to all squad members.`,
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

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      addToast({
        title: "No audio file chosen",
        description: "Please select an MP3, WAV, or audio file to upload.",
        type: "error",
      });
      return;
    }

    if (!currentGroup?.id) {
      addToast({
        title: "No active squad",
        description: "Join or create a squad first to upload shared songs.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const coverArt = customCoverUrl.trim() || selectedCover;
      const trackTitle = title.trim() || selectedFile.name.replace(/\.[^/.]+$/, "");
      const trackArtist = artist.trim() || currentUser.displayName || "Squad Member";

      await uploadSongFile(
        currentGroup.id,
        selectedFile,
        {
          title: trackTitle,
          artist: trackArtist,
          genre,
          albumArt: coverArt,
          user: {
            id: currentUser.id,
            name: currentUser.displayName,
            photoURL: currentUser.photoURL,
          },
        },
        (pct) => setUploadProgress(pct)
      );

      addToast({
        title: "🚀 Audio Uploaded & Shared!",
        description: `"${trackTitle}" was uploaded to the squad's shared library.`,
        type: "success",
      });

      resetAndClose();
    } catch (err: any) {
      console.error("Audio upload failed:", err);
      addToast({
        title: "Upload failed",
        description:
          err?.message ||
          "Could not upload file. Ensure it is a valid audio format under 50MB.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/") && !file.name.match(/\.(mp3|wav|m4a|ogg|aac)$/i)) {
      addToast({
        title: "Unsupported file type",
        description: "Please upload an audio file (.mp3, .wav, .m4a, .ogg).",
        type: "error",
      });
      return;
    }

    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const resetAndClose = () => {
    setTitle("");
    setArtist("");
    setAudioUrl("");
    setSelectedFile(null);
    setCustomCoverUrl("");
    setUploadProgress(0);
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
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 p-1 mt-4 rounded-xl bg-black/40 border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("link")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "link"
                ? "bg-purple-600 text-white shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Direct Audio URL / Stream</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "upload"
                ? "bg-purple-600 text-white shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Audio File</span>
          </button>
        </div>

        {/* TAB 1: Direct Audio URL */}
        {activeTab === "link" && (
          <form onSubmit={handleLinkSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Audio Stream / MP3 URL <span className="text-purple-400">*</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://example.com/focus-beats.mp3 or web stream"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/60 font-mono"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Supports direct links to .mp3, .m4a, .wav, or live audio streams.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Track Title <span className="text-purple-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Late Night Code Flow"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Artist Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Kavinsky / Lofi Beats"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Genre / Focus Mood
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500/60"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g} className="bg-zinc-900 text-white">
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Cover Art Picker */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Cover Art Artwork
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {PRESET_COVERS.map((cov) => (
                  <button
                    key={cov.name}
                    type="button"
                    onClick={() => {
                      setSelectedCover(cov.url);
                      setCustomCoverUrl("");
                    }}
                    className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                      selectedCover === cov.url && !customCoverUrl
                        ? "border-purple-500 ring-2 ring-purple-500/30 scale-105"
                        : "border-white/10 opacity-70 hover:opacity-100"
                    }`}
                    title={cov.name}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cov.url}
                      alt={cov.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
              <input
                type="url"
                placeholder="Or paste custom image URL..."
                value={customCoverUrl}
                onChange={(e) => setCustomCoverUrl(e.target.value)}
                className="w-full mt-2 px-3 py-1.5 rounded-lg bg-black/30 border border-white/10 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-purple-500/60"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={resetAndClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/30 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Adding Song...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Save to Squad Library</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Audio File Upload */}
        {activeTab === "upload" && (
          <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
            {/* File Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/20 hover:border-purple-500/60 bg-black/40 hover:bg-black/60 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.ogg"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-12 h-12 rounded-full bg-purple-500/10 group-hover:bg-purple-500/20 flex items-center justify-center text-purple-400 mb-2 transition-colors">
                <UploadCloud className="w-6 h-6" />
              </div>
              {selectedFile ? (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-white flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="truncate max-w-xs">{selectedFile.name}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to change file
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-white">
                    Click to select audio file from your device
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Supports MP3, WAV, M4A, OGG (Up to 50MB)
                  </div>
                </div>
              )}
            </div>

            {/* Progress bar if uploading */}
            {isSubmitting && uploadProgress > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span>Uploading to Firebase Storage...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Track Title
                </label>
                <input
                  type="text"
                  placeholder="Defaults to filename"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Artist Name
                </label>
                <input
                  type="text"
                  placeholder="Defaults to your name"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Genre / Mood
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500/60"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g} className="bg-zinc-900 text-white">
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Cover Art Picker */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Cover Art Artwork
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {PRESET_COVERS.map((cov) => (
                  <button
                    key={cov.name}
                    type="button"
                    onClick={() => {
                      setSelectedCover(cov.url);
                      setCustomCoverUrl("");
                    }}
                    className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                      selectedCover === cov.url && !customCoverUrl
                        ? "border-purple-500 ring-2 ring-purple-500/30 scale-105"
                        : "border-white/10 opacity-70 hover:opacity-100"
                    }`}
                    title={cov.name}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cov.url}
                      alt={cov.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={resetAndClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedFile}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/30 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload & Share</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
