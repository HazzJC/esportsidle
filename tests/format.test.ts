import { describe, expect, it } from 'vitest';
import { fmt, fmtPct, fmtTime, suffixFor } from '../src/engine/format';

describe('fmt', () => {
  it('formats small numbers', () => {
    expect(fmt(0)).toBe('0');
    expect(fmt(7.9)).toBe('7');
    expect(fmt(7.25, 1)).toBe('7.2');
    expect(fmt(999)).toBe('999');
  });

  it('uses commas below a million', () => {
    expect(fmt(1234)).toBe('1,234');
    expect(fmt(999_999)).toBe('999,999');
  });

  it('uses short suffixes', () => {
    expect(fmt(1_000_000)).toBe('1.00 M');
    expect(fmt(1_234_567)).toBe('1.23 M');
    expect(fmt(12_345_678_901)).toBe('12.34 B');
    expect(fmt(1e15)).toBe('1.00 Qa');
    expect(fmt(1e33)).toBe('1.00 Dc');
    expect(fmt(1e36)).toBe('1.00 UDc');
    expect(fmt(1e63)).toBe('1.00 Vg');
  });

  it('never rounds up past the real value', () => {
    expect(fmt(999_999_999)).toBe('999.99 M');
  });

  it('supports long and scientific formats', () => {
    expect(fmt(2.5e9, 0, 'long')).toBe('2.50 billion');
    expect(fmt(1e36, 0, 'long')).toBe('1.00 undecillion');
    expect(fmt(1.5e20, 0, 'scientific')).toBe('1.50e20');
  });

  it('falls back to scientific beyond centillion', () => {
    expect(suffixFor(101, false)).toBe('Ce');
    expect(fmt(1e306)).toBe('1.00e306');
  });

  it('handles non-finite values', () => {
    expect(fmt(Infinity)).toBe('∞');
    expect(fmt(NaN)).toBe('0');
  });
});

describe('fmtTime / fmtPct', () => {
  it('formats durations', () => {
    expect(fmtTime(5)).toBe('5s');
    expect(fmtTime(125)).toBe('2m 5s');
    expect(fmtTime(3 * 3600 + 61)).toBe('3h 1m');
    expect(fmtTime(2 * 86400 + 3600)).toBe('2d 1h');
  });

  it('formats percentages', () => {
    expect(fmtPct(0.25, true)).toBe('+25%');
    expect(fmtPct(-0.5)).toBe('-50%');
  });
});
