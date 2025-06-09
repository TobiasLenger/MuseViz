// File: src/App.jsx

import React, { useState, useRef, useEffect } from 'react';
import { searchYouTube } from './api/youtubeApi';
import { fetchLyrics } from './api/lyricsApi';

import Player from './components/Player';
import LyricsViewer from './components/LyricsViewer';
import PlaybackControls from './components/PlaybackControls';
import './App.css';

function App() {
  // Existing State...
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [lyricsData, setLyricsData] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);

  // --- NEW STATE ---
  const [isSongFinished, setIsSongFinished] = useState(false);

  const playerRef = useRef(null);
  const intervalRef = useRef(null);

  // Control Handlers (handleSeek is now passed down)
  const handlePlayPause = () => { if (!playerRef.current) return; if (isPlaying) { playerRef.current.pauseVideo(); } else { playerRef.current.playVideo(); } };
  const handleSeek = (newTime) => { if (!playerRef.current) return; const time = Number(newTime); playerRef.current.seekTo(time, true); setCurrentTime(time); if (!isPlaying) { playerRef.current.playVideo(); }};
  const handleVolumeChange = (newVolume) => { if (!playerRef.current) return; const vol = Number(newVolume); setVolume(vol); playerRef.current.setVolume(vol); };
  
  // --- NEW REPLAY HANDLER ---
  const handleReplay = () => {
    if (!playerRef.current) return;
    setIsSongFinished(false);
    playerRef.current.seekTo(0, true);
    playerRef.current.playVideo();
  };
  
  // --- UPDATED YOUTUBE PLAYER HANDLERS ---
  const onPlayerReady = (event) => { playerRef.current = event.target; playerRef.current.setVolume(volume); setDuration(playerRef.current.getDuration()); };
  const onPlayerStateChange = (event) => {
    clearInterval(intervalRef.current);
    // Player state `0` is 'ENDED'
    if (event.data === 0) {
      setIsPlaying(false);
      setIsSongFinished(true);
    } 
    // Player state `1` is 'PLAYING'
    else if (event.data === 1) {
      setIsPlaying(true);
      setIsSongFinished(false); // Ensure it's not finished if playing
      setDuration(playerRef.current.getDuration());
      intervalRef.current = setInterval(() => {
        setCurrentTime(playerRef.current.getCurrentTime());
      }, 250);
    } 
    // All other states (paused, buffering, etc.)
    else {
      setIsPlaying(false);
    }
  };

  const handleSearch = async (e) => { e.preventDefault(); if (!searchTerm) return; setIsLoading(true); setSearchResults(await searchYouTube(searchTerm)); setIsLoading(false); };
  const handleSelectVideo = async (video) => { setIsSongFinished(false); setSelectedVideo(video); setSearchResults([]); setIsLoading(true); setLyricsData(null); const youtubeTitle = video.snippet.title; const titleParts = youtubeTitle.split(' - '); let artist, songTitle; if (titleParts.length >= 2) { artist = titleParts[0].trim(); songTitle = titleParts.slice(1).join(' - ').trim(); } else { artist = video.snippet.channelTitle.replace(' - Topic', '').trim(); songTitle = youtubeTitle.trim(); } const cleanedSongTitle = songTitle.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim(); setLyricsData(await fetchLyrics(artist, cleanedSongTitle)); setIsLoading(false); };
  useEffect(() => { return () => clearInterval(intervalRef.current); }, []);

  return (
    <div className="App">
      <header className={`App-header ${selectedVideo ? 'condensed' : ''}`}>
        <h1>LyricSync</h1>
      </header>

      <main>
        {/* Search bar is visible if NO song is selected OR the song is finished */}
        {(!selectedVideo || isSongFinished) && (
          <form onSubmit={handleSearch} className="search-form">
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search for a song..." disabled={isLoading} />
            <button type="submit" disabled={isLoading}>{isLoading ? 'Searching...' : 'Search'}</button>
          </form>
        )}

        {searchResults.length > 0 && <div className="search-results">{searchResults.map((video) => (<div key={video.id.videoId} className="result-item" onClick={() => handleSelectVideo(video)}><img src={video.snippet.thumbnails.default.url} alt={video.snippet.title} /><p>{video.snippet.title}</p></div>))}</div>}

        {selectedVideo && (
          <>
            <h2 className="current-song-title">{selectedVideo.snippet.title}</h2>
            <Player videoId={selectedVideo.id.videoId} onReady={onPlayerReady} onStateChange={onPlayerStateChange} />
            
            {/* Show replay button when finished */}
            {isSongFinished && (
              <div className="replay-container">
                <button onClick={handleReplay} className="replay-button">Replay</button>
              </div>
            )}
            
            {/* Hide controls and lyrics when finished */}
            {!isSongFinished && (
              <>
                <PlaybackControls
                  isPlaying={isPlaying}
                  onPlayPause={handlePlayPause}
                  currentTime={currentTime}
                  duration={duration}
                  onSeek={handleSeek}
                  volume={volume}
                  onVolumeChange={handleVolumeChange}
                />
                {lyricsData && <LyricsViewer lyricsData={lyricsData} currentTime={currentTime} activeIndex={-1} onSeek={handleSeek} />}
              </>
            )}
          </>
        )}
        
        {isLoading && !lyricsData && <div className="loader">Loading Lyrics...</div>}
      </main>
    </div>
  );
}

export default App;