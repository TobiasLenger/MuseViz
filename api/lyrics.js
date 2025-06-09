// File: api/lyrics.js
import axios from 'axios';
import * as cheerio from 'cheerio';

// Helper to format strings for URLs/searches
const formatQuery = (str) => {
  // A-Z Lyrics requires lowercase alphanumeric only
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};

export default async function handler(req, res) {
  // Always set headers first
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    const { artist, title } = req.query;

    if (!artist || !title) {
      return res.status(400).json({ error: 'Artist and title are required.' });
    }

    // --- 1. Try LRCLIB for synced lyrics (no changes here) ---
    try {
      const lrcResponse = await axios.get(`https://lrclib.net/api/get?artist_name=${artist}&track_name=${title}`);
      if (lrcResponse.data && lrcResponse.data.syncedLyrics) {
        console.log('Success: Found synced lyrics on LRCLIB.');
        return res.status(200).json({
          source: 'lrclib',
          synced: true,
          lyrics: lrcResponse.data.syncedLyrics,
        });
      }
    } catch (lrcError) {
      console.log('Info: No synced lyrics on LRCLIB. Falling back to AZLyrics.');
    }

    // --- 2. NEW FALLBACK: Scrape unsynced lyrics from AZLyrics ---
    const formattedArtist = formatQuery(artist);
    const formattedTitle = formatQuery(title);

    const azlyricsUrl = `https://www.azlyrics.com/lyrics/${formattedArtist}/${formattedTitle}.html`;

    console.log(`Attempting to scrape: ${azlyricsUrl}`);

    const { data: pageHtml } = await axios.get(azlyricsUrl, {
      // It's crucial to mimic a real browser to avoid being blocked
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    const $ = cheerio.load(pageHtml);

    // AZLyrics has a specific structure for lyrics
    // They are usually in a div that comes after a div with class 'ringtone'
    const lyricsDiv = $('div.ringtone').nextAll('div').first();
    
    if (lyricsDiv.length > 0) {
      const lyrics = lyricsDiv.text().trim();
      console.log('Success: Scraped lyrics from AZLyrics.');
      return res.status(200).json({
        source: 'azlyrics',
        synced: false,
        lyrics: lyrics,
      });
    } else {
        // If that fails, try a more general selector (sometimes the structure differs)
        const generalLyricsDiv = $('div').filter(function() {
            return $(this).css('margin-left') === '2em' && $(this).css('margin-right') === '2em';
        }).first();

        if (generalLyricsDiv.length > 0) {
            const lyrics = generalLyricsDiv.text().trim();
            console.log('Success: Scraped lyrics from AZLyrics using general selector.');
            return res.status(200).json({
                source: 'azlyrics',
                synced: false,
                lyrics: lyrics,
            });
        }
    }

    // If both attempts fail
    throw new Error('Could not parse lyrics from AZLyrics page.');

  } catch (error) {
    console.error('!!! SERVER-SIDE CRASH/FAILURE !!!:', error.message);

    // Check if it's an axios error (e.g., 404 from AZLyrics)
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 404) {
        return res.status(404).json({ source: 'azlyrics', synced: false, lyrics: "Lyrics not found on AZLyrics." });
      }
    }
    
    // For other errors (like the parsing error we throw ourselves)
    return res.status(500).json({
      error: 'The server failed to fetch lyrics.',
      details: error.message,
    });
  }
}