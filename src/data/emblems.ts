/**
 * The org's emblem: a badge shape with a mark in the middle. It is the logo from the first minute;
 * a pixel logo drawn in the Studio takes its place inside the same badge.
 */
export type EmblemShape = 'shield' | 'round' | 'hex' | 'diamond' | 'badge';

export interface Emblem {
  shape: EmblemShape;
  /** 'initials' for the org's initials, otherwise an icon name. */
  mark: string;
}

export const DEFAULT_EMBLEM: Emblem = { shape: 'shield', mark: 'initials' };

export interface EmblemShapeDef {
  id: EmblemShape;
  name: string;
  /** Outer badge, filled with the team colours. */
  outer: string;
  /** Inner panel, which also clips a drawn logo. */
  inner: string;
}

/** All drawn on a 200x200 grid, centred on (100, 100). */
export const EMBLEM_SHAPES: EmblemShapeDef[] = [
  {
    id: 'shield',
    name: 'Shield',
    outer: 'M100 12 L172 38 V96 C172 140 142 172 100 190 C58 172 28 140 28 96 V38 Z',
    inner: 'M100 26 L160 48 V96 C160 132 136 158 100 174 C64 158 40 132 40 96 V48 Z',
  },
  {
    id: 'round',
    name: 'Roundel',
    outer: 'M100 12 A88 88 0 1 1 99.9 12 Z',
    inner: 'M100 26 A74 74 0 1 1 99.9 26 Z',
  },
  {
    id: 'hex',
    name: 'Hex',
    outer: 'M100 10 L178 55 V145 L100 190 L22 145 V55 Z',
    inner: 'M100 26 L164 63 V137 L100 174 L36 137 V63 Z',
  },
  {
    id: 'diamond',
    name: 'Diamond',
    outer: 'M100 8 L192 100 L100 192 L8 100 Z',
    inner: 'M100 28 L172 100 L100 172 L28 100 Z',
  },
  {
    id: 'badge',
    name: 'Badge',
    outer: 'M46 16 H154 A30 30 0 0 1 184 46 V154 A30 30 0 0 1 154 184 H46 A30 30 0 0 1 16 154 V46 A30 30 0 0 1 46 16 Z',
    inner: 'M52 30 H148 A22 22 0 0 1 170 52 V148 A22 22 0 0 1 148 170 H52 A22 22 0 0 1 30 148 V52 A22 22 0 0 1 52 30 Z',
  },
];

export const EMBLEM_SHAPE_MAP: Map<EmblemShape, EmblemShapeDef> = new Map(EMBLEM_SHAPES.map((d) => [d.id, d]));

/** Marks for the middle of the badge. */
export const EMBLEM_MARKS: { id: string; name: string }[] = [
  { id: 'initials', name: 'Initials' },
  { id: 'zap', name: 'Bolt' },
  { id: 'crown', name: 'Crown' },
  { id: 'flame', name: 'Flame' },
  { id: 'skull', name: 'Skull' },
  { id: 'star', name: 'Star' },
  { id: 'crosshair', name: 'Crosshair' },
  { id: 'swords', name: 'Swords' },
  { id: 'gamepad-2', name: 'Controller' },
  { id: 'rocket', name: 'Rocket' },
  { id: 'cat', name: 'Cat' },
  { id: 'trophy', name: 'Trophy' },
];

export function isEmblem(value: unknown): value is Emblem {
  if (!value || typeof value !== 'object') return false;
  const e = value as Emblem;
  return EMBLEM_SHAPE_MAP.has(e.shape) && EMBLEM_MARKS.some((m) => m.id === e.mark);
}
