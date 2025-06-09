// File: src/App.jsx

import React, { useState, useRef, useEffect } from 'react';
import { searchYouTube } from './api/youtubeApi';
import { fetchLyrics } from './api/lyricsApi';

import Player from './components/Player';
import LyricsViewer from './components/LyricsViewer';
import './App.css';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [lyricsData, setLyricsData] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const playerRef = useRef(null);
  const intervalRef = useRef(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm) return;
    setIsLoading(true);
    setSearchResults(await searchYouTube(searchTerm));
    setIsLoading(false);
  };

  const handleSelectVideo = async (video) => {
    setSelectedVideo(video);
    setSearchResults([]);
    setIsLoading(true);
    setLyricsData(null);

    const youtubeTitle = video.snippet.title;
    const titleParts = youtubeTitle.split(' - ');
    
    let artist, songTitle;

    if (titleParts.length >= 2) {
      artist = titleParts[0].trim();
      songTitle = titleParts.slice(1).join(' - ').trim();
    } else {
      // Fallback for titles without a " - " separator
      artist = video.snippet.channelTitle.replace(' - Topic', '').trim();
      songTitle = youtubeTitle.trim();
    }
    
    const cleanedSongTitle = songTitle.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();
    
    setLyricsData(await fetchLyrics(artist, cleanedSongTitle));
    setIsLoading(false);
  };
  
  const onPlayerReady = (event) => {
    playerRef.current = event.target;
  };
  
  const onPlayerStateChange = (event) => {
    clearInterval(intervalRef.current);
    if (event.data === 1) { // Playing
       intervalRef.current = setInterval(() => {
           setCurrentTime(playerRef.current.getCurrentTime());
       }, 250);
    }
  };
  
  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>LyricSync</h1>
      </header>
      <main>
        <form onSubmit={handleSearch} className="search-form">
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search for a song..." disabled={isLoading} />
          <button type="submit" disabled={isLoading}>{isLoading ? 'Searching...' : 'Search'}</button>
        </form>

        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((video) => (
              <div key={video.id.videoId} className="result-item" onClick={() => handleSelectVideo(video)}>
                <img src={video.snippet.thumbnails.default.url} alt={video.snippet.title} />
                <p>{video.snippet.title}</p>
              </div>
            ))}
          </div>
        )}

        {selectedVideo && <Player videoId={selectedVideo.id.videoId} onReady={onPlayerReady} onStateChange={onPlayerStateChange} />}
        
        {isLoading && !lyricsData && <div className="loader">Loading Lyrics...</div>}

        {lyricsData && <LyricsViewer lyricsData={lyricsData} currentTime={currentTime} />}
      </main>
    </div>
  );
}

export default App;