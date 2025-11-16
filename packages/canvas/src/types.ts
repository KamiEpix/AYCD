import type { CanvasData } from '@aycd/core';

export interface CanvasProps {
  data?: CanvasData;
  onUpdate?: (data: CanvasData) => void;
  readOnly?: boolean;
  width?: number;
  height?: number;
}
