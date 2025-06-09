import React, { useRef, useEffect } from 'react';

const LocalAudioPlayer = ({ fileUrl, isPlaying, seekTime, onTimeUpdate, onDurationChange, onPlay, onPause, onEnded }) => {
  const audioRef = useRef(null);

  // Effect to control play/pause
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);
  
  // Effect to handle seeking
  useEffect(() => {
    if (seekTime !== null && audioRef.current) {
        audioRef.current.currentTime = seekTime;
    }
  }, [seekTime]);

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      onDurationChange(audioRef.current.duration);
    }
  };

  return (
    <audio
      ref={audioRef}
      src={fileUrl}
      onTimeUpdate={(e) => onTimeUpdate(e.target.currentTime)}
      onLoadedMetadata={handleLoadedMetadata}
      onPlay={onPlay}
      onPause={onPause}
      onEnded={onEnded}
      style={{ display: 'none' }} // The player itself is invisible
    />
  );
};

export default LocalAudioPlayer;