import React from 'react';
import { useDocument } from '@/lib/contexts/DocumentContext';
import type { DocumentType } from '@aycd/core';
import './ModeSwitcher.css';

export function ModeSwitcher() {
  const { mode, setMode } = useDocument();

  const handleModeSwitch = (newMode: DocumentType) => {
    setMode(newMode);
  };

  return (
    <div className="mode-switcher">
      <button
        className={`mode-btn ${mode === 'world' ? 'active' : ''}`}
        onClick={() => handleModeSwitch('world')}
      >
        🗺️ World
      </button>
      <button
        className={`mode-btn ${mode === 'narrative' ? 'active' : ''}`}
        onClick={() => handleModeSwitch('narrative')}
      >
        📖 Narrative
      </button>
    </div>
  );
}
