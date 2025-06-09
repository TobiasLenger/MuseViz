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
    const results = await searchYouTube(searchTerm);
    setSearchResults(results);
    setIsLoading(false);
  };

  const handleSelectVideo = async (video) => {
    setSelectedVideo(video);
    setSearchResults([]); // Clear search results
    setIsLoading(true);
    setLyricsData(null); // Clear old lyrics
    
    // Clean up artist/title for better lyric matching
    const { title } = video.snippet;
    const [artist, songTitle] = title.split(' - ');
    
    if (artist && songTitle) {
      const lyrics = await fetchLyrics(artist.trim(), songTitle.trim().replace(/ \(.*\)/, '')); // remove things like (Official Video)
      setLyricsData(lyrics);
    } else {
       setLyricsData({ synced: false, lyrics: "Could not determine artist and title from YouTube." });
    }
    setIsLoading(false);
  };
  
  // This function is passed to the YouTube component
  const onPlayerReady = (event) => {
    playerRef.current = event.target;
  };
  
  // This function is called when the player state changes (playing, paused)
  const onPlayerStateChange = (event) => {
    // Player.PlayerState.PLAYING = 1
    if (event.data === 1) {
       // Start polling for current time
       intervalRef.current = setInterval(() => {
           setCurrentTime(playerRef.current.getCurrentTime());
       }, 250); // Poll 4 times a second
    } else {
        // Clear interval when paused or ended
        clearInterval(intervalRef.current);
    }
  };
  
  // Cleanup interval on component unmount
  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>LyricSync</h1>
        <p>Play YouTube videos as audio and get synced lyrics.</p>
      </header>

      <main>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for a song..."
          />
          <button type="submit" disabled={isLoading}>Search</button>
        </form>

        {isLoading && <div className="loader"></div>}

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

        {selectedVideo && (
            <>
              <Player videoId={selectedVideo.id.videoId} onReady={onPlayerReady} onStateChange={onPlayerStateChange} />
              <h2 className="current-song">{selectedVideo.snippet.title}</h2>
            </>
        )}

        <LyricsViewer lyricsData={lyricsData} currentTime={currentTime} />
      </main>
    </div>
  );
}

export default App;