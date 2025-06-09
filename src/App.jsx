// File: src/App.jsx (Corrected Version)

import React, { useState, useRef, useEffect } from 'react';
import { searchYouTube, getRelatedVideos } from './api/youtubeApi';
import { fetchLyrics, parseLRC } from './api/lyricsApi';

import Player from './components/Player';
import LocalAudioPlayer from './components/LocalAudioPlayer';
import LyricsViewer from './components/LyricsViewer';
import PlaybackControls from './components/PlaybackControls';
import DevMenu from './components/DevMenu';
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
  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);
  const [playerType, setPlayerType] = useState('youtube');
  const [localFileUrl, setLocalFileUrl] = useState(null);
  const [localFileName, setLocalFileName] = useState('');
  const [localLrcText, setLocalLrcText] = useState('');
  const [localSeekTime, setLocalSeekTime] = useState(null);

  const playerRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.ctrlKey && e.shiftKey && e.key === 'D') { e.preventDefault(); setIsDevMenuOpen(prev => !prev); } };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'audio/mpeg') {
      const url = URL.createObjectURL(file);
      setLocalFileUrl(url);
      setLocalFileName(file.name);
    }
  };

  const handleLrcChange = (e) => setLocalLrcText(e.target.value);

  const handleLoadLocal = () => {
    if (!localFileUrl || !localLrcText) { alert("Please provide both an MP3 file and LRC lyrics."); return; }
    handleStopPlayback();
    setPlayerType('local');
    setSelectedVideo({ snippet: { title: localFileName.replace('.mp3', ''), thumbnails: { default: { url: '' } } } });
    setLyricsData({ synced: true, lyrics: parseLRC(localLrcText) });
    setIsPlaying(true);
    setIsDevMenuOpen(false);
  };
  
  const handleStopPlayback = () => { if (playerRef.current) { playerRef.current.stopVideo?.(); } setPlayerType('youtube'); setSelectedVideo(null); setLyricsData(null); setIsSongFinished(false); setSearchResults([]); setRecommendations([]); setSearchTerm(""); if(localFileUrl) { URL.revokeObjectURL(localFileUrl); setLocalFileUrl(null); }};
  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleSeek = (newTime) => { const time = Number(newTime); if (playerType === 'youtube' && playerRef.current) { playerRef.current.seekTo(time, true); } else { setLocalSeekTime(time); } setCurrentTime(time); if (!isPlaying) { setIsPlaying(true); } };
  const handleVolumeChange = (newVolume) => { const vol = Number(newVolume); setVolume(vol); if (playerRef.current) playerRef.current.setVolume?.(vol); };
  const handleReplay = () => { handleSeek(0); };

  const onPlayerReady = (event) => { playerRef.current = event.target; playerRef.current.setVolume(volume); };
  const onPlayerStateChange = (event) => { clearInterval(intervalRef.current); if (event.data === 0) { setIsPlaying(false); setIsSongFinished(true); } else if (event.data === 1) { setIsPlaying(true); setIsSongFinished(false); setDuration(playerRef.current.getDuration()); intervalRef.current = setInterval(() => { setCurrentTime(playerRef.current.getCurrentTime()); }, 250); } else { setIsPlaying(false); } };
  
  const handleLocalTimeUpdate = (time) => setCurrentTime(time);
  const handleLocalDurationChange = (d) => setDuration(d);
  const handleLocalEnded = () => { setIsPlaying(false); setIsSongFinished(true); };

  const handleSearch = async (e) => { e.preventDefault(); if (!searchTerm) return; setIsLoading(true); setRecommendations([]); setSearchResults(await searchYouTube(searchTerm)); setIsLoading(false); };
  const handleSelectVideo = async (video) => { handleStopPlayback(); setPlayerType('youtube'); setIsSongFinished(false); setSelectedVideo(video); setSearchResults([]); setIsLoading(true); setLyricsData(null); setRecommendations([]); const youtubeTitle = video.snippet.title; const titleParts = youtubeTitle.split(' - '); let artist, songTitle; if (titleParts.length >= 2) { artist = titleParts[0].trim(); songTitle = titleParts.slice(1).join(' - ').trim(); } else { artist = video.snippet.channelTitle.replace(' - Topic', '').trim(); songTitle = youtubeTitle.trim(); } const cleanedSongTitle = songTitle.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim(); const lyricsPromise = fetchLyrics(artist, cleanedSongTitle); const relatedPromise = getRelatedVideos(video.id.videoId); try { const [lyricsResult, relatedResult] = await Promise.all([lyricsPromise, relatedPromise]); setLyricsData(lyricsResult); setRecommendations(relatedResult); } catch (error) { console.error("Failed to fetch data:", error); } setIsLoading(false); };
  
  useEffect(() => { return () => clearInterval(intervalRef.current); }, []);

  return (
    <div className="App">
      <DevMenu isOpen={isDevMenuOpen} onClose={() => setIsDevMenuOpen(false)} onFileChange={handleFileChange} onLrcChange={handleLrcChange} onLoadLocal={handleLoadLocal} localFileName={localFileName} />
      
      <header className={`App-header ${selectedVideo ? 'condensed' : ''}`}>
        <h1>LyricSync</h1>
        {selectedVideo && !isSongFinished && <button onClick={handleStopPlayback} className="stop-button">New Search</button>}
      </header>

      {selectedVideo && playerType === 'youtube' && <Player videoId={selectedVideo.id.videoId} onReady={onPlayerReady} onStateChange={onPlayerStateChange} />}
      {selectedVideo && playerType === 'local' && <LocalAudioPlayer fileUrl={localFileUrl} isPlaying={isPlaying} seekTime={localSeekTime} onTimeUpdate={handleLocalTimeUpdate} onDurationChange={handleLocalDurationChange} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={handleLocalEnded} />}
      
      <main>
        {(!selectedVideo || isSongFinished) && (
          <form onSubmit={handleSearch} className="search-form">
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search for a song..." disabled={isLoading} />
            <button type="submit" disabled={isLoading}>{isLoading ? 'Searching...' : 'Search'}</button>
          </form>
        )}

        {searchResults.length > 0 && (
          <div className="search-results">{searchResults.map((video) => (<div key={video.id.videoId} className="result-item" onClick={() => handleSelectVideo(video)}><img src={video.snippet.thumbnails.default.url} alt={video.snippet.title} /><p>{video.snippet.title}</p></div>))}</div>
        )}

        {selectedVideo && (
          <>
            <h2 className="current-song-title">{selectedVideo.snippet.title}</h2>
            
            {isSongFinished && (
              <>
                <div className="replay-container"><button onClick={handleReplay} className="replay-button">Replay</button></div>
                {recommendations.length > 0 && (
                  <div className="recommendations-container">
                    <h3 className="recommendations-title">Up Next...</h3>
                    <div className="search-results">{recommendations.map((rec) => (<div key={rec.id.videoId} className="result-item" onClick={() => handleSelectVideo(rec)}><img src={rec.snippet.thumbnails.default.url} alt={rec.snippet.title} /><p>{rec.snippet.title}</p></div>))}</div>
                  </div>
                )}
              </>
            )}

            {!isSongFinished && (
              <>
                <PlaybackControls isPlaying={isPlaying} onPlayPause={handlePlayPause} currentTime={currentTime} duration={duration} onSeek={handleSeek} volume={volume} onVolumeChange={handleVolumeChange} />
                {lyricsData && <LyricsViewer lyricsData={lyricsData} currentTime={currentTime} onSeek={handleSeek} />}
              </>
            )}
          </>
        )}
        
        {isLoading && !lyricsData && <div className="loader">Loading...</div>}
      </main>
    </div>
  );
}

export default App;