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
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          const pct = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          onProgress(pct);
        }
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });

  // Extract duration if possible
  const duration = await extractAudioDuration(file);

  const fallbackArt =
    metadata.albumArt ||
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80";

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
