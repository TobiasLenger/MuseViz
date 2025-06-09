// File: src/api/youtubeApi.js

import axios from 'axios';

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

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
  try {
    const response = await axios.get(`${BASE_URL}/search`, {
      params: {
        part: 'snippet', maxResults: 20, q: `${query} song`, type: 'video', videoCategoryId: '10', key: API_KEY,
      },
    });
    const filtered = filterVideos(response.data.items);
    return filtered.slice(0, 7);
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return [];
  }
};

// --- NEW FUNCTION ---
export const getRelatedVideos = async (videoId) => {
  try {
    const response = await axios.get(`${BASE_URL}/search`, {
      params: {
        part: 'snippet', maxResults: 10, relatedToVideoId: videoId, type: 'video', key: API_KEY,
      },
    });
    const filtered = filterVideos(response.data.items);
    return filtered.slice(0, 5); // Return top 5 related videos
  } catch (error) {
    console.error('Error getting related videos:', error);
    return [];
  }
};