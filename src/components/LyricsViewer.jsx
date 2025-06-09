// File: src/components/LyricsViewer.jsx

import React, { useRef, useEffect } from 'react';
import './LyricsViewer.css';

const LyricsViewer = ({ lyricsData, currentTime }) => {
  const activeLineRef = useRef(null);

  // Auto-scroll logic to keep the active line centered
  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentTime]); // Using currentTime to ensure it stays centered as the song plays

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

  // Render synced lyrics with the original karaoke-style animation
  if (areLyricsSynced) {
    return (
      <div className="lyrics-container">
        {lyrics.map((line, index) => (
          <p
            key={index}
            ref={index === activeIndex ? activeLineRef : null}
            className={`lyric-line ${index === activeIndex ? 'active' : ''} ${index < activeIndex ? 'passed' : ''}`}
          >
            {line.text}
          </p>
        ))}
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

  // Fallback
  return (
    <div className="lyrics-container">
      <div className="loader">Lyrics are available but could not be displayed.</div>
    </div>
  );
};

export default LyricsViewer;