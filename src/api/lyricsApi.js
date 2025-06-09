// src/api/lyricsApi.js

import axios from 'axios';

// Use the Vercel/Netlify URL in production, or localhost for development
const API_URL = import.meta.env.DEV ? 'http://localhost:3001/api/lyrics' : '/api/lyrics';

// parseLRC function (no changes needed here)
export const parseLRC = (lrcText) => {
  if (!lrcText || typeof lrcText !== 'string') return [];
  const lines = lrcText.split('\n');
  const result = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

  lines.forEach(line => {
    const match = line.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3].padEnd(3, '0'), 10);
      const time = minutes * 60 + seconds + milliseconds / 1000;
      const text = line.replace(timeRegex, '').trim();
      if (text) {
        result.push({ time, text });
      }
    }
  });
  return result;
};


// --- START OF THE FIX ---
// This is the new, robust fetchLyrics function.

export const fetchLyrics = async (artist, title) => {
  try {
    // This part stays the same: we try to get data from our API.
    const { data } = await axios.get(API_URL, {
        params: { artist, title }
    });

    // Case 1: We got synced lyrics. Parse them into an array.
    if (data.synced) {
        return { ...data, lyrics: parseLRC(data.lyrics) };
    }

    // Case 2: We got unsynced lyrics (or a "not found" message from AZLyrics).
    // This is already in the correct format { synced: false, lyrics: "..." }.
    return data;

  } catch (error) {
    console.error("An error occurred in fetchLyrics:", error);

    // Case 3: The server responded with an error (e.g., 500 Internal Server Error).
    // We'll extract the error message from the server's response.
    if (axios.isAxiosError(error) && error.response && error.response.data) {
      const serverError = error.response.data;
      // Our server sends back an 'error' or 'details' property. Let's use it.
      const errorMessage = serverError.error || serverError.details || "An unknown server error occurred.";
      return { synced: false, lyrics: errorMessage };
    }

    // Case 4: A network error happened (e.g., no internet connection).
    return { synced: false, lyrics: "Could not connect to the lyrics server. Please check your network." };
  }
};
// --- END OF THE FIX ---