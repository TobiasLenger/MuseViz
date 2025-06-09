// src/components/LyricsViewer.jsx

import React, { useRef, useEffect } from 'react';
import './LyricsViewer.css';

const LyricsViewer = ({ lyricsData, currentTime }) => {
  const activeLineRef = useRef(null);

  // --- START OF FIX ---

  // 1. Handle the initial loading or error state cleanly.
  if (!lyricsData || !lyricsData.lyrics) {
    return <div className="lyrics-container"><p>Search for a song to see lyrics.</p></div>;
  }

  const { synced, lyrics } = lyricsData;
  
  // 2. Create a reliable flag. Synced lyrics must be a non-empty array.
  const areLyricsSynced = synced && Array.isArray(lyrics) && lyrics.length > 0;

  let activeIndex = -1;
  if (areLyricsSynced) {
    // This block is now safe because we've confirmed `lyrics` is an array.
    activeIndex = lyrics.findIndex((line, index) => {
      const nextLine = lyrics[index + 1];
      // Defensive check in case a line has no time property
      if (typeof line.time !== 'number') return false;
      return currentTime >= line.time && (nextLine ? currentTime < nextLine.time : true);
    });
  }

  // Auto-scroll logic (no changes needed here)
  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  // 3. Use our reliable flag to decide what to render.
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

  // 4. If lyrics aren't synced (or are malformed), render them as static text.
  // This also handles the case where lyrics is a string from Genius.
  if (typeof lyrics === 'string') {
    return (
      <div className="lyrics-container">
        <pre className="static-lyrics">{lyrics}</pre>
      </div>
    );
  }

  // 5. A final fallback if the data is in a completely unexpected format.
  return (
    <div className="lyrics-container">
      <p>Lyrics are available but could not be displayed.</p>
    </div>
  );
  // --- END OF FIX ---
};

export default LyricsViewer;