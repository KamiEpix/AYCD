# @aycd/canvas

Konva-based visual canvas for story mapping and worldbuilding.

## Status

**Stub implementation** - Full Konva integration will be added in future iterations.

## Planned Features

- Drag-and-drop node creation
- Node connections and relationships
- Infinite canvas with pan/zoom
- Spatial indexing for performance
- Export to SVG/PNG
- Mini-map navigation

## Usage

```svelte
<script>
  import { Canvas } from '@aycd/canvas';

  let canvasData = $state({ nodes: [], connections: [] });
</script>

<Canvas
  data={canvasData}
  onUpdate={(newData) => canvasData = newData}
/>
```
