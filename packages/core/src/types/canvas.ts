/**
 * Canvas-related types
 */

export interface CanvasNode {
  id: string;
  type: 'character' | 'location' | 'event' | 'note' | 'custom';
  x: number;
  y: number;
  width: number;
  height: number;
  data: CanvasNodeData;
  style?: CanvasNodeStyle;
}

export interface CanvasNodeData {
  title: string;
  description?: string;
  documentId?: string;
  metadata?: Record<string, unknown>;
}

export interface CanvasNodeStyle {
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  icon?: string;
}

export interface CanvasConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  type: 'relationship' | 'causality' | 'reference' | 'custom';
  label?: string;
  style?: CanvasConnectionStyle;
}

export interface CanvasConnectionStyle {
  color?: string;
  width?: number;
  dashed?: boolean;
}

export interface CanvasData {
  nodes: CanvasNode[];
  connections: CanvasConnection[];
  viewport?: {
    x: number;
    y: number;
    scale: number;
  };
}
