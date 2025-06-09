// File: src/api/lyricsApi.js

import axios from 'axios';

const API_URL = import.meta.env.PROD ? '/api/lyrics' : 'http://localhost:3001/api/lyrics';

export const parseLRC = (lrcText) => {
  if (!lrcText || typeof lrcText !== 'string') return [];
  const lines = lrcText.split('\n');
  const result = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
  lines.forEach(line => {
    const match = line.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1], 10), seconds = parseInt(match[2], 10), ms = parseInt(match[3].padEnd(3, '0'), 10);
      const time = minutes * 60 + seconds + ms / 1000;
      const text = line.replace(timeRegex, '').trim();
      if (text) result.push({ time, text });
    }
  });
  return result;
};

export const fetchLyrics = async (artist, title) => {
  try {
    const { data } = await axios.get(API_URL, { params: { artist, title } });

    if (data.synced) {
      return { ...data, lyrics: parseLRC(data.lyrics) };
    }
    // For unsynced lyrics from AZLyrics or a "not found" message
    return data;

  } catch (error) {
    console.error("Error fetching lyrics:", error);
    if (axios.isAxiosError(error) && error.response?.data) {
      // Use the error message from the server's JSON response, or create a default one
      const message = error.response.data.error || error.response.data.lyrics || 'An unknown server error occurred.';
      return { synced: false, lyrics: message };
    }
    return { synced: false, lyrics: "A network error occurred. Please check your connection." };
  }
};