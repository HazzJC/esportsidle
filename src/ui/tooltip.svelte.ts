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

class TooltipStore {
  source = $state.raw<TipSource | null>(null);
  x = $state(0);
  y = $state(0);
  anchor: HTMLElement | null = null;

  show(anchor: HTMLElement, source: TipSource, x: number, y: number): void {
    this.anchor = anchor;
    this.source = source;
    this.x = x;
    this.y = y;
  }

  move(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  hide(anchor?: HTMLElement): void {
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
export const tooltip: Action<HTMLElement, TipSource> = (node, initial) => {
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

  node.addEventListener('pointerenter', onEnter);
  node.addEventListener('pointermove', onMove);
  node.addEventListener('pointerleave', onLeave);
  node.addEventListener('pointerdown', onDown);
  node.addEventListener('pointerup', onUp);
  node.addEventListener('pointercancel', onUp);
  node.addEventListener('click', onClickCapture, true);
  node.addEventListener('contextmenu', onContextMenu);

  return {
    update(next: TipSource) {
      source = next;
      if (tip.anchor === node) tip.source = next;
    },
    destroy() {
      clearTimeout(pressTimer);
      node.removeEventListener('pointerenter', onEnter);
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerleave', onLeave);
      node.removeEventListener('pointerdown', onDown);
      node.removeEventListener('pointerup', onUp);
      node.removeEventListener('pointercancel', onUp);
      node.removeEventListener('click', onClickCapture, true);
      node.removeEventListener('contextmenu', onContextMenu);
      tip.hide(node);
    },
  };
};
