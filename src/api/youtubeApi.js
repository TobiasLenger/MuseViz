// File: src/api/youtubeApi.js

import axios from 'axios';

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export const searchYouTube = async (query) => {
  try {
    const response = await axios.get(`${BASE_URL}/search`, {
      params: {
        part: 'snippet',
        maxResults: 20, // Get more results initially to have enough after filtering
        q: `${query} song`, // Add "song" to the query to improve relevance
        type: 'video',
        videoCategoryId: '10', // Music category ID
        key: API_KEY,
      },
    });

    // --- NEW FILTERING LOGIC ---
    const negativeKeywords = [
      '#shorts', 'shorts', 'cover', 'reaction', 'tutorial', 
      'interview', 'live stream', 'album review', 'teaser', 'trailer'
    ];

    const filteredItems = response.data.items.filter(item => {
      // Basic check to ensure we are dealing with a video
      if (item.id.kind !== 'youtube#video') {
        return false;
      }
      
      const title = item.snippet.title.toLowerCase();

      // 1. Filter out livestreams
      if (item.snippet.liveBroadcastContent === 'live') {
        return false;
      }

      // 2. Filter out titles containing negative keywords
      if (negativeKeywords.some(keyword => title.includes(keyword))) {
        return false;
      }
      
      // If it passes all checks, keep it
      return true;
    });

    // Return only the top 5-7 results after filtering
    return filteredItems.slice(0, 7);

  } catch (error) {
    console.error('Error searching YouTube:', error);
    return [];
  }
};