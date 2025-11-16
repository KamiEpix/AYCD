/**
 * PlateEditor - React wrapper for Plate.js editor
 *
 * This is a stub implementation. The full Plate.js integration
 * will be implemented in a future iteration.
 */

import type { Document } from '@aycd/core';

export interface PlateEditorProps {
  content?: Document['content'];
  onChange?: (content: string) => void;
  readOnly?: boolean;
}

export function PlateEditor(props: PlateEditorProps) {
  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc' }}>
      <h3>Plate Editor (Stub)</h3>
      <p>Full Plate.js implementation coming soon...</p>
      {props.content && (
        <pre style={{ background: '#f5f5f5', padding: '1rem', marginTop: '1rem' }}>
          {props.content}
        </pre>
      )}
    </div>
  );
}
