import { db, storage } from "@/lib/firebase/config";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { SongTrack } from "@/types";

/**
 * Add a song to the squad's shared library in Firestore.
 */
export async function addSongToLibrary(
  groupId: string,
  songData: Omit<SongTrack, "id" | "createdAt">
): Promise<SongTrack> {
  const songsColl = collection(db, "groups", groupId, "songs");
  const newDocRef = doc(songsColl);
  const songId = newDocRef.id;

  const newSong: SongTrack = {
    ...songData,
    id: songId,
    createdAt: new Date().toISOString(),
  };

  await setDoc(newDocRef, {
    ...newSong,
    serverTimestamp: serverTimestamp(),
  });

  return newSong;
}

/**
 * Upload an audio file to Firebase Storage and save its metadata to Firestore.
 */
export async function uploadSongFile(
  groupId: string,
  file: File,
  metadata: {
    title: string;
    artist: string;
    album?: string;
    genre?: string;
    albumArt?: string;
    user: { id: string; name: string; photoURL?: string };
  },
  onProgress?: (progressPercent: number) => void
): Promise<SongTrack> {
  // Generate a clean storage filename
  const timestamp = Date.now();
  const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storagePath = `groups/${groupId}/songs/${timestamp}_${safeFilename}`;
  const fileRef = ref(storage, storagePath);

  // Upload to Firebase Storage
  const uploadTask = uploadBytesResumable(fileRef, file, {
    contentType: file.type || "audio/mpeg",
  });

  const downloadUrl = await new Promise<string>((resolve, reject) => {
    let hasTransferredBytes = false;

    // Safety timeout: if storage doesn't respond or is not enabled, fail cleanly instead of hanging
    const timeoutId = setTimeout(() => {
      if (!hasTransferredBytes) {
        try {
          uploadTask.cancel();
        } catch {
          // ignore
        }
        reject(
          new Error(
            "Firebase Storage is not enabled yet in this project. Please click 'Get Started' in Firebase Console > Storage, or use the Direct Audio URL tab."
          )
        );
      }
    }, 12000);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        if (snapshot.bytesTransferred > 0) {
          hasTransferredBytes = true;
        }
        if (onProgress && snapshot.totalBytes > 0) {
          const pct = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          onProgress(pct);
        }
      },
      (error) => {
        clearTimeout(timeoutId);
        const msg = error?.message || "";
        if (
          msg.includes("CORS") ||
          msg.includes("preflight") ||
          msg.includes("404") ||
          error.code === "storage/unknown" ||
          error.code === "storage/retry-limit-exceeded" ||
          error.code === "storage/canceled"
        ) {
          reject(
            new Error(
              "Firebase Storage is not enabled or bucket not found. Please click 'Get Started' in Firebase Console > Storage, or use the Direct Audio URL tab."
            )
          );
        } else {
          reject(error);
        }
      },
      async () => {
        clearTimeout(timeoutId);
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });

  // Extract duration if possible
  const duration = await extractAudioDuration(file);

  const fallbackArt = metadata.albumArt || "/icon.png";

  return await addSongToLibrary(groupId, {
    title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
    artist: metadata.artist || "Independent Artist",
    album: metadata.album || "Squad Library",
    genre: metadata.genre || "Focus",
    albumArt: fallbackArt,
    audioUrl: downloadUrl,
    duration,
    durationMs: Math.round(duration * 1000),
    addedBy: metadata.user,
  });
}

/**
 * Delete a song from the squad's shared library.
 */
export async function deleteSongFromLibrary(
  groupId: string,
  songId: string
): Promise<void> {
  const songDocRef = doc(db, "groups", groupId, "songs", songId);
  await deleteDoc(songDocRef);
}

/**
 * Extract audio duration in seconds from an audio URL or File.
 */
export function extractAudioDuration(target: string | File): Promise<number> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(180);
      return;
    }

    const audio = document.createElement("audio");
    audio.preload = "metadata";

    let objectUrl = "";
    if (typeof target === "string") {
      audio.src = target;
    } else {
      objectUrl = URL.createObjectURL(target);
      audio.src = objectUrl;
    }

    const cleanup = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };

    audio.onloadedmetadata = () => {
      const dur = audio.duration && isFinite(audio.duration) ? audio.duration : 180;
      cleanup();
      resolve(Math.round(dur));
    };

    audio.onerror = () => {
      cleanup();
      resolve(180); // Default fallback: 3 minutes
    };

    // Safety timeout in case metadata event never fires
    setTimeout(() => {
      cleanup();
      resolve(180);
    }, 4000);
  });
}

/**
 * Format seconds into mm:ss string (e.g. 125 -> "02:05")
 */
export function formatAudioTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Extract YouTube 11-character video ID from any YouTube URL format.
 */
export function extractYouTubeVideoId(url?: string): string | null {
  if (!url) return null;
  const regExp =
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

/**
 * Fetch video title, artist/channel, and thumbnail via public oEmbed API.
 */
export async function fetchYouTubeDetails(url: string): Promise<{
  title?: string;
  author?: string;
  thumbnailUrl?: string;
} | null> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (res.ok) {
      const data = await res.json();
      return {
        title: data.title,
        author: data.author_name,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }
  } catch {
    // Ignore network error and return thumbnail fallback
  }

  return {
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  };
}
