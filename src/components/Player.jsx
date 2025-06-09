import React from 'react';
import YouTube from 'react-youtube';

const Player = ({ videoId, onReady, onStateChange }) => {
  const opts = {
    // Hide the player visually
    height: '1',
    width: '1',
    playerVars: {
      autoplay: 1,
    },
  };

  return <YouTube videoId={videoId} opts={opts} onReady={onReady} onStateChange={onStateChange} />;
};

export default Player;