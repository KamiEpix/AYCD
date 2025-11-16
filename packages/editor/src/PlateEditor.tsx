import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import type { Descendant } from 'slate';
import { Node, Editor, Element as SlateElement, Transforms } from 'slate';
import type { Document } from '@aycd/core';
import {
  Plate,
  PlateContent,
  PlateEditor as PlateEditorInstance,
  createPlateEditor,
  ParagraphPlugin,
  usePlateEditor,
} from '@platejs/core/react';
import {
  BasicBlocksPlugin,
  BasicMarksPlugin,
  HighlightPlugin,
  KbdPlugin,
} from '@platejs/basic-nodes/react';
import './PlateEditor.css';

export interface PlateEditorProps {
  content?: Document['content'];
  onChange?: (serializedValue: string, plainText: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}

const EMPTY_VALUE: Descendant[] = [
  {
    type: 'p',
    children: [{ text: '' }],
  } as Descendant,
];

const blockOptions = [
  { label: 'Paragraph', value: 'p' },
  { label: 'Heading 1', value: 'h1' },
  { label: 'Heading 2', value: 'h2' },
  { label: 'Heading 3', value: 'h3' },
  { label: 'Quote', value: 'blockquote' },
];
const defaultBlock = blockOptions[0]!;

const formatNodesToPlainText = (value: Descendant[]): string =>
  value.map((node) => Node.string(node as any)).join('\n').trim();

const parseContentToValue = (content?: string): Descendant[] => {
  if (!content) return EMPTY_VALUE;

  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed as Descendant[];
    }
  } catch {
    // Ignore JSON parse errors and fall through.
  }

  const lines = content.split('\n');
  if (!lines.length) return EMPTY_VALUE;
  return lines.map((line) => ({ type: 'p', children: [{ text: line }] })) as Descendant[];
};

const serializeValue = (value: Descendant[]): string => JSON.stringify(value);

interface ToolbarButtonProps {
  label: string;
  onClick: () => void;
  active?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
}

function ToolbarButton({ label, onClick, active, icon, disabled }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={`aycd-toolbar-button ${active ? 'active' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="aycd-toolbar-icon">{icon}</span>}
      <span>{label}</span>
    </button>
  );
}

function BlockSelect({ editor, readOnly }: { editor: PlateEditorInstance | null; readOnly?: boolean }) {
  const getActiveBlock = useCallback(() => {
    if (!editor || !editor.selection) return defaultBlock;
    return blockOptions.find((option) => isBlockActive(editor, option.value)) ?? defaultBlock;
  }, [editor]);

  const active = getActiveBlock();
  const selectedValue = active?.value ?? defaultBlock.value;

  const handleChange = (value: string) => {
    if (!editor) return;

    if (value === 'blockquote') {
      editor.tf.toggleBlock('blockquote');
      return;
    }

    setBlockType(editor, value);
  };

  return (
    <div className="aycd-block-select">
      <select
        value={selectedValue}
        onChange={(event) => handleChange(event.target.value)}
        disabled={readOnly}
      >
        {blockOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const toSlateEditor = (editor: PlateEditorInstance) => editor as unknown as Editor;

const setBlockType = (editor: PlateEditorInstance, type: string) => {
  Transforms.setNodes(
    toSlateEditor(editor),
    { type } as any,
    {
      match: (n) => SlateElement.isElement(n),
    }
  );
};

const isMarkActive = (editor: PlateEditorInstance, mark: string) => {
  const marks = Editor.marks(toSlateEditor(editor)) as Record<string, unknown> | null;
  return marks ? Boolean(marks[mark]) : false;
};

const toggleMark = (editor: PlateEditorInstance, mark: string) => {
  if (isMarkActive(editor, mark)) {
    Editor.removeMark(toSlateEditor(editor), mark);
  } else {
    Editor.addMark(toSlateEditor(editor), mark, true);
  }
};

const isBlockActive = (editor: PlateEditorInstance, type: string) => {
  if (!editor.selection) return false;
  const [match] = Editor.nodes(toSlateEditor(editor), {
    match: (n) => SlateElement.isElement(n) && (n as any).type === type,
  });
  return Boolean(match);
};

function EditorToolbar({ readOnly }: { readOnly?: boolean }) {
  const editor = usePlateEditor();
  if (!editor) return null;

  return (
    <div className="aycd-toolbar-row">
      <div className="aycd-toolbar-group">
        <BlockSelect editor={editor} readOnly={readOnly} />
      </div>
      <div className="aycd-toolbar-group">
        <ToolbarButton
          label="Bold"
          icon={<span className="aycd-letter">B</span>}
          onClick={() => toggleMark(editor, 'bold')}
          active={isMarkActive(editor, 'bold')}
          disabled={readOnly}
        />
        <ToolbarButton
          label="Italic"
          icon={<span className="aycd-letter">I</span>}
          onClick={() => toggleMark(editor, 'italic')}
          active={isMarkActive(editor, 'italic')}
          disabled={readOnly}
        />
        <ToolbarButton
          label="Underline"
          icon={<span className="aycd-letter">U</span>}
          onClick={() => toggleMark(editor, 'underline')}
          active={isMarkActive(editor, 'underline')}
          disabled={readOnly}
        />
        <ToolbarButton
          label="Strike"
          icon={<span className="aycd-letter">S</span>}
          onClick={() => toggleMark(editor, 'strikethrough')}
          active={isMarkActive(editor, 'strikethrough')}
          disabled={readOnly}
        />
        <ToolbarButton
          label="Highlight"
          icon={<span className="aycd-dot" />}
          onClick={() => toggleMark(editor, 'highlight')}
          active={isMarkActive(editor, 'highlight')}
          disabled={readOnly}
        />
        <ToolbarButton
          label="Code"
          icon={<span className="aycd-letter">{`</>`}</span>}
          onClick={() => toggleMark(editor, 'code')}
          active={isMarkActive(editor, 'code')}
          disabled={readOnly}
        />
        <ToolbarButton
          label="Kbd"
          icon={<span className="aycd-letter">⌘</span>}
          onClick={() => toggleMark(editor, 'kbd')}
          active={isMarkActive(editor, 'kbd')}
          disabled={readOnly}
        />
      </div>
      <div className="aycd-toolbar-group subtle">
        <ToolbarButton
          label="/ Command"
          icon={<span className="aycd-letter">/</span>}
          onClick={() => editor.api.redecorate?.()}
          disabled={readOnly}
        />
      </div>
    </div>
  );
}

export function PlateEditor({ content = '', onChange, readOnly = false, placeholder }: PlateEditorProps) {
  const plugins = useMemo(
    () => [ParagraphPlugin, BasicBlocksPlugin, BasicMarksPlugin, HighlightPlugin, KbdPlugin],
    []
  );

  const editor = useMemo(() => createPlateEditor({ plugins }), [plugins]);

  const isApplyingExternalValue = useRef(false);

  useEffect(() => {
    const value = parseContentToValue(content);
    isApplyingExternalValue.current = true;
    editor.tf.setValue(value as any);
    editor.selection = null;
    editor.history = { redos: [], undos: [] } as any;
    requestAnimationFrame(() => {
      isApplyingExternalValue.current = false;
    });
  }, [content, editor]);

  const handleChange = useCallback(
    ({ value }: { value: Descendant[] }) => {
      if (isApplyingExternalValue.current) {
        return;
      }

      onChange?.(serializeValue(value), formatNodesToPlainText(value));
    },
    [onChange]
  );

  return (
    <div className="aycd-plate">
      <Plate editor={editor} onChange={handleChange} readOnly={readOnly}>
        <div className="aycd-toolbar-shell">
          <div className="aycd-toolbar-headline">
            <div>
              <p className="aycd-eyebrow">Rich text playground</p>
              <h4>Plate-powered editing</h4>
            </div>
            <span className="aycd-pill">Live preview</span>
          </div>
          <EditorToolbar readOnly={readOnly} />
        </div>
        <div className="aycd-editor-pane">
          <PlateContent
            readOnly={readOnly}
            className="aycd-plate-editable"
            placeholder={placeholder ?? 'Write something brilliant. Use / for commands.'}
            spellCheck
          />
        </div>
      </Plate>
    </div>
  );
}
