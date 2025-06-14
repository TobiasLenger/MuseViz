// File: src/App.jsx (Corrected Dev Menu Logic)

import React, { useState, useRef, useEffect } from 'react';
import { searchYouTube, getRelatedVideos } from './api/youtubeApi';
import { fetchLyrics, parseLRC } from './api/lyricsApi';

import Player from './components/Player';
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
  const [localLrcFileName, setLocalLrcFileName] = useState('');

  const playerRef = useRef(null);
  const localAudioRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => { const handleKeyDown = (e) => { if (e.ctrlKey && e.shiftKey && e.key === 'D') { e.preventDefault(); setIsDevMenuOpen(prev => !prev); } }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, []);
  
  const handleFileChange = (e) => { const file = e.target.files[0]; if (file) { setLocalFileUrl(URL.createObjectURL(file)); setLocalFileName(file.name); } };
  const handleLrcFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLocalLrcFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => setLocalLrcText(event.target.result);
    reader.readAsText(file);
  };
  
  const handleLoadLocal = () => { if (!localFileUrl || !localLrcText) { alert("Please provide both an MP3 and LRC file."); return; } handleStopPlayback(); setPlayerType('local'); setSelectedVideo({ snippet: { title: localFileName.replace('.mp3', ''), thumbnails: { default: { url: '' } } } }); setLyricsData({ synced: true, lyrics: parseLRC(localLrcText) }); setIsDevMenuOpen(false); };
  
  const handleStopPlayback = () => {
    if (playerRef.current) playerRef.current.stopVideo?.();
    if (localAudioRef.current) localAudioRef.current.pause();
    setPlayerType('youtube'); setSelectedVideo(null); setLyricsData(null); setIsSongFinished(false); setSearchResults([]); setRecommendations([]); setSearchTerm("");
    if (localFileUrl) { URL.revokeObjectURL(localFileUrl); setLocalFileUrl(null); }
  };
  
  const handlePlayPause = () => { if (playerType === 'youtube' && playerRef.current) { const playerState = playerRef.current.getPlayerState(); if (playerState === 1) playerRef.current.pauseVideo(); else playerRef.current.playVideo(); } else if (playerType === 'local' && localAudioRef.current) { if (localAudioRef.current.paused) localAudioRef.current.play(); else localAudioRef.current.pause(); } };
  const handleSeek = (newTime) => { const time = Number(newTime); setCurrentTime(time); if (playerType === 'youtube' && playerRef.current) { playerRef.current.seekTo(time, true); } else if (playerType === 'local' && localAudioRef.current) { localAudioRef.current.currentTime = time; } if (!isPlaying) { if (playerType === 'youtube') { playerRef.current.playVideo(); } else { localAudioRef.current.play(); } } };
  const handleVolumeChange = (newVolume) => { const vol = Number(newVolume); setVolume(vol); if (playerType === 'youtube' && playerRef.current) { playerRef.current.setVolume(vol); } else if (playerType === 'local' && localAudioRef.current) { localAudioRef.current.volume = vol / 100; } };
  const handleReplay = () => handleSeek(0);
  
  const onPlayerReady = (event) => { playerRef.current = event.target; playerRef.current.setVolume(volume); };
  const onPlayerStateChange = (event) => { clearInterval(intervalRef.current); if (event.data === 0) { setIsPlaying(false); setIsSongFinished(true); } else if (event.data === 1) { setIsPlaying(true); setIsSongFinished(false); setDuration(playerRef.current.getDuration()); intervalRef.current = setInterval(() => { setCurrentTime(playerRef.current.getCurrentTime()); }, 250); } else { setIsPlaying(false); } };
  
  const handleSearch = async (e) => { e.preventDefault(); if (!searchTerm) return; setIsLoading(true); setRecommendations([]); setSearchResults(await searchYouTube(searchTerm)); setIsLoading(false); };
  const handleSelectVideo = async (video) => { handleStopPlayback(); setPlayerType('youtube'); setIsSongFinished(false); setSelectedVideo(video); setSearchResults([]); setIsLoading(true); setLyricsData(null); setRecommendations([]); const youtubeTitle = video.snippet.title; const titleParts = youtubeTitle.split(' - '); let artist, songTitle; if (titleParts.length >= 2) { artist = titleParts[0].trim(); songTitle = titleParts.slice(1).join(' - ').trim(); } else { artist = video.snippet.channelTitle.replace(' - Topic', '').trim(); songTitle = youtubeTitle.trim(); } const cleanedSongTitle = songTitle.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim(); const lyricsPromise = fetchLyrics(artist, cleanedSongTitle); const relatedPromise = getRelatedVideos(video.id.videoId); try { const [lyricsResult, relatedResult] = await Promise.all([lyricsPromise, relatedPromise]); setLyricsData(lyricsResult); setRecommendations(relatedResult); } catch (error) { console.error("Failed to fetch data:", error); } setIsLoading(false); };
  
  useEffect(() => { return () => clearInterval(intervalRef.current); }, []);
  useEffect(() => { const audio = localAudioRef.current; if (playerType === 'local' && audio) { const handleCanPlay = () => { setDuration(audio.duration); audio.play().catch(e => console.error("Playback failed:", e)); clearInterval(intervalRef.current); intervalRef.current = setInterval(() => { setCurrentTime(audio.currentTime); }, 250); }; audio.addEventListener('canplay', handleCanPlay); return () => audio.removeEventListener('canplay', handleCanPlay); } }, [localFileUrl, playerType]);

  return (
    <div className="App">
      <DevMenu
        isOpen={isDevMenuOpen}
        onClose={() => setIsDevMenuOpen(false)}
        onFileChange={handleFileChange}
        onLrcFileChange={handleLrcFileChange}
        onLoadLocal={handleLoadLocal}
        localFileName={localFileName}
        localLrcFileName={localLrcFileName}
        // --- THIS IS THE FIX ---
        isLoadDisabled={!localFileUrl || !localLrcText}
      />
      
      <header className={`App-header ${selectedVideo ? 'condensed' : ''}`}>
        <h1>LyricSync</h1>
        {selectedVideo && !isSongFinished && <button onClick={handleStopPlayback} className="stop-button">New Search</button>}
      </header>
      
      {selectedVideo && playerType === 'youtube' && <Player videoId={selectedVideo.id.videoId} onReady={onPlayerReady} onStateChange={onPlayerStateChange} />}
      {selectedVideo && playerType === 'local' && <audio ref={localAudioRef} src={localFileUrl} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsSongFinished(true)} onVolumeChange={(e) => setVolume(e.target.volume * 100)} style={{ display: 'none' }} />}

      <main>
        {(!selectedVideo || isSongFinished) && (
          <div className="search-container">
            <form onSubmit={handleSearch} className="search-form">
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search for a song..." disabled={isLoading} />
              <button type="submit" disabled={isLoading}>{isLoading ? 'Searching...' : 'Search'}</button>
            </form>
            {isLoading && <div className="loader">Searching...</div>}
            {searchResults.length > 0 && <div className="search-results">{searchResults.map((video) => (<div key={video.id.videoId} className="result-item" onClick={() => handleSelectVideo(video)}><img src={video.snippet.thumbnails.default.url} alt={video.snippet.title} /><p>{video.snippet.title}</p></div>))}</div>}
          </div>
        )}
        
        {selectedVideo && !isSongFinished && lyricsData && <LyricsViewer lyricsData={lyricsData} currentTime={currentTime} onSeek={handleSeek} />}
        
        {isSongFinished && (
          <div className="post-song-container">
            <div className="replay-container"><button onClick={handleReplay} className="replay-button">Replay</button></div>
            {recommendations.length > 0 && (
              <div className="recommendations-container">
                <h3 className="recommendations-title">Up Next...</h3>
                <div className="search-results">{recommendations.map((rec) => (<div key={rec.id.videoId} className="result-item" onClick={() => handleSelectVideo(rec)}><img src={rec.snippet.thumbnails.default.url} alt={rec.snippet.title} /><p>{rec.snippet.title}</p></div>))}</div>
              </div>
            )}
          </div>
        )}
        
        {isLoading && !selectedVideo && <div className="loader">Loading...</div>}
      </main>

      {selectedVideo && !isSongFinished && (
        <footer className="playback-footer">
          <PlaybackControls
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            songTitle={selectedVideo.snippet.title}
          />
        </footer>
      )}
    </div>
  );
}

export default App;