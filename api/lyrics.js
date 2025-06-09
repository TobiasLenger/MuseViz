// File: api/lyrics.js

import axios from 'axios';
import * as cheerio from 'cheerio';

const formatQuery = (str) => {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    const { artist, title } = req.query;
    if (!artist || !title) {
      return res.status(400).json({ error: 'Artist and title are required.' });
    }

    try {
      const lrcResponse = await axios.get(`https://lrclib.net/api/get?artist_name=${artist}&track_name=${title}`);
      if (lrcResponse.data && lrcResponse.data.syncedLyrics) {
        return res.status(200).json({
          source: 'lrclib',
          synced: true,
          lyrics: lrcResponse.data.syncedLyrics,
        });
      }
    } catch (lrcError) {
      console.log('Info: No synced lyrics on LRCLIB. Falling back to AZLyrics.');
    }

    const formattedArtist = formatQuery(artist);
    const formattedTitle = formatQuery(title);
    const azlyricsUrl = `https://www.azlyrics.com/lyrics/${formattedArtist}/${formattedTitle}.html`;

    const { data: pageHtml } = await axios.get(azlyricsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      },
    });

    const $ = cheerio.load(pageHtml);
    const lyricsDiv = $('div.ringtone').nextAll('div').first();
    
    if (lyricsDiv.length) {
      const lyrics = lyricsDiv.text().trim();
      return res.status(200).json({ source: 'azlyrics', synced: false, lyrics });
    }

    throw new Error('Could not parse lyrics from AZLyrics page.');

  } catch (error) {
    console.error('SERVER-SIDE FAILURE:', error.message);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return res.status(404).json({ source: 'azlyrics', synced: false, lyrics: `Lyrics not found for this song on our fallback provider.` });
    }
    return res.status(500).json({ error: 'The server failed to process the lyrics request.' });
  }
}