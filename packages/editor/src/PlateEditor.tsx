/**
 * Basic Slate.js editor setup
 *
 * Plate.js packages are installed and available:
 * - @platejs/core
 * - @platejs/basic-nodes
 *
 * This is a minimal working editor that can be enhanced with Plate.js features.
 */

import { useCallback, useMemo, useEffect, useState, useRef } from 'react';
import { createEditor, Descendant } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';

import type { Document } from '@aycd/core';

export interface PlateEditorProps {
  content?: Document['content'];
  onChange?: (content: string) => void;
  readOnly?: boolean;
}

const Element = ({ attributes, children }: any) => {
  return <p {...attributes}>{children}</p>;
};

const Leaf = ({ attributes, children }: any) => {
  return <span {...attributes}>{children}</span>;
};

export function PlateEditor({ content = '', onChange, readOnly = false }: PlateEditorProps) {
  const [editor] = useState(() => withHistory(withReact(createEditor())));
  const lastLoadedContentRef = useRef(content);

  const parseContent = useCallback((text: string): Descendant[] => {
    if (!text || text.trim() === '') {
      return [{ type: 'p', children: [{ text: '' }] }] as any;
    }
    const lines = text.split('\n');
    return lines.map((line) => ({ type: 'p', children: [{ text: line }] })) as any;
  }, []);

  const initialValue = useMemo(() => parseContent(content), [content, parseContent]);

  const serializeToText = useCallback((nodes: Descendant[]) => {
    return nodes.map((n: any) => n.children?.map((c: any) => c.text).join('')).join('\n');
  }, []);

  const handleChange = useCallback(
    (newValue: Descendant[]) => {
      if (!onChange || readOnly) return;
      const text = serializeToText(newValue);
      onChange(text);
    },
    [onChange, readOnly, serializeToText]
  );

  useEffect(() => {
    if (content !== lastLoadedContentRef.current) {
      const newValue = initialValue;
      editor.children = newValue;
      editor.selection = null;
      editor.history = { redos: [], undos: [] };
      editor.onChange();
      lastLoadedContentRef.current = content;
    }
  }, [content, initialValue, editor]);

  const renderElement = useCallback((props: any) => <Element {...props} />, []);
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, []);

  return (
    <div style={{ width: '100%', height: '100%', background: '#fff' }}>
      <Slate editor={editor} initialValue={initialValue} onChange={handleChange}>
        <Editable
          readOnly={readOnly}
          placeholder="Type something..."
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          spellCheck
          autoFocus
          style={{
            padding: '20px',
            minHeight: '100%',
            outline: 'none',
          }}
        />
      </Slate>
    </div>
  );
}
