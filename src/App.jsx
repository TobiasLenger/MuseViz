// File: src/App.jsx

import React, { useState, useRef, useEffect } from 'react';
import { searchYouTube, getRelatedVideos } from './api/youtubeApi';
import { fetchLyrics } from './api/lyricsApi';

import Player from './components/Player';
import LyricsViewer from './components/LyricsViewer';
import PlaybackControls from './components/PlaybackControls';
import './App.css';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [lyricsData, setLyricsData] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isSongFinished, setIsSongFinished] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  const playerRef = useRef(null);
  const intervalRef = useRef(null);

  const handleStopPlayback = () => { if (playerRef.current) { playerRef.current.stopVideo(); } setSelectedVideo(null); setLyricsData(null); setIsSongFinished(false); setSearchResults([]); setRecommendations([]); setSearchTerm(""); };
  const handlePlayPause = () => { if (!playerRef.current) return; if (isPlaying) { playerRef.current.pauseVideo(); } else { playerRef.current.playVideo(); } };
  const handleSeek = (newTime) => { if (!playerRef.current) return; const time = Number(newTime); playerRef.current.seekTo(time, true); setCurrentTime(time); if (!isPlaying) { playerRef.current.playVideo(); }};
  const handleVolumeChange = (newVolume) => { if (!playerRef.current) return; const vol = Number(newVolume); setVolume(vol); playerRef.current.setVolume(vol); };
  const handleReplay = () => { if (!playerRef.current) return; setIsSongFinished(false); playerRef.current.seekTo(0, true); playerRef.current.playVideo(); };
  const onPlayerReady = (event) => { playerRef.current = event.target; playerRef.current.setVolume(volume); setDuration(playerRef.current.getDuration()); };
  const onPlayerStateChange = (event) => { clearInterval(intervalRef.current); if (event.data === 0) { setIsPlaying(false); setIsSongFinished(true); } else if (event.data === 1) { setIsPlaying(true); setIsSongFinished(false); setDuration(playerRef.current.getDuration()); intervalRef.current = setInterval(() => { setCurrentTime(playerRef.current.getCurrentTime()); }, 250); } else { setIsPlaying(false); } };
  const handleSearch = async (e) => { e.preventDefault(); if (!searchTerm) return; setIsLoading(true); setRecommendations([]); setSearchResults(await searchYouTube(searchTerm)); setIsLoading(false); };
  
  const handleSelectVideo = async (video) => {
    setIsSongFinished(false);
    setSelectedVideo(video);
    setSearchResults([]);
    setIsLoading(true);
    setLyricsData(null);
    setRecommendations([]);

    const youtubeTitle = video.snippet.title;
    const titleParts = youtubeTitle.split(' - ');
    let artist, songTitle;

    if (titleParts.length >= 2) {
      artist = titleParts[0].trim();
      songTitle = titleParts.slice(1).join(' - ').trim();
    } else {
      artist = video.snippet.channelTitle.replace(' - Topic', '').trim();
      songTitle = youtubeTitle.trim();
    }
    const cleanedSongTitle = songTitle.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();

    const lyricsPromise = fetchLyrics(artist, cleanedSongTitle);
    const relatedPromise = getRelatedVideos(video.id.videoId);
    
    try {
      const [lyricsResult, relatedResult] = await Promise.all([lyricsPromise, relatedPromise]);
      setLyricsData(lyricsResult);
      setRecommendations(relatedResult);
    } catch (error) {
      console.error("Failed to fetch lyrics or recommendations:", error);
    }
    setIsLoading(false);
  };
  
  useEffect(() => { return () => clearInterval(intervalRef.current); }, []);

  return (
    <div className="App">
      <header className={`App-header ${selectedVideo ? 'condensed' : ''}`}>
        <h1>LyricSync</h1>
        {selectedVideo && !isSongFinished && <button onClick={handleStopPlayback} className="stop-button">New Search</button>}
      </header>
      
      {/* The hidden YouTube player can stay here */}
      {selectedVideo && <Player videoId={selectedVideo.id.videoId} onReady={onPlayerReady} onStateChange={onPlayerStateChange} />}

      <main>
        {(!selectedVideo || isSongFinished) && (
          <form onSubmit={handleSearch} className="search-form">
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search for a song..." disabled={isLoading} />
            <button type="submit" disabled={isLoading}>{isLoading ? 'Searching...' : 'Search'}</button>
          </form>
        )}
        {searchResults.length > 0 && <div className="search-results">{searchResults.map((video) => (<div key={video.id.videoId} className="result-item" onClick={() => handleSelectVideo(video)}><img src={video.snippet.thumbnails.default.url} alt={video.snippet.title} /><p>{video.snippet.title}</p></div>))}</div>}
        
        {selectedVideo && !isSongFinished && lyricsData && <LyricsViewer lyricsData={lyricsData} currentTime={currentTime} onSeek={handleSeek} />}
        
        {selectedVideo && isSongFinished && (
          <>
            <div className="replay-container"><button onClick={handleReplay} className="replay-button">Replay</button></div>
            {recommendations.length > 0 && (
              <div className="recommendations-container">
                <h3 className="recommendations-title">Up Next...</h3>
                <div className="search-results">
                  {recommendations.map((rec) => (<div key={rec.id.videoId} className="result-item" onClick={() => handleSelectVideo(rec)}><img src={rec.snippet.thumbnails.default.url} alt={rec.snippet.title} /><p>{rec.snippet.title}</p></div>))}
                </div>
              </div>
            )}
          </>
        )}
        
        {isLoading && !lyricsData && <div className="loader">Loading...</div>}
      </main>

      {/* --- CONTROLS MOVED TO A STICKY FOOTER --- */}
      {selectedVideo && !isSongFinished && (
        <footer className="sticky-controls-footer">
          <h2 className="current-song-title">{selectedVideo.snippet.title}</h2>
          <PlaybackControls isPlaying={isPlaying} onPlayPause={handlePlayPause} currentTime={currentTime} duration={duration} onSeek={handleSeek} volume={volume} onVolumeChange={handleVolumeChange} />
        </footer>
      )}
    </div>
  );
}

export default App;