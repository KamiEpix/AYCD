import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { createEditor, Descendant, Transforms, Editor as SlateEditor, Element as SlateElement } from 'slate';
import { Slate, Editable, withReact, useSlate } from 'slate-react';
import { withHistory } from 'slate-history';

import type { Document } from '@aycd/core';

export interface PlateEditorProps {
  content?: Document['content'];
  onChange?: (content: string) => void;
  readOnly?: boolean;
}

// Toolbar Buttons
function MarkButton({ format, icon }: { format: string; icon: React.ReactNode }) {
  const editor = useSlate();

  const isActive = () => {
    const marks = SlateEditor.marks(editor);
    return marks ? (marks as any)[format] === true : false;
  };

  const toggleMark = (e: React.MouseEvent) => {
    e.preventDefault();
    const isCurrentlyActive = isActive();

    if (isCurrentlyActive) {
      SlateEditor.removeMark(editor, format);
    } else {
      SlateEditor.addMark(editor, format, true);
    }
  };

  return (
    <button
      className={`toolbar-button ${isActive() ? 'active' : ''}`}
      onMouseDown={toggleMark}
      title={format}
    >
      {icon}
    </button>
  );
}

function BlockButton({ format, icon }: { format: string; icon: React.ReactNode }) {
  const editor = useSlate();

  const isActive = () => {
    const { selection } = editor;
    if (!selection) return false;

    const [match] = Array.from(
      SlateEditor.nodes(editor, {
        at: SlateEditor.unhangRange(editor, selection),
        match: (n) => !SlateEditor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === format,
      })
    );

    return !!match;
  };

  const toggleBlock = (e: React.MouseEvent) => {
    e.preventDefault();
    const isCurrentlyActive = isActive();

    Transforms.setNodes(
      editor,
      { type: isCurrentlyActive ? 'p' : format } as any,
      { match: (n) => SlateElement.isElement(n) }
    );
  };

  return (
    <button
      className={`toolbar-button ${isActive() ? 'active' : ''}`}
      onMouseDown={toggleBlock}
      title={format}
    >
      {icon}
    </button>
  );
}

function Toolbar() {
  return (
    <div className="plate-toolbar">
      <div className="toolbar-group">
        <MarkButton format="bold" icon={<strong>B</strong>} />
        <MarkButton format="italic" icon={<em>I</em>} />
        <MarkButton format="underline" icon={<u>U</u>} />
        <MarkButton format="strikethrough" icon={<s>S</s>} />
        <MarkButton format="code" icon={'<>'} />
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <BlockButton format="h1" icon="H1" />
        <BlockButton format="h2" icon="H2" />
        <BlockButton format="h3" icon="H3" />
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <BlockButton format="ul" icon="•" />
        <BlockButton format="ol" icon="1." />
        <BlockButton format="blockquote" icon={'"'} />
      </div>
    </div>
  );
}

// Custom leaf renderer for marks
const Leaf = ({ attributes, children, leaf }: any) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  if (leaf.strikethrough) {
    children = <s>{children}</s>;
  }

  if (leaf.code) {
    children = <code>{children}</code>;
  }

  return <span {...attributes}>{children}</span>;
};

// Custom element renderer for blocks
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
    default:
      return <p {...attributes}>{children}</p>;
  }
};

export function PlateEditor({ content = '', onChange, readOnly = false }: PlateEditorProps) {
  // Create editor instance
  const [editor] = useState(() => withHistory(withReact(createEditor())));

  // Parse content to Slate value
  const parseContent = useCallback((text: string): Descendant[] => {
    if (!text || text.trim() === '') {
      return [{ type: 'p', children: [{ text: '' }] }] as any;
    }

    // Simple parsing - convert text to Slate nodes
    const lines = text.split('\n');
    return lines.map((line) => {
      if (line.startsWith('# ')) {
        return { type: 'h1', children: [{ text: line.slice(2) }] };
      } else if (line.startsWith('## ')) {
        return { type: 'h2', children: [{ text: line.slice(3) }] };
      } else if (line.startsWith('### ')) {
        return { type: 'h3', children: [{ text: line.slice(4) }] };
      } else if (line.startsWith('> ')) {
        return { type: 'blockquote', children: [{ text: line.slice(2) }] };
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        return { type: 'li', children: [{ text: line.slice(2) }] };
      } else {
        return { type: 'p', children: [{ text: line }] };
      }
    }) as any;
  }, []);

  const initialValue = useMemo(() => parseContent(content), [content, parseContent]);

  // Local state for editor value
  const [value, setValue] = useState<Descendant[]>(initialValue);

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
          case 'h1':
            return `# ${text}`;
          case 'h2':
            return `## ${text}`;
          case 'h3':
            return `### ${text}`;
          case 'blockquote':
            return `> ${text}`;
          case 'li':
            return `- ${text}`;
          default:
            return text;
        }
      })
      .join('\n');
  }, []);

  // Handle changes
  const handleChange = useCallback(
    (newValue: Descendant[]) => {
      setValue(newValue);
      if (!onChange || readOnly) return;
      const text = serializeToText(newValue);
      onChange(text);
    },
    [onChange, readOnly, serializeToText]
  );

  // Reset editor value when content prop changes (different document loaded)
  useEffect(() => {
    const newValue = initialValue;
    setValue(newValue);

    // Reset editor selection and history
    editor.children = newValue;
    editor.selection = null;
    editor.history = { redos: [], undos: [] };
  }, [content, initialValue, editor]);

  const renderElement = useCallback((props: any) => <Element {...props} />, []);
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, []);

  return (
    <div className="plate-editor-container">
      <Slate editor={editor} initialValue={value} onChange={handleChange}>
        <Toolbar />
        <Editable
          className="plate-editor-content"
          readOnly={readOnly}
          placeholder="Start writing..."
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          spellCheck
          autoFocus
        />
      </Slate>

      <style>{`
        .plate-editor-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          background: rgba(0, 0, 0, 0.2);
        }

        .plate-toolbar {
          display: flex;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(0, 0, 0, 0.3);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          flex-wrap: wrap;
          flex-shrink: 0;
        }

        .toolbar-group {
          display: flex;
          gap: 0.25rem;
        }

        .toolbar-divider {
          width: 1px;
          background: rgba(255, 255, 255, 0.1);
          margin: 0 0.5rem;
        }

        .toolbar-button {
          padding: 0.5rem 0.75rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 0.25rem;
          color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
          font-weight: 600;
          min-width: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .toolbar-button:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-1px);
        }

        .toolbar-button.active {
          background: rgba(102, 126, 234, 0.4);
          border-color: rgba(102, 126, 234, 0.6);
        }

        .toolbar-button:active {
          transform: translateY(0);
        }

        .plate-editor-content {
          flex: 1;
          padding: 3rem 4rem;
          overflow-y: auto;
          color: rgba(255, 255, 255, 0.95);
          font-family: 'Charter', 'Iowan Old Style', 'Georgia', 'Cambria', 'Times New Roman', serif;
          font-size: 1.125rem;
          line-height: 1.75;
          letter-spacing: 0.01em;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .plate-editor-content:focus {
          outline: none;
        }

        .plate-editor-content [data-slate-placeholder] {
          color: rgba(255, 255, 255, 0.25) !important;
          font-style: italic;
          opacity: 1 !important;
          top: 3rem !important;
          left: 4rem !important;
        }

        /* Heading styles */
        .plate-editor-content h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 2rem 0 1rem;
          line-height: 1.2;
        }

        .plate-editor-content h2 {
          font-size: 2rem;
          font-weight: 600;
          margin: 1.75rem 0 0.75rem;
          line-height: 1.3;
        }

        .plate-editor-content h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1.5rem 0 0.5rem;
          line-height: 1.4;
        }

        .plate-editor-content h4 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1.25rem 0 0.5rem;
        }

        .plate-editor-content h5,
        .plate-editor-content h6 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem;
        }

        /* Paragraph */
        .plate-editor-content p {
          margin: 0.75rem 0;
        }

        /* Blockquote */
        .plate-editor-content blockquote {
          border-left: 4px solid rgba(102, 126, 234, 0.5);
          padding-left: 1.5rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: rgba(255, 255, 255, 0.8);
        }

        /* Lists */
        .plate-editor-content ul,
        .plate-editor-content ol {
          margin: 1rem 0;
          padding-left: 2rem;
        }

        .plate-editor-content li {
          margin: 0.5rem 0;
        }

        /* Code */
        .plate-editor-content code {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-size: 0.9em;
        }

        .plate-editor-content pre {
          background: rgba(0, 0, 0, 0.3);
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }

        .plate-editor-content pre code {
          background: none;
          padding: 0;
        }

        /* Table */
        .plate-editor-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 1.5rem 0;
        }

        .plate-editor-content th,
        .plate-editor-content td {
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 0.75rem;
          text-align: left;
        }

        .plate-editor-content th {
          background: rgba(102, 126, 234, 0.2);
          font-weight: 600;
        }

        /* Links */
        .plate-editor-content a {
          color: #667eea;
          text-decoration: underline;
        }

        /* Images */
        .plate-editor-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1.5rem 0;
        }

        /* Horizontal rule */
        .plate-editor-content hr {
          border: none;
          border-top: 2px solid rgba(255, 255, 255, 0.1);
          margin: 2rem 0;
        }

        /* Text formatting */
        .plate-editor-content strong {
          font-weight: 700;
        }

        .plate-editor-content em {
          font-style: italic;
        }

        .plate-editor-content u {
          text-decoration: underline;
        }

        .plate-editor-content s {
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
}
