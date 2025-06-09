// File: src/components/LyricsViewer.jsx

import React, { useRef, useEffect } from 'react';
import './LyricsViewer.css';

const LyricsViewer = ({ lyricsData, currentTime, onSeek }) => { // <-- Accept onSeek prop
  const activeLineRef = useRef(null);

  // Calculate activeIndex inside the component
  let activeIndex = -1;
  const areLyricsSynced = lyricsData?.synced && Array.isArray(lyricsData.lyrics) && lyricsData.lyrics.length > 0;

  if (areLyricsSynced) {
    activeIndex = lyricsData.lyrics.findIndex((line, index) => {
      const nextLine = lyricsData.lyrics[index + 1];
      if (typeof line.time !== 'number') return false;
      return currentTime >= line.time && (nextLine ? currentTime < nextLine.time : true);
    });
  }

  // Scroll effect still depends on activeIndex
  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  if (!lyricsData || !lyricsData.lyrics) {
    return <div className="lyrics-container"><div className="loader">Search for a song...</div></div>;
  }
  
  if (areLyricsSynced) {
    return (
      <div className="lyrics-container">
        {lyricsData.lyrics.map((line, index) => (
          <p
            key={index}
            ref={index === activeIndex ? activeLineRef : null}
            className={`lyric-line ${index === activeIndex ? 'active' : ''} ${index < activeIndex ? 'passed' : ''}`}
            onClick={() => onSeek(line.time)} // <-- ADDED ONCLICK HANDLER
          >
            {line.text}
          </p>
        ))}
      </div>
    );
  }

  if (typeof lyricsData.lyrics === 'string') {
    return (
      <div className="lyrics-container">
        <pre className="static-lyrics">{lyricsData.lyrics}</pre>
      </div>
    );
  }

  return (
    <div className="lyrics-container">
      <div className="loader">Lyrics could not be displayed.</div>
    </div>
  );
};

export default LyricsViewer;