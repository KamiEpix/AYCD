import React, { useCallback, useMemo, useEffect, useState, useRef } from 'react';
import { createEditor, Descendant, Transforms, Editor as SlateEditor, Element as SlateElement } from 'slate';
import { Slate, Editable, withReact, useSlate } from 'slate-react';
import { withHistory } from 'slate-history';

import type { Document } from '@aycd/core';

export interface PlateEditorProps {
  content?: Document['content'];
  onChange?: (content: string) => void;
  readOnly?: boolean;
}

// Toolbar Button Component
const ToolbarButton = ({
  active,
  onMouseDown,
  children,
  title
}: {
  active?: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  title?: string;
}) => (
  <button
    className={`toolbar-button ${active ? 'active' : ''}`}
    onMouseDown={onMouseDown}
    title={title}
  >
    {children}
  </button>
);

// Fixed Toolbar Component
function Toolbar() {
  const editor = useSlate();

  const isMarkActive = (format: string) => {
    const marks = SlateEditor.marks(editor);
    return marks ? (marks as any)[format] === true : false;
  };

  const toggleMark = (e: React.MouseEvent, format: string) => {
    e.preventDefault();
    if (isMarkActive(format)) {
      SlateEditor.removeMark(editor, format);
    } else {
      SlateEditor.addMark(editor, format, true);
    }
  };

  const isBlockActive = (format: string) => {
    const { selection } = editor;
    if (!selection) return false;

    const [match] = Array.from(
      SlateEditor.nodes(editor, {
        at: SlateEditor.unhangRange(editor, selection),
        match: n => !SlateEditor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === format,
      })
    );

    return !!match;
  };

  const toggleBlock = (e: React.MouseEvent, format: string) => {
    e.preventDefault();
    const isActive = isBlockActive(format);

    Transforms.setNodes(
      editor,
      { type: isActive ? 'p' : format } as any,
      { match: n => SlateElement.isElement(n) && SlateEditor.isBlock(editor, n) }
    );
  };

  return (
    <div className="plate-toolbar">
      <div className="toolbar-group">
        <ToolbarButton
          onMouseDown={(e) => {
            e.preventDefault();
            editor.undo();
          }}
          title="Undo (⌘Z)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          onMouseDown={(e) => {
            e.preventDefault();
            editor.redo();
          }}
          title="Redo (⌘⇧Z)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7" />
          </svg>
        </ToolbarButton>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <ToolbarButton
          active={isBlockActive('h1')}
          onMouseDown={(e) => toggleBlock(e, 'h1')}
          title="Heading 1"
        >
          <strong>H1</strong>
        </ToolbarButton>
        <ToolbarButton
          active={isBlockActive('h2')}
          onMouseDown={(e) => toggleBlock(e, 'h2')}
          title="Heading 2"
        >
          <strong>H2</strong>
        </ToolbarButton>
        <ToolbarButton
          active={isBlockActive('h3')}
          onMouseDown={(e) => toggleBlock(e, 'h3')}
          title="Heading 3"
        >
          <strong>H3</strong>
        </ToolbarButton>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <ToolbarButton
          active={isMarkActive('bold')}
          onMouseDown={(e) => toggleMark(e, 'bold')}
          title="Bold (⌘B)"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          active={isMarkActive('italic')}
          onMouseDown={(e) => toggleMark(e, 'italic')}
          title="Italic (⌘I)"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          active={isMarkActive('underline')}
          onMouseDown={(e) => toggleMark(e, 'underline')}
          title="Underline (⌘U)"
        >
          <u>U</u>
        </ToolbarButton>
        <ToolbarButton
          active={isMarkActive('strikethrough')}
          onMouseDown={(e) => toggleMark(e, 'strikethrough')}
          title="Strikethrough (⌘⇧X)"
        >
          <s>S</s>
        </ToolbarButton>
        <ToolbarButton
          active={isMarkActive('code')}
          onMouseDown={(e) => toggleMark(e, 'code')}
          title="Code (⌘`)"
        >
          {'</>'}
        </ToolbarButton>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <ToolbarButton
          active={isBlockActive('ul')}
          onMouseDown={(e) => toggleBlock(e, 'ul')}
          title="Bulleted List"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <circle cx="4" cy="6" r="1" fill="currentColor" />
            <circle cx="4" cy="12" r="1" fill="currentColor" />
            <circle cx="4" cy="18" r="1" fill="currentColor" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          active={isBlockActive('ol')}
          onMouseDown={(e) => toggleBlock(e, 'ol')}
          title="Numbered List"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <text x="3" y="8" fontSize="8" fill="currentColor">1</text>
            <text x="3" y="14" fontSize="8" fill="currentColor">2</text>
            <text x="3" y="20" fontSize="8" fill="currentColor">3</text>
          </svg>
        </ToolbarButton>
        <ToolbarButton
          active={isBlockActive('blockquote')}
          onMouseDown={(e) => toggleBlock(e, 'blockquote')}
          title="Quote"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          active={isBlockActive('code')}
          onMouseDown={(e) => toggleBlock(e, 'code')}
          title="Code Block"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </ToolbarButton>
      </div>
    </div>
  );
}

// Block Element Component
const Element = ({ attributes, children, element }: any) => {
  switch (element.type) {
    case 'h1':
      return <h1 {...attributes}>{children}</h1>;
    case 'h2':
      return <h2 {...attributes}>{children}</h2>;
    case 'h3':
      return <h3 {...attributes}>{children}</h3>;
    case 'blockquote':
      return <blockquote {...attributes}>{children}</blockquote>;
    case 'ul':
      return <ul {...attributes}>{children}</ul>;
    case 'ol':
      return <ol {...attributes}>{children}</ol>;
    case 'li':
      return <li {...attributes}>{children}</li>;
    case 'code':
      return (
        <pre {...attributes}>
          <code>{children}</code>
        </pre>
      );
    default:
      return <p {...attributes}>{children}</p>;
  }
};

// Leaf Component for text formatting
const Leaf = ({ attributes, children, leaf }: any) => {
  if (leaf.bold) children = <strong>{children}</strong>;
  if (leaf.italic) children = <em>{children}</em>;
  if (leaf.underline) children = <u>{children}</u>;
  if (leaf.strikethrough) children = <s>{children}</s>;
  if (leaf.code) children = <code className="inline-code">{children}</code>;

  return <span {...attributes}>{children}</span>;
};

export function PlateEditor({ content = '', onChange, readOnly = false }: PlateEditorProps) {
  const [editor] = useState(() => withHistory(withReact(createEditor())));
  const lastLoadedContentRef = useRef(content);

  // Parse content to Slate value
  const parseContent = useCallback((text: string): Descendant[] => {
    if (!text || text.trim() === '') {
      return [{ type: 'p', children: [{ text: '' }] }] as any;
    }

    const lines = text.split('\n');
    return lines.map((line) => {
      if (line.startsWith('# ')) return { type: 'h1', children: [{ text: line.slice(2) }] };
      if (line.startsWith('## ')) return { type: 'h2', children: [{ text: line.slice(3) }] };
      if (line.startsWith('### ')) return { type: 'h3', children: [{ text: line.slice(4) }] };
      if (line.startsWith('> ')) return { type: 'blockquote', children: [{ text: line.slice(2) }] };
      if (line.startsWith('```')) return { type: 'code', children: [{ text: line.slice(3) }] };
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return { type: 'li', children: [{ text: line.slice(2) }] };
      }
      return { type: 'p', children: [{ text: line }] };
    }) as any;
  }, []);

  const initialValue = useMemo(() => parseContent(content), [content, parseContent]);

  // Serialize Slate value back to text
  const serializeToText = useCallback((nodes: Descendant[]) => {
    return nodes
      .map((node: any) => {
        const text = node.children
          ?.map((child: any) => {
            if ('text' in child) return child.text;
            if ('children' in child) return serializeToText([child]);
            return '';
          })
          .join('');

        switch (node.type) {
          case 'h1': return `# ${text}`;
          case 'h2': return `## ${text}`;
          case 'h3': return `### ${text}`;
          case 'blockquote': return `> ${text}`;
          case 'code': return `\`\`\`${text}`;
          case 'li': return `- ${text}`;
          default: return text;
        }
      })
      .join('\n');
  }, []);

  const handleChange = useCallback(
    (newValue: Descendant[]) => {
      if (!onChange || readOnly) return;
      const text = serializeToText(newValue);
      onChange(text);
    },
    [onChange, readOnly, serializeToText]
  );

  // Reset editor when document changes
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

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        switch (event.key) {
          case 'b':
            event.preventDefault();
            if (SlateEditor.marks(editor)?.bold) {
              SlateEditor.removeMark(editor, 'bold');
            } else {
              SlateEditor.addMark(editor, 'bold', true);
            }
            return;
          case 'i':
            event.preventDefault();
            if (SlateEditor.marks(editor)?.italic) {
              SlateEditor.removeMark(editor, 'italic');
            } else {
              SlateEditor.addMark(editor, 'italic', true);
            }
            return;
          case 'u':
            event.preventDefault();
            if (SlateEditor.marks(editor)?.underline) {
              SlateEditor.removeMark(editor, 'underline');
            } else {
              SlateEditor.addMark(editor, 'underline', true);
            }
            return;
          case '`':
            event.preventDefault();
            if (SlateEditor.marks(editor)?.code) {
              SlateEditor.removeMark(editor, 'code');
            } else {
              SlateEditor.addMark(editor, 'code', true);
            }
            return;
        }
      }
    },
    [editor]
  );

  return (
    <div className="plate-editor-container">
      <Slate editor={editor} initialValue={initialValue} onChange={handleChange}>
        <Toolbar />
        <div className="plate-editor-scroll">
          <Editable
            className="plate-editor-content"
            readOnly={readOnly}
            placeholder="Start typing..."
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            onKeyDown={handleKeyDown}
            spellCheck
            autoFocus
          />
        </div>
      </Slate>

      <style>{`
        .plate-editor-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          background: #ffffff;
          position: relative;
        }

        /* Fixed Toolbar */
        .plate-toolbar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          flex-shrink: 0;
        }

        .toolbar-group {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .toolbar-separator {
          width: 1px;
          height: 24px;
          background: #e5e7eb;
        }

        .toolbar-button {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
          height: 32px;
          padding: 0 8px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 6px;
          color: #374151;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.15s;
        }

        .toolbar-button:hover {
          background: #f3f4f6;
          border-color: #e5e7eb;
        }

        .toolbar-button.active {
          background: #e0e7ff;
          border-color: #c7d2fe;
          color: #4f46e5;
        }

        .toolbar-button svg {
          display: block;
        }

        /* Editor Content Area */
        .plate-editor-scroll {
          flex: 1;
          overflow-y: auto;
          background: #ffffff;
        }

        .plate-editor-content {
          padding: 64px 96px;
          max-width: 900px;
          margin: 0 auto;
          color: #1f2937;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, 'Apple Color Emoji', Arial, sans-serif, 'Segoe UI Emoji', 'Segoe UI Symbol';
          font-size: 16px;
          line-height: 1.6;
          caret-color: #1f2937;
          outline: none;
        }

        .plate-editor-content [data-slate-placeholder] {
          color: #9ca3af !important;
          font-style: normal;
          opacity: 1 !important;
          user-select: none;
          pointer-events: none;
        }

        /* Typography */
        .plate-editor-content h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 2rem 0 1rem;
          line-height: 1.2;
          color: #111827;
        }

        .plate-editor-content h2 {
          font-size: 1.875rem;
          font-weight: 600;
          margin: 1.75rem 0 0.75rem;
          line-height: 1.3;
          color: #111827;
        }

        .plate-editor-content h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1.5rem 0 0.5rem;
          line-height: 1.4;
          color: #111827;
        }

        .plate-editor-content p {
          margin: 0.5rem 0;
          color: #1f2937;
          line-height: 1.7;
        }

        .plate-editor-content blockquote {
          border-left: 3px solid #d1d5db;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #6b7280;
          font-style: italic;
        }

        .plate-editor-content ul,
        .plate-editor-content ol {
          margin: 1rem 0;
          padding-left: 2rem;
        }

        .plate-editor-content li {
          margin: 0.25rem 0;
          padding-left: 0.5rem;
        }

        .plate-editor-content .inline-code {
          background: #f3f4f6;
          color: #dc2626;
          padding: 0.2em 0.4em;
          border-radius: 4px;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Consolas', monospace;
          font-size: 0.9em;
        }

        .plate-editor-content pre {
          background: #1f2937;
          border-radius: 6px;
          padding: 1rem;
          margin: 1rem 0;
          overflow-x: auto;
        }

        .plate-editor-content pre code {
          background: none;
          color: #e5e7eb;
          padding: 0;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Consolas', monospace;
          font-size: 14px;
          line-height: 1.6;
        }

        .plate-editor-content strong {
          font-weight: 600;
          color: #111827;
        }

        .plate-editor-content em {
          font-style: italic;
        }

        .plate-editor-content u {
          text-decoration: underline;
        }

        .plate-editor-content s {
          text-decoration: line-through;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}
