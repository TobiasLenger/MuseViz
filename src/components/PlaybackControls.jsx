import React from 'react';
import './PlaybackControls.css';

// Helper function to format time from seconds to MM:SS
const formatTime = (timeInSeconds) => {
  if (isNaN(timeInSeconds) || timeInSeconds === 0) return '00:00';
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// SVG icons for our controls
const PlayIcon = () => (
  <svg role="img" height="24" width="24" viewBox="0 0 24 24">
    <path fill="currentColor" d="M7.05 3.606l13.49 7.788a.7.7 0 010 1.212L7.05 20.394A.7.7 0 016 19.788V4.212a.7.7 0 011.05-.606z"></path>
  </svg>
);

const PauseIcon = () => (
  <svg role="img" height="24" width="24" viewBox="0 0 24 24">
    <path fill="currentColor" d="M5.7 3a.7.7 0 00-.7.7v16.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V3.7a.7.7 0 00-.7-.7H5.7zm10 0a.7.7 0 00-.7.7v16.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V3.7a.7.7 0 00-.7-.7h-2.6z"></path>
  </svg>
);

const VolumeIcon = () => (
    <svg role="img" height="16" width="16" viewBox="0 0 16 16">
        <path fill="currentColor" d="M9.741.85a.75.75 0 01.375.65v13a.75.75 0 01-1.125.65l-6.925-4a3.642 3.642 0 01-1.33-4.967 3.639 3.639 0 011.33-1.332l6.925-4a.75.75 0 01.75 0zm-6.924 5.3a2.142 2.142 0 00-1.072 2.585 2.14 2.14 0 001.072 1.072l6.175 3.555v-11.8l-6.175 3.588zM12 3.75a.75.75 0 01.75.75v7a.75.75 0 01-1.5 0v-7a.75.75 0 01.75-.75zm2 1.5a.75.75 0 01.75.75v4a.75.75 0 01-1.5 0v-4a.75.75 0 01.75-.75z"></path>
    </svg>
);


const PlaybackControls = ({ isPlaying, onPlayPause, currentTime, duration, onSeek, volume, onVolumeChange }) => {
  return (
    <div className="playback-controls">
      {/* Main Controls: Play/Pause */}
      <div className="main-controls">
        <button className="control-button" onClick={onPlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>

      {/* Progress Bar and Time */}
      <div className="progress-bar-container">
        <span>{formatTime(currentTime)}</span>
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={(e) => onSeek(e.target.value)}
          className="progress-slider"
          style={{'--progress-percent': `${(currentTime / duration) * 100}%`}}
        />
        <span>{formatTime(duration)}</span>
      </div>

      {/* Volume Controls */}
      <div className="volume-container">
        <VolumeIcon />
        <input
          type="range"
          min="0"
  max="100"
          value={volume}
          onChange={(e) => onVolumeChange(e.target.value)}
          className="volume-slider"
          style={{'--volume-percent': `${volume}%`}}
        />
      </div>
    </div>
  );
};

export default PlaybackControls;