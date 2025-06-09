import React, { useRef, useEffect } from 'react';
import './LyricsViewer.css';

const LyricsViewer = ({ lyricsData, currentTime }) => {
  const activeLineRef = useRef(null);

 if (!lyricsData || typeof lyricsData.lyrics !== 'string' && !Array.isArray(lyricsData.lyrics)) {
    return <div className="lyrics-container"><p>Search for a song to see lyrics.</p></div>;
  }

  const { synced, lyrics } = lyricsData;

  let activeIndex = -1;
  if (synced) {
    // Find the index of the current line
    activeIndex = lyrics.findIndex((line, index) => {
      const nextLine = lyrics[index + 1];
      return currentTime >= line.time && (nextLine ? currentTime < nextLine.time : true);
    });
  }
  
  // Auto-scroll logic
  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  return (
    <div className="lyrics-container">
      {synced ? (
        lyrics.map((line, index) => (
          <p
            key={index}
            ref={index === activeIndex ? activeLineRef : null}
            className={`lyric-line ${index === activeIndex ? 'active' : ''} ${index < activeIndex ? 'passed' : ''}`}
          >
            {line.text}
          </p>
        ))
      ) : (
        <pre className="static-lyrics">{lyrics}</pre>
      )}
    </div>
  );
};

export default LyricsViewer;