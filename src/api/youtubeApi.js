// File: src/api/youtubeApi.js

import axios from 'axios';

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// --- NEW CACHING MECHANISM ---
// This is a simple in-memory cache that will last for the user's session.
const searchCache = new Map();


// Negative keywords to filter out unwanted content
const negativeKeywords = [
  '#shorts', 'shorts', 'cover', 'reaction', 'tutorial', 
  'interview', 'live stream', 'album review', 'teaser', 'trailer', 'parody'
];

// Helper function to filter results
const filterVideos = (items) => {
  return items.filter(item => {
    if (item.id.kind !== 'youtube#video' || item.snippet.liveBroadcastContent === 'live') {
      return false;
    }
    const title = item.snippet.title.toLowerCase();
    if (negativeKeywords.some(keyword => title.includes(keyword))) {
      return false;
    }
    return true;
  });
};


export const searchYouTube = async (query) => {
  // --- CACHE LOGIC ---
  // 1. Check if we have already searched for this exact query.
  if (searchCache.has(query)) {
    console.log("Serving search results from cache for:", query);
    return searchCache.get(query); // Return the stored results
  }

  // If not in cache, proceed with the API call
  try {
    console.log("Making new API call for:", query);
    const response = await axios.get(`${BASE_URL}/search`, {
      params: {
        part: 'snippet', maxResults: 20, q: `${query} song`, type: 'video', videoCategoryId: '10', key: API_KEY,
      },
    });

    const filtered = filterVideos(response.data.items);
    const finalResults = filtered.slice(0, 7);
    
    // --- CACHE LOGIC ---
    // 2. Store the new results in our cache before returning them.
    searchCache.set(query, finalResults);

    return finalResults;

  } catch (error) {
    console.error('Error searching YouTube:', error);
    return [];
  }
};

// We can also cache related videos
const relatedCache = new Map();

export const getRelatedVideos = async (videoId) => {
  if (relatedCache.has(videoId)) {
    console.log("Serving related videos from cache for:", videoId);
    return relatedCache.get(videoId);
  }
  
  try {
    console.log("Fetching new related videos for:", videoId);
    const response = await axios.get(`${BASE_URL}/search`, {
      params: {
        part: 'snippet', maxResults: 10, relatedToVideoId: videoId, type: 'video', key: API_KEY,
      },
    });

    const filtered = filterVideos(response.data.items);
    const finalResults = filtered.slice(0, 5);

    relatedCache.set(videoId, finalResults);

    return finalResults;
  } catch (error) {
    console.error('Error getting related videos:', error);
    return [];
  }
};