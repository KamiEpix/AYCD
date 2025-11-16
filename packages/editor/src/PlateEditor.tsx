import { useCallback, useMemo } from 'react';
import { Plate, PlateContent, usePlateEditor } from 'platejs/react';
import {
  BasicBlocksPlugin,
  BasicMarksPlugin,
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  CodePlugin,
  HeadingPlugin,
  BlockquotePlugin,
} from '@platejs/basic-nodes/react';
import { ListPlugin } from '@platejs/list/react';
import { TablePlugin } from '@platejs/table/react';
import { ImagePlugin, MediaEmbedPlugin } from '@platejs/media/react';
import { LinkPlugin } from '@platejs/link/react';

import type { Document } from '@aycd/core';

export interface PlateEditorProps {
  content?: Document['content'];
  onChange?: (content: string) => void;
  readOnly?: boolean;
}

// Editor plugins configuration
const plugins = [
  // Basic marks
  BasicMarksPlugin,
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  CodePlugin,

  // Block elements
  BasicBlocksPlugin,
  HeadingPlugin,
  BlockquotePlugin,

  // Lists
  ListPlugin,

  // Table
  TablePlugin,

  // Media
  ImagePlugin,
  MediaEmbedPlugin,
  LinkPlugin,
];

// Toolbar component
function Toolbar({ editor }: { editor: any }) {
  const toggleMark = (mark: string) => {
    if (!editor) return;
    try {
      const plugin = editor.getPlugin({ key: mark });
      if (plugin?.api?.[mark]?.toggle) {
        plugin.api[mark].toggle();
      }
    } catch (e) {
      console.warn(`Failed to toggle mark: ${mark}`, e);
    }
  };

  const toggleBlock = (blockType: string) => {
    if (!editor) return;
    try {
      const plugin = editor.getPlugin({ key: blockType });
      if (plugin?.api?.[blockType]?.toggle) {
        plugin.api[blockType].toggle();
      }
    } catch (e) {
      console.warn(`Failed to toggle block: ${blockType}`, e);
    }
  };

  return (
    <div className="plate-toolbar">
      <div className="toolbar-group">
        <button
          className="toolbar-button"
          onMouseDown={(e) => {
            e.preventDefault();
            toggleMark('bold');
          }}
          title="Bold (Cmd+B)"
        >
          <strong>B</strong>
        </button>
        <button
          className="toolbar-button"
          onMouseDown={(e) => {
            e.preventDefault();
            toggleMark('italic');
          }}
          title="Italic (Cmd+I)"
        >
          <em>I</em>
        </button>
        <button
          className="toolbar-button"
          onMouseDown={(e) => {
            e.preventDefault();
            toggleMark('underline');
          }}
          title="Underline (Cmd+U)"
        >
          <u>U</u>
        </button>
        <button
          className="toolbar-button"
          onMouseDown={(e) => {
            e.preventDefault();
            toggleMark('strikethrough');
          }}
          title="Strikethrough"
        >
          <s>S</s>
        </button>
        <button
          className="toolbar-button"
          onMouseDown={(e) => {
            e.preventDefault();
            toggleMark('code');
          }}
          title="Code"
        >
          {'<>'}
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        {[1, 2, 3].map((level) => (
          <button
            key={level}
            className="toolbar-button"
            onMouseDown={(e) => {
              e.preventDefault();
              toggleBlock(`h${level}`);
            }}
            title={`Heading ${level}`}
          >
            H{level}
          </button>
        ))}
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className="toolbar-button"
          onMouseDown={(e) => {
            e.preventDefault();
            toggleBlock('ul');
          }}
          title="Bulleted List"
        >
          •
        </button>
        <button
          className="toolbar-button"
          onMouseDown={(e) => {
            e.preventDefault();
            toggleBlock('ol');
          }}
          title="Numbered List"
        >
          1.
        </button>
        <button
          className="toolbar-button"
          onMouseDown={(e) => {
            e.preventDefault();
            toggleBlock('blockquote');
          }}
          title="Quote"
        >
          "
        </button>
      </div>
    </div>
  );
}

export function PlateEditor({ content = '', onChange, readOnly = false }: PlateEditorProps) {
  // Parse initial content
  const initialValue = useMemo(() => {
    if (!content || content.trim() === '') {
      return [
        {
          type: 'p',
          children: [{ text: '' }],
        },
      ];
    }

    // Simple markdown-like parsing
    const lines = content.split('\n');
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
    });
  }, [content]);

  const editor = usePlateEditor({
    plugins,
    value: initialValue,
  });

  // Handle content changes
  const handleChange = useCallback(
    ({ value }: { value: any }) => {
      if (!onChange || readOnly) return;

      // Convert Slate value back to markdown-ish text
      const text = value
        .map((node: any) => {
          const nodeText = node.children?.map((child: any) => child.text || '').join('') || '';

          switch (node.type) {
            case 'h1':
              return `# ${nodeText}`;
            case 'h2':
              return `## ${nodeText}`;
            case 'h3':
              return `### ${nodeText}`;
            case 'h4':
              return `#### ${nodeText}`;
            case 'h5':
              return `##### ${nodeText}`;
            case 'h6':
              return `###### ${nodeText}`;
            case 'blockquote':
              return `> ${nodeText}`;
            case 'li':
              return `- ${nodeText}`;
            case 'code_block':
              return `\`\`\`\n${nodeText}\n\`\`\``;
            default:
              return nodeText;
          }
        })
        .join('\n');

      onChange(text);
    },
    [onChange, readOnly]
  );

  return (
    <div className="plate-editor-container">
      <Plate editor={editor} onChange={handleChange}>
        <Toolbar editor={editor} />
        <PlateContent
          className="plate-editor-content"
          readOnly={readOnly}
          placeholder="Start writing..."
        />
      </Plate>

      <style>{`
        .plate-editor-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: rgba(0, 0, 0, 0.2);
        }

        .plate-toolbar {
          display: flex;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(0, 0, 0, 0.3);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          flex-wrap: wrap;
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
      `}</style>
    </div>
  );
}
