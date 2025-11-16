import React from 'react';
import { useDocument } from '@/lib/contexts/DocumentContext';
import type { DocumentType } from '@aycd/core';
import './ModeSwitcher.css';

const copy = {
  world: { label: 'World', helper: 'Cast · Places · Systems' },
  narrative: { label: 'Narrative', helper: 'Drafts · Beats · Edits' },
};

const iconMap: Record<DocumentType, React.ReactNode> = {
  world: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4a11 11 0 0 1 0 16" />
      <path d="M6 9.5c3 2 9 2 12 0" />
    </svg>
  ),
  narrative: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <path d="M8 9h8M8 13h5" />
    </svg>
  ),
};

export function ModeSwitcher() {
  const { mode, setMode } = useDocument();

  const handleSwitch = (type: DocumentType) => {
    setMode(type);
  };

  return (
    <div className="mode-switcher">
      {( ['world', 'narrative'] as DocumentType[]).map((type) => (
        <button
          key={type}
          className={`mode-chip ${mode === type ? 'active' : ''}`}
          onClick={() => handleSwitch(type)}
        >
          <span className="mode-icon">{iconMap[type]}</span>
          <div className="mode-text">
            <span className="mode-label">{copy[type].label}</span>
            <span className="mode-helper">{copy[type].helper}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
