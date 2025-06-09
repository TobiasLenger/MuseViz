// File: src/components/LyricsViewer.jsx

import React, { useRef, useEffect } from 'react';
import './LyricsViewer.css';

const LyricsViewer = ({ lyricsData, currentTime }) => {
  const activeLineRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-scroll the active line into the center of the view
  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  }, [currentTime]); // Re-run whenever currentTime changes to keep it centered

  if (!lyricsData || !lyricsData.lyrics) {
    return <div className="lyrics-container"><div className="loader">Search for a song to see lyrics.</div></div>;
  }

  const { synced, lyrics } = lyricsData;
  const areLyricsSynced = synced && Array.isArray(lyrics) && lyrics.length > 0;

  let activeIndex = -1;
  if (areLyricsSynced) {
    activeIndex = lyrics.findIndex((line, index) => {
      const nextLine = lyrics[index + 1];
      if (typeof line.time !== 'number') return false;
      return currentTime >= line.time && (nextLine ? currentTime < nextLine.time : true);
    });
  }

  // Render synced lyrics with the wheel effect
  if (areLyricsSynced) {
    return (
      <div className="lyrics-container" ref={containerRef}>
        {lyrics.map((line, index) => {
          const distance = index - activeIndex;

          // Determine the class based on distance from the active line
          let className = 'lyric-line';
          if (distance === 0) {
            className += ' active';
          } else if (distance === 1) {
            className += ' next-1';
          } else if (distance === -1) {
            className += ' prev-1';
          } else if (distance === 2) {
            className += ' next-2';
          } else if (distance === -2) {
            className += ' prev-2';
          } else {
            className += ' distant';
          }
          
          return (
            <p key={index} className={className} ref={distance === 0 ? activeLineRef : null}>
              {line.text}
            </p>
          );
        })}
      </div>
    );
  }

  // Render unsynced or error lyrics as static text
  if (typeof lyrics === 'string') {
    return (
      <div className="lyrics-container">
        <pre className="static-lyrics">{lyrics}</pre>
      </div>
    );
  }

  // Fallback for unexpected data format
  return (
    <div className="lyrics-container">
      <div className="loader">Lyrics are available but could not be displayed.</div>
    </div>
  );
};

export default LyricsViewer;