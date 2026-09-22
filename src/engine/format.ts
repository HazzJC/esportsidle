export type NumberFormat = 'short' | 'long' | 'scientific' | 'power';

let currentFormat: NumberFormat = 'short';

export function setNumberFormat(format: NumberFormat): void {
  currentFormat = format;
}

export function getNumberFormat(): NumberFormat {
  return currentFormat;
}

const BASIC_SHORT = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No'];
const BASIC_LONG = [
  '',
  'thousand',
  'million',
  'billion',
  'trillion',
  'quadrillion',
  'quintillion',
  'sextillion',
  'septillion',
  'octillion',
  'nonillion',
];
const UNIT_SHORT = ['', 'U', 'D', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'O', 'N'];
const TENS_SHORT = ['', 'Dc', 'Vg', 'Tg', 'Qag', 'Qig', 'Sxg', 'Spg', 'Og', 'Ng'];
const UNIT_LONG = ['', 'un', 'duo', 'tre', 'quattuor', 'quin', 'sex', 'septen', 'octo', 'novem'];
const TENS_LONG = [
  '',
  'decillion',
  'vigintillion',
  'trigintillion',
  'quadragintillion',
  'quinquagintillion',
  'sexagintillion',
  'septuagintillion',
  'octogintillion',
  'nonagintillion',
];

/** Suffix for 10^(3*group). Returns null when beyond centillion. */
export function suffixFor(group: number, long: boolean): string | null {
  if (group <= 10) return long ? BASIC_LONG[group] : BASIC_SHORT[group];
  const n = group - 1;
  if (n === 100) return long ? 'centillion' : 'Ce';
  if (n > 100) return null;
  const tens = Math.floor(n / 10);
  const unit = n % 10;
  return long ? UNIT_LONG[unit] + TENS_LONG[tens] : UNIT_SHORT[unit] + TENS_SHORT[tens];
}

function withCommas(int: number): string {
  return Math.floor(int)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function trimZeros(s: string): string {
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
}

function scientific(v: number): string {
  let e = Math.floor(Math.log10(v));
  let m = v / Math.pow(10, e);
  if (m >= 9.995) {
    m /= 10;
    e += 1;
  }
  return `${m.toFixed(2)}e${e}`;
}

const SUPERSCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹';

function superscript(n: number): string {
  return String(n)
    .replace(/\d/g, (d) => SUPERSCRIPT[Number(d)])
    .replace('-', '⁻');
}

/** 1.23 × 10¹⁵. The mantissa rounds down, like the suffix formats, so it never overstates. */
function powerOfTen(v: number): string {
  let e = Math.floor(Math.log10(v));
  let m = Math.floor((v / Math.pow(10, e)) * 100 + 1e-9) / 100;
  if (m >= 10) {
    m /= 10;
    e += 1;
  }
  return `${m.toFixed(2)} × 10${superscript(e)}`;
}

/**
 * Formats a number for display.
 * @param decimals decimals shown for small values (< 100)
 */
export function fmt(value: number, decimals = 0, format: NumberFormat = currentFormat): string {
  if (Number.isNaN(value)) return '0';
  if (!Number.isFinite(value)) return value > 0 ? '∞' : '-∞';
  const sign = value < 0 ? '-' : '';
  const v = Math.abs(value);

  if (v < 1000) {
    const d = v < 100 ? decimals : 0;
    if (d === 0) return sign + Math.floor(v + 1e-9).toString();
    const p = Math.pow(10, d);
    return sign + trimZeros((Math.floor(v * p + 1e-9) / p).toFixed(d));
  }
  if (format === 'scientific') {
    return sign + (v < 1e6 ? withCommas(v) : scientific(v));
  }
  if (format === 'power') {
    return sign + (v < 1e6 ? withCommas(v) : powerOfTen(v));
  }
  if (v < 1e6) return sign + withCommas(v);

  let group = Math.floor(Math.log10(v) / 3);
  let mantissa = v / Math.pow(10, group * 3);
  if (mantissa >= 1000) {
    group += 1;
    mantissa /= 1000;
  } else if (mantissa < 1) {
    group -= 1;
    mantissa *= 1000;
  }
  // Round down so the displayed value never exceeds the real one (avoids "can afford" confusion).
  let text = (Math.floor(mantissa * 100) / 100).toFixed(2);
  if (parseFloat(text) >= 1000) {
    group += 1;
    text = (Math.floor((mantissa / 1000) * 100) / 100).toFixed(2);
  }
  const suffix = suffixFor(group, format === 'long');
  if (suffix === null) return sign + scientific(v);
  return `${sign}${text}${format === 'long' ? ' ' : ' '}${suffix}`;
}

/**
 * Formats a dollar amount. Anything between zero and a dollar shows its cents, so a first prize of
 * 99 cents reads as $0.99 rather than a flat $0.
 */
export function money(value: number, decimals = 0): string {
  if (value > 0 && value < 1) return value < 0.01 ? '<$0.01' : `$${(Math.floor(value * 100) / 100).toFixed(2)}`;
  return `$${fmt(value, decimals)}`;
}

/** Formats a duration in seconds. */
export function fmtTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '∞';
  const s = Math.max(0, Math.floor(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  if (d < 365) return `${d}d ${h % 24}h`;
  return `${fmt(Math.floor(d / 365))}y ${d % 365}d`;
}

/** Formats a multiplier/ratio as a percentage string: 0.25 -> "+25%". */
export function fmtPct(ratio: number, signed = false, decimals = 0): string {
  const pct = ratio * 100;
  const body = Math.abs(pct) >= 1000 ? fmt(Math.abs(pct)) : Math.abs(pct).toFixed(decimals);
  const sign = pct < 0 ? '-' : signed ? '+' : '';
  return `${sign}${body}%`;
}
