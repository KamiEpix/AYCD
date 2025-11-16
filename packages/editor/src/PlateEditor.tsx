import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
import { createPortal } from 'react-dom';
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

const highlightPalette = [
  { id: 'amber', label: 'Amber', color: 'var(--aycd-amber)' },
  { id: 'sand', label: 'Sand', color: 'var(--aycd-sand)' },
  { id: 'rose', label: 'Rose', color: 'var(--aycd-rose)' },
  { id: 'teal', label: 'Teal', color: 'var(--aycd-teal)' },
  { id: 'plum', label: 'Plum', color: 'var(--aycd-plum)' },
];

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

function HighlightSwatches({
  active,
  onSelect,
  onClear,
  readOnly,
}: {
  active?: string | null;
  onSelect: (id: string) => void;
  onClear: () => void;
  readOnly?: boolean;
}) {
  return (
    <div className="aycd-highlight-swatches">
      {highlightPalette.map((tone) => (
        <button
          key={tone.id}
          type="button"
          className={`highlight-swatch ${active === tone.id ? 'active' : ''}`}
          style={{ background: tone.color }}
          onClick={() => onSelect(tone.id)}
          disabled={readOnly}
          aria-label={`Highlight ${tone.label}`}
        />
      ))}
      <button type="button" className="highlight-clear" onClick={onClear} disabled={readOnly}>
        Clear
      </button>
    </div>
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

  const activeMarks = (Editor.marks(toSlateEditor(editor)) as Record<string, unknown> | null) ?? {};
  const activeHighlight = (activeMarks?.highlightColor as string | undefined) ?? null;

  const applyHighlight = (tone: string) => {
    Editor.addMark(toSlateEditor(editor), 'highlight', true);
    Editor.addMark(toSlateEditor(editor), 'highlightColor', tone);
  };

  const clearHighlight = () => {
    Editor.removeMark(toSlateEditor(editor), 'highlight');
    Editor.removeMark(toSlateEditor(editor), 'highlightColor');
  };

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
      <div className="aycd-toolbar-group spread">
        <HighlightSwatches active={activeHighlight} onSelect={applyHighlight} onClear={clearHighlight} readOnly={readOnly} />
      </div>
    </div>
  );
}

function AycdLeaf({ attributes, children, leaf }: any) {
  const marks = leaf as Record<string, unknown>;
  let updatedChildren = children;

  if (marks.bold) {
    updatedChildren = <strong>{updatedChildren}</strong>;
  }
  if (marks.italic) {
    updatedChildren = <em>{updatedChildren}</em>;
  }
  if (marks.underline) {
    updatedChildren = <u>{updatedChildren}</u>;
  }
  if (marks.strikethrough) {
    updatedChildren = <s>{updatedChildren}</s>;
  }
  if (marks.code) {
    updatedChildren = <code>{updatedChildren}</code>;
  }
  if (marks.kbd) {
    updatedChildren = <kbd>{updatedChildren}</kbd>;
  }

  const highlightColor = marks.highlightColor as string | undefined;
  const isHighlighted = Boolean(marks.highlight || highlightColor);

  if (isHighlighted) {
    updatedChildren = (
      <span className="aycd-leaf-highlight" data-color={highlightColor ?? 'amber'}>
        {updatedChildren}
      </span>
    );
  }

  return (
    <span {...attributes} className="aycd-leaf">
      {updatedChildren}
    </span>
  );
}

export function PlateEditor({ content = '', onChange, readOnly = false, placeholder }: PlateEditorProps) {
  const plugins = useMemo(
    () => [ParagraphPlugin, BasicBlocksPlugin, BasicMarksPlugin, HighlightPlugin, KbdPlugin],
    []
  );

  const editor = useMemo(() => createPlateEditor({ plugins }), [plugins]);

  const isApplyingExternalValue = useRef(false);
  const editorPaneRef = useRef<HTMLDivElement | null>(null);
  const [selectionRect, setSelectionRect] = useState<{ top: number; left: number } | null>(null);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const root = editorPaneRef.current;
      if (!selection || !root || selection.rangeCount === 0 || selection.isCollapsed) {
        setSelectionRect(null);
        return;
      }

      const range = selection.getRangeAt(0);
      if (!root.contains(range.startContainer)) {
        setSelectionRect(null);
        return;
      }

      const rect = range.getBoundingClientRect();
      setSelectionRect({
        top: rect.top + window.scrollY - 12,
        left: rect.left + rect.width / 2 + window.scrollX,
      });
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  const activeMarks = (Editor.marks(toSlateEditor(editor)) as Record<string, unknown> | null) ?? {};
  const activeHighlight = (activeMarks?.highlightColor as string | undefined) ?? null;

  const applyHighlight = (tone: string) => {
    Editor.addMark(toSlateEditor(editor), 'highlight', true);
    Editor.addMark(toSlateEditor(editor), 'highlightColor', tone);
  };

  const clearHighlight = () => {
    Editor.removeMark(toSlateEditor(editor), 'highlight');
    Editor.removeMark(toSlateEditor(editor), 'highlightColor');
  };

  const portalTarget = typeof document !== 'undefined' ? document.body : null;

  const selectionPopover =
    selectionRect && !readOnly && portalTarget
      ? createPortal(
          <div className="aycd-selection-popover" style={{ top: selectionRect.top, left: selectionRect.left }}>
            <div className="popover-row">
              <button type="button" onClick={() => toggleMark(editor, 'bold')} className={isMarkActive(editor, 'bold') ? 'active' : ''}>
                B
              </button>
              <button type="button" onClick={() => toggleMark(editor, 'italic')} className={isMarkActive(editor, 'italic') ? 'active' : ''}>
                I
              </button>
              <button type="button" onClick={() => toggleMark(editor, 'underline')} className={isMarkActive(editor, 'underline') ? 'active' : ''}>
                U
              </button>
              <button type="button" onClick={() => toggleMark(editor, 'highlight')} className={isMarkActive(editor, 'highlight') ? 'active' : ''}>
                ✺
              </button>
            </div>
            <HighlightSwatches active={activeHighlight} onSelect={applyHighlight} onClear={clearHighlight} />
          </div>,
          portalTarget
        )
      : null;

  return (
    <div className="aycd-plate">
      <Plate editor={editor} onChange={handleChange} readOnly={readOnly}>
        <div className="aycd-toolbar-shell">
          <EditorToolbar readOnly={readOnly} />
        </div>
        <div className="aycd-editor-pane" ref={editorPaneRef}>
          <PlateContent
            readOnly={readOnly}
            className="aycd-plate-editable"
            placeholder={placeholder ?? 'Write something brilliant. Use / for commands.'}
            spellCheck
            renderLeaf={((props: any) => <AycdLeaf {...props} />) as any}
          />
        </div>
      </Plate>
      {selectionPopover}
    </div>
  );
}
