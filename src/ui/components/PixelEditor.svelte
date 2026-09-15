<script lang="ts">
  import { untrack } from 'svelte';
  import { DESIGN_PALETTE, TREND_MAP, type TrendId } from '../../data/merch';
  import { PIXEL_FONT } from '../../data/pixelFont';
  import { DESIGN_SIZES, MAX_PALETTE, analyzeDesign, decodePixels, encodePixels, type DesignDraft } from '../../engine/designs';
  import type { Design } from '../../engine/types';
  import Icon from './Icon.svelte';

  type Tool = 'pencil' | 'eraser' | 'fill' | 'line' | 'rect' | 'circle' | 'picker' | 'text';

  let {
    initial,
    trend,
    onsave,
    oncancel,
  }: { initial: Design | null; trend: TrendId; onsave: (draft: DesignDraft) => void; oncancel: () => void } = $props();

  const TOOLS: { id: Tool; label: string; icon: string; key: string }[] = [
    { id: 'pencil', label: 'Pencil', icon: 'pencil', key: 'b' },
    { id: 'eraser', label: 'Eraser', icon: 'eraser', key: 'e' },
    { id: 'fill', label: 'Fill', icon: 'paint-bucket', key: 'g' },
    { id: 'line', label: 'Line', icon: 'minus', key: 'l' },
    { id: 'rect', label: 'Rectangle', icon: 'square', key: 'r' },
    { id: 'circle', label: 'Ellipse', icon: 'circle', key: 'c' },
    { id: 'picker', label: 'Colour picker', icon: 'pipette', key: 'i' },
    { id: 'text', label: 'Text stamp', icon: 'type', key: 't' },
  ];
  const MAX_UNDO = 60;
  const CANVAS_PX = 512;

  const start = untrack(() =>
    initial ? { name: initial.name, size: initial.size, palette: [...initial.palette], pixels: decodePixels(initial), editing: true } : null,
  );

  let name = $state(start?.name ?? 'New design');
  let size = $state(start?.size ?? 32);
  let palette = $state<string[]>(start?.palette ?? [...DESIGN_PALETTE]);
  let pixels: Uint8Array = start?.pixels ?? new Uint8Array((start?.size ?? 32) * (start?.size ?? 32));
  let tool = $state<Tool>('pencil');
  let color = $state(7);
  let mirrorX = $state(false);
  let mirrorY = $state(false);
  let filled = $state(false);
  let stampText = $state('GG');
  let revision = $state(0);
  let hoverCell = $state<[number, number] | null>(null);
  let canUndo = $state(false);
  let canRedo = $state(false);
  let canvas: HTMLCanvasElement | undefined = $state();

  let undoStack: Uint8Array[] = [];
  let redoStack: Uint8Array[] = [];
  let drawing = false;
  let startCell: [number, number] | null = null;
  let lastCell: [number, number] | null = null;
  let preview: Uint8Array | null = null;

  const scale = $derived(Math.max(1, Math.floor(CANVAS_PX / size)));
  const trendDef = $derived(TREND_MAP.get(trend));

  const appeal = $derived.by(() => {
    void revision;
    return analyzeDesign(
      { id: 'draft', name, size, palette: $state.snapshot(palette), pixels: encodePixels(pixels), handmade: true, createdAt: 0, version: revision },
      trend,
      false,
    );
  });

  // ---------------------------------------------------------------------------
  // Drawing primitives
  // ---------------------------------------------------------------------------
  function put(buf: Uint8Array, x: number, y: number, v: number) {
    const n = size;
    const set = (px: number, py: number) => {
      if (px >= 0 && py >= 0 && px < n && py < n) buf[py * n + px] = v;
    };
    set(x, y);
    if (mirrorX) set(n - 1 - x, y);
    if (mirrorY) set(x, n - 1 - y);
    if (mirrorX && mirrorY) set(n - 1 - x, n - 1 - y);
  }

  function line(x0: number, y0: number, x1: number, y1: number, fn: (x: number, y: number) => void) {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      fn(x, y);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }

  function rect(x0: number, y0: number, x1: number, y1: number, fn: (x: number, y: number) => void) {
    const [ax, bx] = [Math.min(x0, x1), Math.max(x0, x1)];
    const [ay, by] = [Math.min(y0, y1), Math.max(y0, y1)];
    for (let y = ay; y <= by; y++) {
      for (let x = ax; x <= bx; x++) {
        if (filled || x === ax || x === bx || y === ay || y === by) fn(x, y);
      }
    }
  }

  function ellipse(x0: number, y0: number, x1: number, y1: number, fn: (x: number, y: number) => void) {
    const [ax, bx] = [Math.min(x0, x1), Math.max(x0, x1)];
    const [ay, by] = [Math.min(y0, y1), Math.max(y0, y1)];
    const cx = (ax + bx) / 2;
    const cy = (ay + by) / 2;
    const rx = (bx - ax) / 2 + 0.5;
    const ry = (by - ay) / 2 + 0.5;
    const inside = (x: number, y: number) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
    for (let y = ay; y <= by; y++) {
      for (let x = ax; x <= bx; x++) {
        if (!inside(x, y)) continue;
        if (filled || !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)) fn(x, y);
      }
    }
  }

  function flood(buf: Uint8Array, x: number, y: number, v: number) {
    const n = size;
    const target = buf[y * n + x];
    if (target === v) return;
    const stack = [y * n + x];
    while (stack.length > 0) {
      const i = stack.pop()!;
      if (buf[i] !== target) continue;
      buf[i] = v;
      const px = i % n;
      const py = (i - px) / n;
      if (px > 0) stack.push(i - 1);
      if (px < n - 1) stack.push(i + 1);
      if (py > 0) stack.push(i - n);
      if (py < n - 1) stack.push(i + n);
    }
  }

  function stamp(buf: Uint8Array, x: number, y: number, text: string, v: number) {
    let cursor = x;
    for (const ch of text.toUpperCase()) {
      const glyph = PIXEL_FONT[ch] ?? PIXEL_FONT['?'];
      glyph.forEach((row, gy) => {
        for (let gx = 0; gx < row.length; gx++) if (row[gx] === '1') put(buf, cursor + gx, y + gy, v);
      });
      cursor += 4;
    }
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------
  function render() {
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const n = size;
    const sc = scale;
    const buf = preview ?? pixels;
    if (canvas.width !== n * sc) {
      canvas.width = n * sc;
      canvas.height = n * sc;
    }
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const v = buf[y * n + x];
        ctx.fillStyle = v > 0 ? (palette[v - 1] ?? '#ffffff') : (x + y) % 2 ? '#1a1f3a' : '#141830';
        ctx.fillRect(x * sc, y * sc, sc, sc);
      }
    }
    if (sc >= 8) {
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i < n; i++) {
        ctx.moveTo(i * sc + 0.5, 0);
        ctx.lineTo(i * sc + 0.5, n * sc);
        ctx.moveTo(0, i * sc + 0.5);
        ctx.lineTo(n * sc, i * sc + 0.5);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(34,228,255,0.6)';
    ctx.setLineDash([6, 6]);
    if (mirrorX) {
      ctx.beginPath();
      ctx.moveTo((n * sc) / 2, 0);
      ctx.lineTo((n * sc) / 2, n * sc);
      ctx.stroke();
    }
    if (mirrorY) {
      ctx.beginPath();
      ctx.moveTo(0, (n * sc) / 2);
      ctx.lineTo(n * sc, (n * sc) / 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    if (hoverCell) {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.strokeRect(hoverCell[0] * sc + 0.5, hoverCell[1] * sc + 0.5, sc - 1, sc - 1);
    }
  }

  $effect(() => {
    void revision;
    void size;
    void mirrorX;
    void mirrorY;
    void hoverCell;
    for (const c of palette) void c;
    render();
  });

  // ---------------------------------------------------------------------------
  // Interaction
  // ---------------------------------------------------------------------------
  function cellAt(e: PointerEvent): [number, number] | null {
    if (!canvas) return null;
    const r = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * size);
    const y = Math.floor(((e.clientY - r.top) / r.height) * size);
    return x >= 0 && y >= 0 && x < size && y < size ? [x, y] : null;
  }

  function pushUndo() {
    undoStack.push(pixels.slice());
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack = [];
    canUndo = true;
    canRedo = false;
  }

  function commit() {
    revision++;
  }

  function shapePreview(to: [number, number]) {
    if (!startCell) return;
    const buf = pixels.slice();
    const plot = (x: number, y: number) => put(buf, x, y, color);
    if (tool === 'line') line(startCell[0], startCell[1], to[0], to[1], plot);
    else if (tool === 'rect') rect(startCell[0], startCell[1], to[0], to[1], plot);
    else if (tool === 'circle') ellipse(startCell[0], startCell[1], to[0], to[1], plot);
    preview = buf;
    render();
  }

  function onDown(e: PointerEvent) {
    const cell = cellAt(e);
    if (!cell || !canvas) return;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Capture isn't available for synthetic or already-released pointers; drawing still works.
    }
    const [x, y] = cell;
    if (tool === 'picker') {
      const v = pixels[y * size + x];
      if (v > 0) color = v;
      tool = 'pencil';
      return;
    }
    pushUndo();
    if (tool === 'fill') {
      flood(pixels, x, y, color);
      if (mirrorX) flood(pixels, size - 1 - x, y, color);
      if (mirrorY) flood(pixels, x, size - 1 - y, color);
      commit();
      return;
    }
    if (tool === 'text') {
      stamp(pixels, x, y, stampText, color);
      commit();
      return;
    }
    drawing = true;
    startCell = cell;
    lastCell = cell;
    if (tool === 'pencil' || tool === 'eraser') {
      put(pixels, x, y, tool === 'eraser' ? 0 : color);
      render();
    } else {
      shapePreview(cell);
    }
  }

  function onMove(e: PointerEvent) {
    const cell = cellAt(e);
    if (!drawing) {
      hoverCell = cell;
      return;
    }
    if (!cell) return;
    if ((tool === 'pencil' || tool === 'eraser') && lastCell) {
      const value = tool === 'eraser' ? 0 : color;
      line(lastCell[0], lastCell[1], cell[0], cell[1], (x, y) => put(pixels, x, y, value));
      lastCell = cell;
      render();
    } else {
      shapePreview(cell);
    }
  }

  function onUp() {
    if (!drawing) return;
    drawing = false;
    if (preview) {
      pixels = preview;
      preview = null;
    }
    startCell = null;
    lastCell = null;
    commit();
  }

  function undo() {
    const prev = undoStack.pop();
    if (!prev) return;
    redoStack.push(pixels.slice());
    pixels = prev;
    canUndo = undoStack.length > 0;
    canRedo = true;
    commit();
  }

  function redo() {
    const next = redoStack.pop();
    if (!next) return;
    undoStack.push(pixels.slice());
    pixels = next;
    canUndo = true;
    canRedo = redoStack.length > 0;
    commit();
  }

  function clear() {
    pushUndo();
    pixels.fill(0);
    commit();
  }

  function changeSize(n: number) {
    if (start?.editing || n === size) return;
    size = n;
    pixels = new Uint8Array(n * n);
    undoStack = [];
    redoStack = [];
    canUndo = false;
    canRedo = false;
    commit();
  }

  function addColour() {
    if (palette.length >= MAX_PALETTE) return;
    palette.push('#ffffff');
    color = palette.length;
  }

  function save() {
    onsave({ name: name.trim() || 'Untitled', size, palette: $state.snapshot(palette), pixels: encodePixels(pixels), handmade: true });
  }

  function onKey(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      redo();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const match = TOOLS.find((t) => t.key === e.key.toLowerCase());
    if (match) tool = match.id;
  }

  const BARS: { key: 'colors' | 'coverage' | 'symmetry' | 'contrast' | 'trend'; label: string }[] = [
    { key: 'colors', label: 'Colours' },
    { key: 'coverage', label: 'Coverage' },
    { key: 'symmetry', label: 'Symmetry' },
    { key: 'contrast', label: 'Contrast' },
    { key: 'trend', label: 'Trend' },
  ];
</script>

<svelte:window onkeydown={onKey} />

<div class="editor">
  <div class="side tools-col">
    <div class="tools">
      {#each TOOLS as t (t.id)}
        <button class="tool" class:active={tool === t.id} onclick={() => (tool = t.id)} title="{t.label} ({t.key.toUpperCase()})" aria-label={t.label}>
          <Icon name={t.icon} size={18} />
        </button>
      {/each}
    </div>
    <div class="toggles">
      <button class="toggle" class:active={mirrorX} onclick={() => (mirrorX = !mirrorX)} title="Mirror left/right">
        <Icon name="move-horizontal" size={16} /> Mirror ↔
      </button>
      <button class="toggle" class:active={mirrorY} onclick={() => (mirrorY = !mirrorY)} title="Mirror top/bottom">
        <Icon name="move-vertical" size={16} /> Mirror ↕
      </button>
      {#if tool === 'rect' || tool === 'circle'}
        <button class="toggle" class:active={filled} onclick={() => (filled = !filled)}>
          <Icon name="square" size={16} /> {filled ? 'Filled' : 'Outline'}
        </button>
      {/if}
      {#if tool === 'text'}
        <input class="stamp" bind:value={stampText} maxlength="12" aria-label="Text to stamp" />
      {/if}
    </div>
    <div class="history">
      <button class="btn small" disabled={!canUndo} onclick={undo} title="Undo (Ctrl+Z)"><Icon name="undo-2" size={14} /></button>
      <button class="btn small" disabled={!canRedo} onclick={redo} title="Redo (Ctrl+Y)"><Icon name="redo-2" size={14} /></button>
      <button class="btn small" onclick={clear} title="Clear"><Icon name="trash" size={14} /></button>
    </div>
    {#if !start?.editing}
      <div class="sizes">
        <span class="muted small">Canvas</span>
        {#each DESIGN_SIZES as n (n)}
          <button class="toggle" class:active={size === n} onclick={() => changeSize(n)}>{n}×{n}</button>
        {/each}
      </div>
    {/if}
  </div>

  <div class="canvas-wrap">
    <canvas
      bind:this={canvas}
      class="canvas"
      onpointerdown={onDown}
      onpointermove={onMove}
      onpointerup={onUp}
      onpointercancel={onUp}
      onpointerleave={() => (hoverCell = null)}
    ></canvas>
  </div>

  <div class="side info-col">
    <label class="name">
      <span class="muted small">Name</span>
      <input bind:value={name} maxlength="24" />
    </label>

    <div class="palette">
      {#each palette as c, i (i)}
        <button
          class="swatch"
          class:active={color === i + 1}
          style="background:{c}"
          onclick={() => (color = i + 1)}
          aria-label="Colour {i + 1}"
        ></button>
      {/each}
      {#if palette.length < MAX_PALETTE}
        <button class="swatch add" onclick={addColour} aria-label="Add colour"><Icon name="plus" size={12} /></button>
      {/if}
    </div>
    <label class="custom">
      <span class="muted small">Edit selected colour</span>
      <input type="color" value={palette[color - 1] ?? '#ffffff'} oninput={(e) => (palette[color - 1] = e.currentTarget.value)} />
    </label>

    <div class="appeal">
      <div class="appeal-head">
        <span class="muted small">Merch appeal</span>
        <span class="score num">{Math.round(appeal.total * 100)}%</span>
      </div>
      {#each BARS as b (b.key)}
        <div class="abar">
          <span>{b.label}</span>
          <span class="bar"><i style="width:{appeal[b.key] * 100}%"></i></span>
        </div>
      {/each}
      <p class="trend dim small">Current trend: <b>{trendDef?.name}</b>. Hand-drawn designs get a 15% bonus.</p>
      {#each appeal.hints as hint (hint)}
        <p class="hint small"><Icon name="info" size={12} /> {hint}</p>
      {/each}
    </div>

    <div class="actions">
      <button class="btn" onclick={oncancel}>Cancel</button>
      <button class="btn primary" onclick={save}><Icon name="check" size={14} /> Save design</button>
    </div>
  </div>
</div>

<style>
  .editor {
    display: grid;
    grid-template-columns: 150px minmax(0, 512px) minmax(220px, 1fr);
    gap: 14px;
    align-items: start;
  }
  .side {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .small {
    font-size: 12px;
    margin: 0;
  }
  .tools {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
  }
  .tool {
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    border-radius: 7px;
    border: 1px solid var(--line-2);
    background: var(--bg-2);
    color: var(--muted);
  }
  .tool.active {
    color: var(--cyan);
    border-color: var(--cyan);
    background: rgba(34, 228, 255, 0.12);
  }
  .toggles,
  .sizes {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 6px;
    border: 1px solid var(--line-2);
    background: var(--bg-2);
    color: var(--muted);
    font-size: 12px;
  }
  .toggle.active {
    color: var(--text);
    border-color: var(--magenta);
    background: rgba(255, 43, 214, 0.12);
  }
  .stamp,
  .name input {
    width: 100%;
    padding: 5px 8px;
    border-radius: 6px;
    border: 1px solid var(--line-2);
    background: var(--bg-2);
    font-family: var(--font-ui);
    font-weight: 700;
  }
  .history {
    display: flex;
    gap: 4px;
  }
  .canvas-wrap {
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--line-2);
    background: #0b0e1f;
  }
  .canvas {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 1;
    image-rendering: pixelated;
    cursor: crosshair;
    touch-action: none;
  }
  .name {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .palette {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 3px;
  }
  .swatch {
    aspect-ratio: 1;
    border-radius: 4px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    padding: 0;
    display: grid;
    place-items: center;
  }
  .swatch.active {
    border-color: #fff;
    box-shadow: 0 0 0 2px var(--cyan);
  }
  .swatch.add {
    background: var(--bg-2);
    color: var(--muted);
  }
  .custom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .custom input {
    width: 44px;
    height: 28px;
    padding: 0;
    border: 1px solid var(--line-2);
    border-radius: 6px;
    background: transparent;
  }
  .appeal {
    padding: 10px;
    border-radius: 9px;
    background: var(--bg-2);
    border: 1px solid var(--line);
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .appeal-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .score {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 22px;
    color: var(--gold);
  }
  .abar {
    display: grid;
    grid-template-columns: 70px 1fr;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }
  .hint {
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--cyan);
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
  }
  @media (max-width: 900px) {
    .editor {
      grid-template-columns: 1fr;
    }
    .tools {
      grid-template-columns: repeat(8, 1fr);
    }
    .toggles,
    .sizes {
      flex-direction: row;
      flex-wrap: wrap;
    }
  }
</style>
