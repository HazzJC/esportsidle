/**
 * Colours used outside CSS: SVG art, rarity tables, interface tones and team kits. The rarity values
 * are mirrored by the --r-* tokens in styles/global.css, so change both together.
 */
export const PALETTE = {
  accent2: '#ff7a9c',
  gold: '#f5c451',
  green: '#4ade80',
  red: '#f0525f',
  white: '#f1f1f0',
  ink: '#0c0c0e',
} as const;

/**
 * Six rarity bands shared by players, gear and staff. Rare and epic keep blue and purple on purpose:
 * that ordering is a convention players read instantly, so it carries meaning rather than decoration.
 */
export const RARITY_COLORS = ['#a3a3a6', '#4ade80', '#4f9dff', '#a97bff', '#f5c451', '#ff5f7e'] as const;

export interface Swatch {
  id: string;
  name: string;
  color: string;
}

/**
 * Interface tones: the highlight colour for menus, buttons and selection. This is purely a
 * preference for the person playing and never appears on in-game kit or art.
 */
export const UI_TONES: Swatch[] = [
  { id: 'mono', name: 'Mono', color: '#e8e6e1' },
  { id: 'crimson', name: 'Crimson', color: '#f0445a' },
  { id: 'signal', name: 'Signal', color: '#ff6b35' },
  { id: 'gold', name: 'Gold', color: '#f5c451' },
  { id: 'volt', name: 'Volt', color: '#c5e84a' },
  { id: 'emerald', name: 'Emerald', color: '#34d399' },
  { id: 'teal', name: 'Teal', color: '#2dd4bf' },
  { id: 'sky', name: 'Sky', color: '#60a5fa' },
  { id: 'violet', name: 'Violet', color: '#a78bfa' },
  { id: 'rose', name: 'Rose', color: '#fb7185' },
];

/** Neutral until the player picks a tone, so no colour is imposed on them. */
export const DEFAULT_TONE = UI_TONES[0].color;

export interface KitPreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
}

/** Team colour presets (primary + accent). Players can also pick any colours freely. */
export const TEAM_KITS: KitPreset[] = [
  { id: 'classic', name: 'Classic', primary: '#e9e6df', secondary: '#34343a' },
  { id: 'crimson', name: 'Crimson', primary: '#c8283c', secondary: '#f1f1f0' },
  { id: 'signal', name: 'Signal', primary: '#ff6b35', secondary: '#f1f1f0' },
  { id: 'forest', name: 'Forest', primary: '#1f7a4f', secondary: '#f5c451' },
  { id: 'royal', name: 'Royal', primary: '#2c4aa0', secondary: '#f5c451' },
  { id: 'onyx', name: 'Onyx', primary: '#26262b', secondary: '#f5c451' },
  { id: 'sand', name: 'Sand', primary: '#d9c39a', secondary: '#26262b' },
  { id: 'mint', name: 'Mint', primary: '#5fd3a8', secondary: '#26262b' },
  { id: 'volt', name: 'Volt', primary: '#d4f53c', secondary: '#26262b' },
  { id: 'sunset', name: 'Sunset', primary: '#ff8a3d', secondary: '#7a1f3d' },
  { id: 'rose', name: 'Rose', primary: '#ff7a9c', secondary: '#f1f1f0' },
  { id: 'arcade', name: 'Arcade', primary: '#22e4ff', secondary: '#ff2bd6' },
];

export const DEFAULT_KIT = TEAM_KITS[0];
/** The original hardcoded kit. Saves still wearing it are moved to the default on load. */
export const LEGACY_KIT = { primary: '#22e4ff', secondary: '#ff2bd6' };

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
}
