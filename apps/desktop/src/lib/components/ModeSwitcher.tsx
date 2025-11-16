import React from 'react';
import { useDocument } from '@/lib/contexts/DocumentContext';
import type { DocumentType } from '@aycd/core';
import './ModeSwitcher.css';

const copy = {
  world: { label: 'World', subtitle: 'Cast · Places · Lore', icon: '🗺️' },
  narrative: { label: 'Narrative', subtitle: 'Drafts · Chapters', icon: '📖' },
};

export function ModeSwitcher() {
  const { mode, setMode } = useDocument();

  const handleModeSwitch = (newMode: DocumentType) => {
    setMode(newMode);
  };

  return (
    <div className="mode-switcher">
      {(['world', 'narrative'] as DocumentType[]).map((type) => (
        <button
          key={type}
          className={`mode-btn ${mode === type ? 'active' : ''}`}
          onClick={() => handleModeSwitch(type)}
        >
          <span className="mode-icon">{copy[type].icon}</span>
          <div className="mode-copy">
            <span className="mode-label">{copy[type].label}</span>
            <span className="mode-subtitle">{copy[type].subtitle}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
