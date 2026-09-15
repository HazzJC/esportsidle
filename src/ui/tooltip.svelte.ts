import type { Action } from 'svelte/action';

export type TipTone = 'good' | 'bad' | 'muted' | 'gold' | 'cyan';

export interface TipLine {
  text: string;
  tone?: TipTone;
}

export interface TipContent {
  title: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  cost?: string;
  costOk?: boolean;
  lines?: (string | TipLine)[];
  flavor?: string;
}

export type TipSource = () => TipContent;

/** Tooltips can be attached to HTML elements or SVG shapes. */
export type TipAnchor = HTMLElement | SVGElement;

class TooltipStore {
  source = $state.raw<TipSource | null>(null);
  x = $state(0);
  y = $state(0);
  anchor: TipAnchor | null = null;

  show(anchor: TipAnchor, source: TipSource, x: number, y: number): void {
    this.anchor = anchor;
    this.source = source;
    this.x = x;
    this.y = y;
  }

  move(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  hide(anchor?: TipAnchor): void {
    if (anchor && anchor !== this.anchor) return;
    this.anchor = null;
    this.source = null;
  }
}

export const tip = new TooltipStore();

const LONG_PRESS_MS = 380;

/**
 * Attaches a live tooltip. Mouse/pen: shows on hover. Touch: shows on long-press
 * (and suppresses the click that follows the long-press).
 */
export const tooltip: Action<TipAnchor, TipSource> = (node, initial) => {
  // SVG and HTML elements share the same pointer events; one cast keeps listener types precise.
  const el = node as HTMLElement;
  let source = initial;
  let pressTimer: ReturnType<typeof setTimeout> | undefined;
  let suppressClick = false;

  const onEnter = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    tip.show(node, source, e.clientX, e.clientY);
  };
  const onMove = (e: PointerEvent) => {
    if (tip.anchor === node && e.pointerType !== 'touch') tip.move(e.clientX, e.clientY);
  };
  const onLeave = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    tip.hide(node);
  };
  const onDown = (e: PointerEvent) => {
    if (e.pointerType !== 'touch') return;
    clearTimeout(pressTimer);
    const { clientX, clientY } = e;
    pressTimer = setTimeout(() => {
      suppressClick = true;
      tip.show(node, source, clientX, clientY - 40);
    }, LONG_PRESS_MS);
  };
  const onUp = () => {
    clearTimeout(pressTimer);
    if (tip.anchor === node) setTimeout(() => tip.hide(node), 1600);
  };
  const onClickCapture = (e: MouseEvent) => {
    if (suppressClick) {
      suppressClick = false;
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  };
  const onContextMenu = (e: Event) => {
    if (suppressClick) e.preventDefault();
  };

  el.addEventListener('pointerenter', onEnter);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerleave', onLeave);
  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);
  el.addEventListener('click', onClickCapture, true);
  el.addEventListener('contextmenu', onContextMenu);

  return {
    update(next: TipSource) {
      source = next;
      if (tip.anchor === node) tip.source = next;
    },
    destroy() {
      clearTimeout(pressTimer);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('click', onClickCapture, true);
      el.removeEventListener('contextmenu', onContextMenu);
      tip.hide(node);
    },
  };
};
