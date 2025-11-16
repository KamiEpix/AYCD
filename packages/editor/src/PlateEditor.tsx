import { useCallback, useMemo, useEffect, useState, useRef } from 'react';
import { createEditor, Descendant, Editor as SlateEditor, Transforms } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';

import type { Document } from '@aycd/core';

export interface PlateEditorProps {
  content?: Document['content'];
  onChange?: (content: string) => void;
  readOnly?: boolean;
}

const Element = ({ attributes, children, element }: any) => {
  switch (element.type) {
    case 'heading-one':
      return <h1 {...attributes}>{children}</h1>;
    case 'heading-two':
      return <h2 {...attributes}>{children}</h2>;
    case 'quote':
      return <blockquote {...attributes}>{children}</blockquote>;
    case 'code':
      return <pre {...attributes}><code>{children}</code></pre>;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

const Leaf = ({ attributes, children, leaf }: any) => {
  if (leaf.bold) children = <strong>{children}</strong>;
  if (leaf.italic) children = <em>{children}</em>;
  if (leaf.underline) children = <u>{children}</u>;
  return <span {...attributes}>{children}</span>;
};

export function PlateEditor({ content = '', onChange, readOnly = false }: PlateEditorProps) {
  const [editor] = useState(() => withHistory(withReact(createEditor())));
  const lastLoadedContentRef = useRef(content);

  const parseContent = useCallback((text: string): Descendant[] => {
    if (!text || text.trim() === '') {
      return [{ type: 'paragraph', children: [{ text: '' }] }] as any;
    }
    const lines = text.split('\n');
    return lines.map((line) => ({ type: 'paragraph', children: [{ text: line }] })) as any;
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

  const toggleMark = (format: string) => {
    const isActive = isMarkActive(format);
    if (isActive) {
      SlateEditor.removeMark(editor, format);
    } else {
      SlateEditor.addMark(editor, format, true);
    }
  };

  const isMarkActive = (format: string) => {
    const marks = SlateEditor.marks(editor);
    return marks ? (marks as any)[format] === true : false;
  };

  const toggleBlock = (format: string) => {
    const isActive = isBlockActive(format);
    Transforms.setNodes(
      editor,
      { type: isActive ? 'paragraph' : format } as any,
      { match: n => SlateEditor.isBlock(editor, n as any) }
    );
  };

  const isBlockActive = (format: string) => {
    const [match] = SlateEditor.nodes(editor, {
      match: (n: any) => n.type === format,
    });
    return !!match;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!e.metaKey && !e.ctrlKey) return;

    switch (e.key) {
      case 'b': {
        e.preventDefault();
        toggleMark('bold');
        break;
      }
      case 'i': {
        e.preventDefault();
        toggleMark('italic');
        break;
      }
      case 'u': {
        e.preventDefault();
        toggleMark('underline');
        break;
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      <Slate editor={editor} initialValue={initialValue} onChange={handleChange}>
        {!readOnly && (
          <div style={{
            display: 'flex',
            gap: '8px',
            padding: '12px',
            borderBottom: '1px solid #ddd',
            background: '#f8f9fa'
          }}>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                editor.undo();
              }}
              style={{
                padding: '6px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              Undo
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                editor.redo();
              }}
              style={{
                padding: '6px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              Redo
            </button>
            <div style={{ width: '1px', background: '#ddd', margin: '0 4px' }} />
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                toggleMark('bold');
              }}
              style={{
                padding: '6px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: isMarkActive('bold') ? '#e3f2fd' : '#fff',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              B
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                toggleMark('italic');
              }}
              style={{
                padding: '6px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: isMarkActive('italic') ? '#e3f2fd' : '#fff',
                cursor: 'pointer',
                fontStyle: 'italic'
              }}
            >
              I
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                toggleMark('underline');
              }}
              style={{
                padding: '6px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: isMarkActive('underline') ? '#e3f2fd' : '#fff',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              U
            </button>
            <div style={{ width: '1px', background: '#ddd', margin: '0 4px' }} />
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                toggleBlock('heading-one');
              }}
              style={{
                padding: '6px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: isBlockActive('heading-one') ? '#e3f2fd' : '#fff',
                cursor: 'pointer'
              }}
            >
              H1
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                toggleBlock('heading-two');
              }}
              style={{
                padding: '6px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: isBlockActive('heading-two') ? '#e3f2fd' : '#fff',
                cursor: 'pointer'
              }}
            >
              H2
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                toggleBlock('quote');
              }}
              style={{
                padding: '6px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: isBlockActive('quote') ? '#e3f2fd' : '#fff',
                cursor: 'pointer'
              }}
            >
              Quote
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                toggleBlock('code');
              }}
              style={{
                padding: '6px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: isBlockActive('code') ? '#e3f2fd' : '#fff',
                cursor: 'pointer'
              }}
            >
              Code
            </button>
          </div>
        )}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Editable
            readOnly={readOnly}
            placeholder="Start typing..."
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            onKeyDown={handleKeyDown}
            spellCheck
            autoFocus
            style={{
              padding: '20px',
              minHeight: '100%',
              outline: 'none',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '16px',
              lineHeight: '1.6'
            }}
          />
        </div>
      </Slate>
    </div>
  );
}
