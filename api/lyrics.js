// File: api/lyrics.js
import axios from 'axios';
import cheerio from 'cheerio';

export default async function handler(req, res) {
  // Always set headers first
  res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust for production
  res.setHeader('Content-Type', 'application/json');

  try {
    const { artist, title } = req.query;

    if (!artist || !title) {
      return res.status(400).json({ error: 'Artist and title are required.' });
    }

    // --- 1. Try LRCLIB for synced lyrics ---
    try {
      const lrcResponse = await axios.get(`https://lrclib.net/api/get?artist_name=${artist}&track_name=${title}`);
      if (lrcResponse.data && lrcResponse.data.syncedLyrics) {
        console.log('Found synced lyrics on LRCLIB.');
        return res.status(200).json({
          source: 'lrclib',
          synced: true,
          lyrics: lrcResponse.data.syncedLyrics,
        });
      }
    } catch (lrcError) {
      console.log('LRCLIB check failed or no synced lyrics found. Falling back to Genius.');
    }

    // --- 2. Fallback: Scrape Genius ---
    // Check for Genius Token
    if (!process.env.GENIUS_API_TOKEN) {
      throw new Error("GENIUS_API_TOKEN is not configured on the server.");
    }
    
    const searchQuery = `${title} ${artist}`;
    const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(searchQuery)}`;
    
    const geniusSearchResponse = await axios.get(searchUrl, {
      headers: { Authorization: `Bearer ${process.env.GENIUS_API_TOKEN}` },
    });

    if (geniusSearchResponse.data.response.hits.length === 0) {
      return res.status(404).json({ source: 'genius', synced: false, lyrics: 'Lyrics not found on Genius.' });
    }

    const songUrl = geniusSearchResponse.data.response.hits[0].result.url;
    const { data: geniusPageHtml } = await axios.get(songUrl);
    const $ = cheerio.load(geniusPageHtml);

    const lyricsContainer = $('div[class^="Lyrics__Container"], .lyrics');
    if (lyricsContainer.length === 0) {
        return res.status(404).json({ source: 'genius', synced: false, lyrics: 'Could not find lyrics container on Genius page. The scraper might be outdated.' });
    }

    let lyrics = lyricsContainer.html();
    lyrics = lyrics.replace(/<br>/g, '\n').replace(/<.*?>/g, '').trim();

    return res.status(200).json({
      source: 'genius',
      synced: false,
      lyrics: lyrics,
    });

  } catch (error) {
    // This is the crucial catch block for the 500 error
    console.error('!!! SERVER-SIDE CRASH !!!:', error);
    return res.status(500).json({
      error: 'The server encountered an unexpected error.',
      // Optionally include more detail for debugging, but be careful in production
      details: error.message, 
    });
  }
}