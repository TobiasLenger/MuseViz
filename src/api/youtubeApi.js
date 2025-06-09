import axios from 'axios';

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export const searchYouTube = async (query) => {
  try {
    const response = await axios.get(`${BASE_URL}/search`, {
      params: {
        part: 'snippet',
        maxResults: 5,
        q: query,
        type: 'video',
        key: API_KEY,
      },
    });
    return response.data.items;
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return [];
  }
};