export const SKIN_TONES = ['#ffe3cc', '#f6d0ae', '#e9b98f', '#d49a6a', '#b87b4f', '#8d5a3b', '#6b4028', '#4a2c1c'];

export const HAIR_COLORS = [
  '#17171c',
  '#3b2a20',
  '#6b4423',
  '#a0662d',
  '#d9a441',
  '#f2d27a',
  '#bfc3c9',
  '#f4f4f4',
  '#b8322a',
  '#ff5fb0',
  '#3fb6ff',
  '#7c5cff',
  '#34d399',
  '#ff8a3d',
];

export const HAIR_STYLES = [
  'Bald',
  'Buzz Cut',
  'Spiky',
  'Side Part',
  'Long',
  'Afro',
  'Mohawk',
  'Bun',
  'Ponytail',
  'Curly',
  'Bob',
  'Braids',
  'Undercut',
  'Messy',
  'Pompadour',
];

export const EYE_STYLES = ['Dots', 'Wide', 'Sleepy', 'Focused', 'Happy'];
export const BROW_STYLES = ['Normal', 'Thick', 'Determined', 'Raised', 'None'];
export const MOUTH_STYLES = ['Smile', 'Neutral', 'Grin', 'Smirk', 'Open'];
export const FACIAL_STYLES = ['None', 'Stubble', 'Moustache', 'Goatee', 'Full Beard'];
export const GLASSES_STYLES = ['None', 'Round', 'Square', 'Shades', 'Visor'];
export const HAT_STYLES = ['None', 'Cap', 'Backwards Cap', 'Beanie', 'Bandana', 'Cat Ears'];
export const JERSEY_STYLES = ['Plain', 'Stripes', 'Sash', 'Split', 'Chevron', 'Hoops'];
export const BODY_TYPES = ['Slim', 'Average', 'Broad'];
export const ACCESSORIES = ['None', 'Chain', 'Wristbands', 'Earring', 'Face Paint'];

export const PANTS_COLORS = ['#1f2340', '#2d3a5c', '#3a3a3a', '#5b4636', '#6b7280', '#1e3a2f', '#d7d9de', '#7f1d1d'];
export const SHOE_COLORS = ['#f4f4f4', '#17171c', '#ff4d6d', '#22e4ff', '#ffc83d', '#9dff3b', '#ff2bd6', '#8b5cff', '#ff8a3d'];

export interface CosmeticOption {
  key: string;
  label: string;
  options: string[];
  swatches?: string[];
}
