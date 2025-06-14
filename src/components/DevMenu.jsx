// File: src/components/DevMenu.jsx

import React from 'react';
import './DevMenu.css';

// Accept the new isLoadDisabled prop
const DevMenu = ({ isOpen, onClose, onFileChange, onLrcFileChange, onLoadLocal, localFileName, localLrcFileName, isLoadDisabled }) => {
  if (!isOpen) return null;

  return (
    <div className="dev-menu-backdrop" onClick={onClose}>
      <div className="dev-menu-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Developer Menu</h2>
        <p>This panel allows you to test the player with local files, bypassing the YouTube API.</p>
        
        <div className="dev-input-group">
          <label htmlFor="mp3-upload">1. Upload MP3 File</label>
          <input id="mp3-upload" type="file" accept=".mp3,audio/mpeg" onChange={onFileChange} />
          {localFileName && <p className="file-name">Loaded: {localFileName}</p>}
        </div>

        <div className="dev-input-group">
          <label htmlFor="lrc-upload">2. Upload LRC File</label>
          <input id="lrc-upload" type="file" accept=".lrc" onChange={onLrcFileChange} />
          {localLrcFileName && <p className="file-name">Loaded: {localLrcFileName}</p>}
        </div>

        {/* Apply the disabled attribute to the button */}
        <button
          className="dev-load-button"
          onClick={onLoadLocal}
          disabled={isLoadDisabled}
        >
          Load Local Song & Lyrics
        </button>
      </div>
    </div>
  );
};

export default DevMenu;