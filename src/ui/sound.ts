import { audioGraph, driveCurve, envelope, midiHz, noiseSource, panner, type AudioGraph } from './audio/core';

/**
 * Sound effects, synthesised to match the music: short, punchy and a little gritty. Each sound is a
 * few layers (a transient, a body, a tail with some reverb) rather than a single beep.
 */
export type SoundId =
  | 'click'
  | 'buy'
  | 'upgrade'
  | 'achievement'
  | 'drop'
  | 'dropClick'
  | 'dramaBad'
  | 'crowd'
  | 'win'
  | 'promote'
  | 'error'
  | 'legacy';

const lastPlayed = new Map<SoundId, number>();
const MIN_GAP_MS: Partial<Record<SoundId, number>> = { click: 30, buy: 45, win: 250, upgrade: 60 };

interface Voice {
  out: AudioNode;
  reverb: number;
}

/** A voice's output: panned into the sfx bus, with an optional reverb send. */
function voice(g: AudioGraph, gain: number, reverb = 0, pan = 0): Voice & { gain: GainNode } {
  const amp = g.ctx.createGain();
  amp.gain.value = gain;
  const p = panner(g.ctx, pan);
  amp.connect(p).connect(g.sfx);
  if (reverb > 0) {
    const send = g.ctx.createGain();
    send.gain.value = reverb;
    amp.connect(send).connect(g.reverb);
  }
  return { out: amp, gain: amp, reverb };
}

/** A two-operator FM bell: bright attack, metallic ring. */
function bell(g: AudioGraph, freq: number, start: number, decay: number, level: number, ratio = 3.5, index = 2.5, reverb = 0.25, pan = 0): void {
  const { ctx } = g;
  const carrier = ctx.createOscillator();
  const mod = ctx.createOscillator();
  const modGain = ctx.createGain();
  carrier.frequency.value = freq;
  mod.frequency.value = freq * ratio;
  modGain.gain.setValueAtTime(freq * index, start);
  modGain.gain.exponentialRampToValueAtTime(freq * 0.05, start + decay);
  mod.connect(modGain).connect(carrier.frequency);
  const env = ctx.createGain();
  envelope(env.gain, start, 1, 0.004, decay);
  const v = voice(g, level, reverb, pan);
  carrier.connect(env).connect(v.out);
  carrier.start(start);
  mod.start(start);
  carrier.stop(start + decay + 0.1);
  mod.stop(start + decay + 0.1);
}

/** A filtered saw pluck, the same family as the music's arp. */
function pluck(g: AudioGraph, freq: number, start: number, decay: number, level: number, bright = 3200, reverb = 0.2, pan = 0): void {
  const { ctx } = g;
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = freq;
  const osc2 = ctx.createOscillator();
  osc2.type = 'square';
  osc2.frequency.value = freq * 1.005;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 4;
  filter.frequency.setValueAtTime(bright, start);
  filter.frequency.exponentialRampToValueAtTime(260, start + decay);
  const env = ctx.createGain();
  envelope(env.gain, start, 1, 0.003, decay);
  const v = voice(g, level, reverb, pan);
  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(env).connect(v.out);
  for (const o of [osc, osc2]) {
    o.start(start);
    o.stop(start + decay + 0.1);
  }
}

/** A band of noise: taps, whooshes and crowd. Optional sweep of the band's centre. */
function hiss(g: AudioGraph, start: number, duration: number, level: number, from: number, to = from, q = 1, reverb = 0, pan = 0, attack = 0.002): void {
  const { ctx } = g;
  const src = noiseSource(g, start, duration);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = q;
  filter.frequency.setValueAtTime(from, start);
  filter.frequency.exponentialRampToValueAtTime(to, start + duration);
  const env = ctx.createGain();
  envelope(env.gain, start, 1, attack, Math.max(0.01, duration - attack));
  const v = voice(g, level, reverb, pan);
  src.connect(filter).connect(env).connect(v.out);
}

/** A sine drop in pitch: kicks, thumps and impacts. */
function thump(g: AudioGraph, start: number, from: number, to: number, decay: number, level: number, drive = 1.5): void {
  const { ctx } = g;
  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(to, start + decay * 0.6);
  const shaper = ctx.createWaveShaper();
  shaper.curve = driveCurve(drive);
  const env = ctx.createGain();
  envelope(env.gain, start, 1, 0.002, decay);
  const v = voice(g, level);
  osc.connect(shaper).connect(env).connect(v.out);
  osc.start(start);
  osc.stop(start + decay + 0.05);
}

/** A detuned saw chord through an opening filter: stabs and swells. */
function chord(g: AudioGraph, notes: number[], start: number, attack: number, decay: number, level: number, cutoff: [number, number], reverb = 0.4): void {
  const { ctx } = g;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 2;
  filter.frequency.setValueAtTime(cutoff[0], start);
  filter.frequency.exponentialRampToValueAtTime(cutoff[1], start + attack + decay * 0.3);
  const env = ctx.createGain();
  envelope(env.gain, start, 1, attack, decay);
  const v = voice(g, level, reverb);
  filter.connect(env).connect(v.out);
  for (const m of notes) {
    for (const detune of [-9, 9]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = midiHz(m);
      o.detune.value = detune;
      o.connect(filter);
      o.start(start);
      o.stop(start + attack + decay + 0.1);
    }
  }
}

export function playSound(id: SoundId, volume: number): void {
  if (volume <= 0) return;
  const gap = MIN_GAP_MS[id];
  const nowMs = typeof performance === 'undefined' ? Date.now() : performance.now();
  if (gap && nowMs - (lastPlayed.get(id) ?? 0) < gap) return;
  lastPlayed.set(id, nowMs);
  const g = audioGraph();
  if (!g) return;
  g.sfx.gain.value = volume;
  const t = g.ctx.currentTime + 0.005;
  const jitter = () => (Math.random() - 0.5) * 0.3;

  switch (id) {
    case 'click':
      // A tight tap: a bright transient over a small punchy body, never quite the same twice.
      hiss(g, t, 0.028, 0.35, 4200 + Math.random() * 1500, 2600, 1.4, 0, jitter());
      thump(g, t, 190 + Math.random() * 30, 80, 0.07, 0.35, 2);
      break;
    case 'buy':
      // Two bright metallic hits: the register.
      bell(g, midiHz(84), t, 0.18, 0.12, 3.01, 1.6, 0.15, -0.15);
      bell(g, midiHz(91), t + 0.05, 0.28, 0.1, 3.01, 1.4, 0.2, 0.15);
      hiss(g, t, 0.05, 0.08, 7000, 9000, 0.8);
      break;
    case 'upgrade':
      // A rising filtered sweep that lands on a chime.
      hiss(g, t, 0.22, 0.12, 600, 5200, 3, 0.15, 0, 0.18);
      pluck(g, midiHz(72), t + 0.14, 0.2, 0.12, 4200, 0.25);
      bell(g, midiHz(84), t + 0.17, 0.5, 0.09, 2.0, 1.2, 0.35);
      break;
    case 'achievement':
      // A synth stab over a sub hit, crowned with a bell run.
      thump(g, t, 110, 48, 0.4, 0.4, 1.3);
      chord(g, [60, 63, 67, 70], t, 0.01, 0.9, 0.09, [900, 5000], 0.5);
      [79, 82, 86, 91].forEach((m, i) => bell(g, midiHz(m), t + 0.07 + i * 0.07, 0.6, 0.07, 3.5, 1.8, 0.45, i % 2 ? 0.25 : -0.25));
      break;
    case 'drop':
      // Something appears: a quick upward whoosh and a glassy ping.
      hiss(g, t, 0.35, 0.1, 500, 7000, 2.5, 0.3, 0.3, 0.25);
      bell(g, midiHz(93), t + 0.28, 0.7, 0.07, 1.41, 2.2, 0.5, 0.3);
      break;
    case 'dropClick':
      [84, 88, 91, 96].forEach((m, i) => bell(g, midiHz(m), t + i * 0.035, 0.35, 0.08, 2.0, 1.5, 0.35, (i - 1.5) * 0.25));
      thump(g, t, 160, 60, 0.18, 0.25);
      break;
    case 'dramaBad': {
      // Bad drama outcome: a descending, gritty minor dissonance and heavy sub thump.
      thump(g, t, 140, 45, 0.45, 0.4, 2.5);
      hiss(g, t, 0.25, 0.14, 2200, 400, 2.5, 0.3, 0, 0.01);
      [63, 60, 56, 51].forEach((m, i) => pluck(g, midiHz(m), t + i * 0.06, 0.3, 0.12, 1800 - i * 300, 0.3, i % 2 === 0 ? -0.2 : 0.2));
      break;
    }
    case 'crowd': {
      // The crowd goes wild: a roar that swells and fades, over a riser and a boom.
      hiss(g, t, 1.6, 0.22, 700, 1400, 0.6, 0.4, -0.3, 0.35);
      hiss(g, t + 0.05, 1.6, 0.18, 1100, 900, 0.6, 0.4, 0.3, 0.4);
      hiss(g, t, 0.45, 0.1, 400, 6000, 4, 0.2, 0, 0.4);
      thump(g, t + 0.42, 90, 38, 0.8, 0.45, 2.2);
      chord(g, [53, 60, 65, 68], t + 0.42, 0.02, 1.1, 0.06, [600, 3500], 0.6);
      break;
    }
    case 'win':
      pluck(g, midiHz(76), t, 0.14, 0.1, 3800, 0.2, -0.2);
      pluck(g, midiHz(83), t + 0.07, 0.22, 0.1, 4500, 0.25, 0.2);
      break;
    case 'promote':
      thump(g, t, 120, 50, 0.3, 0.3);
      [65, 68, 72, 77, 80].forEach((m, i) => pluck(g, midiHz(m), t + i * 0.065, 0.28, 0.1, 3000 + i * 500, 0.3, (i - 2) * 0.2));
      break;
    case 'error': {
      // A short, dirty low buzz.
      const { ctx } = g;
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(82, t + 0.16);
      const osc2 = ctx.createOscillator();
      osc2.type = 'square';
      osc2.frequency.value = 116;
      const shaper = ctx.createWaveShaper();
      shaper.curve = driveCurve(4);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 900;
      const env = ctx.createGain();
      envelope(env.gain, t, 1, 0.005, 0.18);
      const v = voice(g, 0.08);
      osc.connect(shaper);
      osc2.connect(shaper);
      shaper.connect(filter).connect(env).connect(v.out);
      for (const o of [osc, osc2]) {
        o.start(t);
        o.stop(t + 0.25);
      }
      break;
    }
    case 'legacy':
      // Selling the org: a big cinematic impact and a slow chord.
      thump(g, t, 70, 30, 1.6, 0.55, 1.6);
      hiss(g, t, 2.2, 0.12, 300, 2400, 0.7, 0.8, 0, 0.02);
      chord(g, [41, 53, 56, 60, 63], t, 0.4, 2.4, 0.08, [300, 2400], 0.8);
      [77, 80, 84, 89].forEach((m, i) => bell(g, midiHz(m), t + 0.5 + i * 0.12, 1.2, 0.05, 3.5, 1.5, 0.7, (i - 1.5) * 0.3));
      break;
  }
}
