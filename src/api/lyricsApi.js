import axios from 'axios';

// Use the Vercel/Netlify URL in production, or localhost for development
const API_URL = import.meta.env.DEV ? 'http://localhost:3001/api/lyrics' : '/api/lyrics';

// Helper to parse LRC format into an array of objects
export const parseLRC = (lrcText) => {
  if (!lrcText) return [];
  const lines = lrcText.split('\n');
  const result = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

  lines.forEach(line => {
    const match = line.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3].padEnd(3, '0'), 10); // Pad to 3 digits for consistency
      const time = minutes * 60 + seconds + milliseconds / 1000;
      const text = line.replace(timeRegex, '').trim();
      if (text) {
        result.push({ time, text });
      }
    }
  });
  return result;
};


export const fetchLyrics = async (artist, title) => {
    try {
        const { data } = await axios.get(API_URL, {
            params: { artist, title }
        });

        if (data.synced) {
            return { ...data, lyrics: parseLRC(data.lyrics) };
        }
        return data; // Unsynced lyrics from Genius
    } catch (error) {
        console.error("Error fetching lyrics:", error);
        return { synced: false, lyrics: "Lyrics could not be found." };
    }
};