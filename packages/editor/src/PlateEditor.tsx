import React, { useCallback, useMemo, useEffect, useState, useRef } from 'react';
import { createEditor, Descendant, Transforms, Editor as SlateEditor, Element as SlateElement, Range } from 'slate';
import { Slate, Editable, withReact, useSlate, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';

import type { Document } from '@aycd/core';

export interface PlateEditorProps {
  content?: Document['content'];
  onChange?: (content: string) => void;
  readOnly?: boolean;
}

// Slash command menu items
const SLASH_COMMANDS = [
  { key: 'h1', label: 'Heading 1', icon: 'H1', description: 'Large heading' },
  { key: 'h2', label: 'Heading 2', icon: 'H2', description: 'Medium heading' },
  { key: 'h3', label: 'Heading 3', icon: 'H3', description: 'Small heading' },
  { key: 'p', label: 'Text', icon: '¶', description: 'Plain text paragraph' },
  { key: 'ul', label: 'Bulleted List', icon: '•', description: 'Create a bulleted list' },
  { key: 'ol', label: 'Numbered List', icon: '1.', description: 'Create a numbered list' },
  { key: 'blockquote', label: 'Quote', icon: '"', description: 'Insert a quote' },
  { key: 'code', label: 'Code Block', icon: '<>', description: 'Insert code block' },
];

// Floating Toolbar Component
function FloatingToolbar() {
  const editor = useSlate();
  const toolbarRef = useRef<HTMLDivElement>(null);

  const isMarkActive = (format: string) => {
    const marks = SlateEditor.marks(editor);
    return marks ? (marks as any)[format] === true : false;
  };

  const toggleMark = (format: string) => {
    if (isMarkActive(format)) {
      SlateEditor.removeMark(editor, format);
    } else {
      SlateEditor.addMark(editor, format, true);
    }
  };

  useEffect(() => {
    const el = toolbarRef.current;
    const { selection } = editor;

    if (!el) return;

    if (!selection || !ReactEditor.isFocused(editor as ReactEditor) || Range.isCollapsed(selection)) {
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      return;
    }

    try {
      const domSelection = window.getSelection();
      if (!domSelection || domSelection.rangeCount === 0) return;

      const domRange = domSelection.getRangeAt(0);
      const rect = domRange.getBoundingClientRect();

      el.style.opacity = '1';
      el.style.pointerEvents = 'auto';
      el.style.top = `${rect.top + window.pageYOffset - el.offsetHeight - 8}px`;
      el.style.left = `${rect.left + window.pageXOffset + rect.width / 2 - el.offsetWidth / 2}px`;
    } catch (error) {
      // Selection not available yet
    }
  });

  return (
    <div ref={toolbarRef} className="floating-toolbar">
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark('bold');
        }}
        className={isMarkActive('bold') ? 'active' : ''}
      >
        <strong>B</strong>
      </button>
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark('italic');
        }}
        className={isMarkActive('italic') ? 'active' : ''}
      >
        <em>I</em>
      </button>
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark('underline');
        }}
        className={isMarkActive('underline') ? 'active' : ''}
      >
        <u>U</u>
      </button>
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark('code');
        }}
        className={isMarkActive('code') ? 'active' : ''}
      >
        {'<>'}
      </button>
    </div>
  );
}

// Slash Command Menu Component
function SlashMenu({
  target,
  onSelect,
}: {
  target: Range | null;
  onSelect: (type: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (target && ref.current) {
      const el = ref.current;
      try {
        const domRange = ReactEditor.toDOMRange(useSlate() as any, target);
        const rect = domRange.getBoundingClientRect();
        el.style.top = `${rect.bottom + window.pageYOffset + 4}px`;
        el.style.left = `${rect.left + window.pageXOffset}px`;
      } catch (error) {
        // Range not yet available
      }
    }
  }, [target]);

  if (!target) return null;

  return (
    <div ref={ref} className="slash-menu">
      {SLASH_COMMANDS.map((cmd, index) => (
        <div
          key={cmd.key}
          className={`slash-menu-item ${selectedIndex === index ? 'selected' : ''}`}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(cmd.key);
          }}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <span className="slash-menu-icon">{cmd.icon}</span>
          <div className="slash-menu-text">
            <div className="slash-menu-label">{cmd.label}</div>
            <div className="slash-menu-description">{cmd.description}</div>
          </div>
        </div>
      ))}
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
  if (leaf.code) children = <code>{children}</code>;

  return <span {...attributes}>{children}</span>;
};

export function PlateEditor({ content = '', onChange, readOnly = false }: PlateEditorProps) {
  const [editor] = useState(() => withHistory(withReact(createEditor())));
  const [slashMenuTarget, setSlashMenuTarget] = useState<Range | null>(null);
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

  // Handle keyboard shortcuts and slash commands
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const { selection } = editor;

      // Slash command detection
      if (event.key === '/' && selection && Range.isCollapsed(selection)) {
        setSlashMenuTarget(selection);
        return;
      }

      // Close slash menu on Escape
      if (event.key === 'Escape' && slashMenuTarget) {
        setSlashMenuTarget(null);
        return;
      }

      // Keyboard shortcuts
      if (event.metaKey || event.ctrlKey) {
        switch (event.key) {
          case 'b':
            event.preventDefault();
            SlateEditor.addMark(editor, 'bold', true);
            return;
          case 'i':
            event.preventDefault();
            SlateEditor.addMark(editor, 'italic', true);
            return;
          case 'u':
            event.preventDefault();
            SlateEditor.addMark(editor, 'underline', true);
            return;
          case '`':
            event.preventDefault();
            SlateEditor.addMark(editor, 'code', true);
            return;
        }
      }

      // Markdown shortcuts (autoformatting)
      if (event.key === ' ' && selection && Range.isCollapsed(selection)) {
        const { anchor } = selection;
        const block = SlateEditor.above(editor, {
          match: (n) => SlateElement.isElement(n) && (editor as any).isBlock(n),
        });

        if (block) {
          const [, path] = block;
          const start = SlateEditor.start(editor, path);
          const range = { anchor, focus: start };
          const beforeText = SlateEditor.string(editor, range);

          // Check for markdown patterns
          const patterns: { [key: string]: string } = {
            '#': 'h1',
            '##': 'h2',
            '###': 'h3',
            '>': 'blockquote',
            '-': 'li',
            '*': 'li',
            '```': 'code',
          };

          for (const [pattern, type] of Object.entries(patterns)) {
            if (beforeText === pattern) {
              event.preventDefault();
              Transforms.delete(editor, { at: range });
              Transforms.setNodes(editor, { type } as any, { match: (n) => SlateElement.isElement(n) });
              return;
            }
          }
        }
      }
    },
    [editor, slashMenuTarget]
  );

  const handleSlashSelect = useCallback(
    (type: string) => {
      if (slashMenuTarget) {
        Transforms.select(editor, slashMenuTarget);
        Transforms.delete(editor); // Remove the "/"
        Transforms.setNodes(editor, { type } as any, {
          match: (n) => SlateElement.isElement(n),
        });
        setSlashMenuTarget(null);
      }
    },
    [editor, slashMenuTarget]
  );

  return (
    <div className="notion-editor-container">
      <Slate editor={editor} initialValue={initialValue} onChange={handleChange}>
        <FloatingToolbar />
        <SlashMenu target={slashMenuTarget} onSelect={handleSlashSelect} />
        <Editable
          className="notion-editor-content"
          readOnly={readOnly}
          placeholder="Type '/' for commands, or start writing..."
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={handleKeyDown}
          spellCheck
          autoFocus
        />
      </Slate>

      <style>{`
        .notion-editor-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          background: #ffffff;
          position: relative;
        }

        .notion-editor-content {
          flex: 1;
          padding: 6rem 10rem;
          max-width: 900px;
          width: 100%;
          margin: 0 auto;
          overflow-y: auto;
          color: rgb(55, 53, 47);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, 'Apple Color Emoji', Arial, sans-serif, 'Segoe UI Emoji', 'Segoe UI Symbol';
          font-size: 16px;
          line-height: 1.5;
          caret-color: rgb(55, 53, 47);
        }

        .notion-editor-content:focus {
          outline: none;
        }

        .notion-editor-content [data-slate-placeholder] {
          color: rgba(55, 53, 47, 0.4) !important;
          font-style: normal;
          opacity: 1 !important;
          top: 6rem !important;
          left: 10rem !important;
          user-select: none;
          pointer-events: none;
        }

        /* Floating Toolbar */
        .floating-toolbar {
          position: absolute;
          z-index: 100;
          padding: 0.25rem;
          background: rgb(55, 53, 47);
          border-radius: 6px;
          box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px;
          display: flex;
          gap: 2px;
          transition: opacity 0.15s;
          opacity: 0;
          pointer-events: none;
        }

        .floating-toolbar button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: transparent;
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.15s;
        }

        .floating-toolbar button:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .floating-toolbar button.active {
          background: rgba(35, 131, 226, 0.28);
        }

        /* Slash Command Menu */
        .slash-menu {
          position: absolute;
          z-index: 100;
          background: white;
          border-radius: 6px;
          box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px;
          padding: 0.5rem;
          min-width: 280px;
          max-height: 400px;
          overflow-y: auto;
        }

        .slash-menu-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .slash-menu-item:hover,
        .slash-menu-item.selected {
          background: rgba(55, 53, 47, 0.08);
        }

        .slash-menu-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          background: rgba(55, 53, 47, 0.06);
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        .slash-menu-text {
          flex: 1;
          min-width: 0;
        }

        .slash-menu-label {
          font-size: 14px;
          font-weight: 500;
          color: rgb(55, 53, 47);
        }

        .slash-menu-description {
          font-size: 12px;
          color: rgba(55, 53, 47, 0.6);
          margin-top: 2px;
        }

        /* Typography */
        .notion-editor-content h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 2rem 0 1rem;
          line-height: 1.2;
          color: rgb(55, 53, 47);
        }

        .notion-editor-content h2 {
          font-size: 1.875rem;
          font-weight: 600;
          margin: 1.75rem 0 0.75rem;
          line-height: 1.3;
          color: rgb(55, 53, 47);
        }

        .notion-editor-content h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1.5rem 0 0.5rem;
          line-height: 1.4;
          color: rgb(55, 53, 47);
        }

        .notion-editor-content p {
          margin: 4px 0;
          color: rgb(55, 53, 47);
          line-height: 1.6;
        }

        .notion-editor-content blockquote {
          border-left: 3px solid rgb(55, 53, 47);
          padding-left: 1rem;
          margin: 4px 0;
          color: rgb(55, 53, 47);
          font-size: 1rem;
        }

        .notion-editor-content ul,
        .notion-editor-content ol {
          margin: 4px 0;
          padding-left: 1.75rem;
        }

        .notion-editor-content li {
          margin: 2px 0;
          padding-left: 0.25rem;
        }

        .notion-editor-content code {
          background: rgba(135, 131, 120, 0.15);
          color: #eb5757;
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
          font-size: 85%;
        }

        .notion-editor-content pre {
          background: rgb(247, 246, 243);
          border-radius: 3px;
          padding: 1rem;
          margin: 8px 0;
          overflow-x: auto;
        }

        .notion-editor-content pre code {
          background: none;
          color: rgb(55, 53, 47);
          padding: 0;
          font-size: 14px;
          line-height: 1.5;
        }

        .notion-editor-content strong {
          font-weight: 600;
        }

        .notion-editor-content em {
          font-style: italic;
        }

        .notion-editor-content u {
          text-decoration: underline;
        }

        .notion-editor-content s {
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
}
