// We need to install these dependencies for our serverless function
// In your terminal: npm install axios cheerio
import axios from 'axios';
import cheerio from 'cheerio';

// Helper function to format strings for URLs/searches
const formatQuery = (str) =>
  str
    .toLowerCase()
    .replace(/ /g, '+')
    .replace(/[^\w+]/g, '');

export default async function handler(req, res) {
  const { artist, title } = req.query;

  if (!artist || !title) {
    return res.status(400).json({ error: 'Artist and title are required.' });
  }

  // Allow requests from our frontend
  res.setHeader('Access-Control-Allow-Origin', '*'); // Be more specific in production!
  res.setHeader('Content-Type', 'application/json');

  // --- 1. Try to get synced lyrics from LRCLIB ---
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
  } catch (error) {
    console.log('No synced lyrics on LRCLIB, falling back to Genius.');
  }

  // --- 2. Fallback: Scrape unsynced lyrics from Genius ---
  try {
    const searchQuery = `${title} ${artist}`;
    const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(searchQuery)}`;
    
    // IMPORTANT: You should hide your Genius token in environment variables
    const geniusSearchResponse = await axios.get(searchUrl, {
      headers: { 'Authorization': `Bearer ${process.env.GENIUS_API_TOKEN}` }, // Create a free token on genius.com/api-clients
    });

    if (geniusSearchResponse.data.response.hits.length === 0) {
      return res.status(404).json({ error: 'Lyrics not found on Genius.' });
    }

    const songUrl = geniusSearchResponse.data.response.hits[0].result.url;
    const geniusPageHtml = await axios.get(songUrl);
    const $ = cheerio.load(geniusPageHtml.data);

    // Genius uses a specific div structure, this might break if they update their site
    let lyrics = $('div[class^="Lyrics__Container"], .lyrics').html();
    
    if (lyrics) {
        // Clean up the scraped HTML (replace <br> with newlines)
        lyrics = lyrics.replace(/<br>/g, '\n').replace(/<.*?>/g, '').trim();
        return res.status(200).json({
            source: 'genius',
            synced: false,
            lyrics: lyrics,
        });
    } else {
         return res.status(404).json({ error: 'Could not parse lyrics from Genius page.' });
    }

  } catch (error) {
    console.error('Error scraping Genius:', error);
    return res.status(500).json({ error: 'Failed to fetch lyrics from Genius.' });
  }
}