import React from 'react';
import './DevMenu.css';

const DevMenu = ({ isOpen, onClose, onFileChange, onLrcChange, onLoadLocal, localFileName }) => {
  if (!isOpen) return null;

  return (
    <div className="dev-menu-backdrop" onClick={onClose}>
      <div className="dev-menu-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Developer Menu</h2>
        <p>This panel allows you to test the player with local files, bypassing the YouTube API.</p>
        
        <div className="dev-input-group">
          <label htmlFor="mp3-upload">1. Upload MP3 File</label>
          <input id="mp3-upload" type="file" accept=".mp3" onChange={onFileChange} />
          {localFileName && <p className="file-name">Loaded: {localFileName}</p>}
        </div>

        <div className="dev-input-group">
          <label htmlFor="lrc-upload">2. Paste LRC Lyrics</label>
          <textarea
            id="lrc-upload"
            rows="10"
            placeholder="[00:12.34] Lyric line 1
[00:15.67] Lyric line 2..."
            onChange={onLrcChange}
          ></textarea>
        </div>

        <button className="dev-load-button" onClick={onLoadLocal}>Load Local Song & Lyrics</button>
      </div>
    </div>
  );
};

export default DevMenu;