import { audioGraph, driveCurve, envelope, existingGraph, impulse, midiHz, noiseSource, panner, type AudioGraph } from './core';

/**
 * "Night Shift": an original, generative industrial half-time track, synthesised live. Drum and bass
 * tempo with half-time drums, a detuned reese bass over a sub, pads, and an arpeggio that builds
 * through the intro. The arrangement loops forever, and each pass varies its drum fills and bass
 * rhythms, so it never plays the same way twice.
 *
 * Scheduling follows the usual WebAudio pattern: a short timer looks a fraction of a second ahead
 * and schedules every sixteenth note that falls inside that window at an exact audio-clock time.
 */

const BPM = 170;
const STEP = 60 / BPM / 4;
const STEPS_PER_BAR = 16;
const LOOKAHEAD = 0.18;
const TICK_MS = 30;

type SectionId = 'intro' | 'build' | 'dropA' | 'break' | 'build2' | 'dropB';
const SECTIONS: { id: SectionId; bars: number }[] = [
  { id: 'intro', bars: 8 },
  { id: 'build', bars: 8 },
  { id: 'dropA', bars: 16 },
  { id: 'break', bars: 8 },
  { id: 'build2', bars: 4 },
  { id: 'dropB', bars: 16 },
];
/** After the first pass the song loops from the breakdown. */
const LOOP_FROM = 3;

/** F minor: Fm, Db, Ab, Eb, two bars each. Roots for the bass, tones for pads and the arp. */
const CHORDS = [
  { root: 29, tones: [53, 56, 60, 65] },
  { root: 37, tones: [49, 53, 56, 61] },
  { root: 32, tones: [56, 60, 63, 68] },
  { root: 39, tones: [51, 55, 58, 63] },
];

/** Bass rhythms: [start step, length in steps, octave shift]. */
const BASS_A: [number, number, number][] = [
  [0, 6, 0],
  [7, 3, 0],
  [11, 5, 0],
];
const BASS_B: [number, number, number][] = [
  [0, 3, 0],
  [3, 2, 12],
  [6, 4, 0],
  [10, 2, 12],
  [12, 4, 0],
];
const ARP_ORDER = [0, 1, 2, 3, 2, 1, 3, 2];

interface Chain {
  g: AudioGraph;
  /** Every voice connects here. */
  input: GainNode;
  reverb: GainNode;
  delay: GainNode;
}

let chain: Chain | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let step = 0;
let nextTime = 0;
let volume = 0.35;
let hidden = false;

function buildChain(g: AudioGraph): Chain {
  const { ctx } = g;
  const input = ctx.createGain();
  input.gain.value = 0.8;
  input.connect(g.music);

  const convolver = ctx.createConvolver();
  convolver.buffer = impulse(ctx, 3.4, 2.6);
  const reverb = ctx.createGain();
  reverb.gain.value = 0.8;
  reverb.connect(convolver).connect(input);

  // A dotted-eighth echo, darkened a little on every repeat.
  const delay = ctx.createGain();
  const line = ctx.createDelay(2);
  line.delayTime.value = STEP * 3;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.38;
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 2600;
  delay.connect(line);
  line.connect(tone).connect(feedback).connect(line);
  tone.connect(input);
  return { g, input, reverb, delay };
}

function section(bar: number): { id: SectionId; barIn: number; bars: number; pass: number } {
  let b = bar;
  let pass = 0;
  let i = 0;
  while (b >= SECTIONS[i].bars) {
    b -= SECTIONS[i].bars;
    i++;
    if (i >= SECTIONS.length) {
      i = LOOP_FROM;
      pass++;
    }
  }
  return { id: SECTIONS[i].id, barIn: b, bars: SECTIONS[i].bars, pass };
}

/** A voice's output into the music chain, with optional reverb and echo sends. */
function out(c: Chain, level: number, reverb = 0, echo = 0, pan = 0): GainNode {
  const { ctx } = c.g;
  const amp = ctx.createGain();
  amp.gain.value = level;
  amp.connect(panner(ctx, pan)).connect(c.input);
  if (reverb > 0) {
    const s = ctx.createGain();
    s.gain.value = reverb;
    amp.connect(s).connect(c.reverb);
  }
  if (echo > 0) {
    const s = ctx.createGain();
    s.gain.value = echo;
    amp.connect(s).connect(c.delay);
  }
  return amp;
}

// ---------------------------------------------------------------------------
// Instruments
// ---------------------------------------------------------------------------

function kick(c: Chain, t: number, level = 0.9): void {
  const { ctx } = c.g;
  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(165, t);
  osc.frequency.exponentialRampToValueAtTime(44, t + 0.11);
  const shaper = ctx.createWaveShaper();
  shaper.curve = driveCurve(2.4);
  const env = ctx.createGain();
  envelope(env.gain, t, 1, 0.002, 0.36);
  osc.connect(shaper).connect(env).connect(out(c, level));
  osc.start(t);
  osc.stop(t + 0.45);
  // The beater click.
  const click = noiseSource(c.g, t, 0.012);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 3000;
  const cenv = ctx.createGain();
  envelope(cenv.gain, t, 1, 0.001, 0.012);
  click.connect(hp).connect(cenv).connect(out(c, level * 0.25));
}

function snare(c: Chain, t: number, level = 0.55): void {
  const { ctx } = c.g;
  const n = noiseSource(c.g, t, 0.3);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1900;
  bp.Q.value = 0.7;
  const nenv = ctx.createGain();
  envelope(nenv.gain, t, 1, 0.002, 0.24);
  n.connect(bp).connect(nenv).connect(out(c, level, 0.35));
  const body = ctx.createOscillator();
  body.type = 'triangle';
  body.frequency.setValueAtTime(210, t);
  body.frequency.exponentialRampToValueAtTime(170, t + 0.08);
  const benv = ctx.createGain();
  envelope(benv.gain, t, 1, 0.002, 0.1);
  body.connect(benv).connect(out(c, level * 0.7));
  body.start(t);
  body.stop(t + 0.15);
  // An industrial ring on top.
  const ring = noiseSource(c.g, t, 0.2);
  const rf = ctx.createBiquadFilter();
  rf.type = 'bandpass';
  rf.frequency.value = 3300;
  rf.Q.value = 14;
  const renv = ctx.createGain();
  envelope(renv.gain, t, 1, 0.002, 0.18);
  ring.connect(rf).connect(renv).connect(out(c, level * 0.9, 0.3, 0, 0.1));
}

function hat(c: Chain, t: number, level: number, open = false): void {
  const { ctx } = c.g;
  const n = noiseSource(c.g, t, open ? 0.14 : 0.04);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = open ? 6500 : 8000;
  const env = ctx.createGain();
  envelope(env.gain, t, 1, 0.001, open ? 0.13 : 0.035);
  n.connect(hp).connect(env).connect(out(c, level, 0.05, 0, open ? 0.2 : -0.15));
}

/** A clanking metal hit: inharmonic FM, panned somewhere different each time. */
function metal(c: Chain, t: number, level: number): void {
  const { ctx } = c.g;
  const car = ctx.createOscillator();
  const mod = ctx.createOscillator();
  const mg = ctx.createGain();
  const f = 420 + Math.random() * 180;
  car.frequency.value = f;
  mod.frequency.value = f * 1.414;
  mg.gain.setValueAtTime(f * 4, t);
  mg.gain.exponentialRampToValueAtTime(f * 0.2, t + 0.3);
  mod.connect(mg).connect(car.frequency);
  const env = ctx.createGain();
  envelope(env.gain, t, 1, 0.002, 0.32);
  car.connect(env).connect(out(c, level, 0.35, 0.3, (Math.random() - 0.5) * 1.2));
  for (const o of [car, mod]) {
    o.start(t);
    o.stop(t + 0.4);
  }
}

/** The reese: detuned saws through a moving low-pass, driven hard, over a clean sine sub. */
function reese(c: Chain, t: number, midi: number, dur: number, level: number, wobble: number): void {
  const { ctx } = c.g;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 7;
  filter.frequency.setValueAtTime(160, t);
  filter.frequency.exponentialRampToValueAtTime(420 + wobble * 900, t + dur * 0.35);
  filter.frequency.exponentialRampToValueAtTime(220, t + dur);
  const shaper = ctx.createWaveShaper();
  shaper.curve = driveCurve(3.2);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(1, t + 0.01);
  env.gain.setValueAtTime(1, t + Math.max(0.02, dur - 0.05));
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  filter.connect(shaper).connect(env).connect(out(c, level));
  for (const [detune, gain, octave] of [
    [-16, 1, 0],
    [16, 1, 0],
    [0, 0.35, 12],
  ] as const) {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = midiHz(midi + octave);
    o.detune.value = detune;
    const og = ctx.createGain();
    og.gain.value = gain;
    o.connect(og).connect(filter);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  const sub = ctx.createOscillator();
  sub.frequency.value = midiHz(midi - 12);
  const senv = ctx.createGain();
  senv.gain.setValueAtTime(0.0001, t);
  senv.gain.exponentialRampToValueAtTime(1, t + 0.01);
  senv.gain.setValueAtTime(1, t + Math.max(0.02, dur - 0.04));
  senv.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  sub.connect(senv).connect(out(c, level * 1.3));
  sub.start(t);
  sub.stop(t + dur + 0.05);
}

/** A held sub note under the quieter sections. */
function drone(c: Chain, t: number, midi: number, dur: number, level: number): void {
  const { ctx } = c.g;
  const o = ctx.createOscillator();
  o.frequency.value = midiHz(midi);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(1, t + 0.4);
  env.gain.setValueAtTime(1, t + dur - 0.4);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(env).connect(out(c, level));
  o.start(t);
  o.stop(t + dur + 0.05);
}

function pad(c: Chain, t: number, tones: number[], dur: number, level: number, cutoff: number): void {
  const { ctx } = c.g;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = cutoff;
  filter.Q.value = 0.8;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(1, t + 0.9);
  env.gain.setValueAtTime(1, t + dur - 0.2);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur + 1.2);
  filter.connect(env).connect(out(c, level, 0.7));
  for (const m of tones) {
    for (const detune of [-8, 7]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = midiHz(m);
      o.detune.value = detune;
      o.connect(filter);
      o.start(t);
      o.stop(t + dur + 1.3);
    }
  }
}

function arp(c: Chain, t: number, midi: number, level: number, cutoff: number): void {
  const { ctx } = c.g;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 6;
  filter.frequency.setValueAtTime(cutoff, t);
  filter.frequency.exponentialRampToValueAtTime(Math.max(200, cutoff * 0.18), t + 0.16);
  const env = ctx.createGain();
  envelope(env.gain, t, 1, 0.002, 0.2);
  filter.connect(env).connect(out(c, level, 0.2, 0.45, (Math.random() - 0.5) * 0.4));
  const o = ctx.createOscillator();
  o.type = 'sawtooth';
  o.frequency.value = midiHz(midi);
  const o2 = ctx.createOscillator();
  o2.type = 'square';
  o2.frequency.value = midiHz(midi) * 1.004;
  for (const osc of [o, o2]) {
    osc.connect(filter);
    osc.start(t);
    osc.stop(t + 0.3);
  }
}

/** A noise sweep that rises across a build and stops dead at the drop. */
function riser(c: Chain, t: number, dur: number, level: number): void {
  const { ctx } = c.g;
  const n = noiseSource(c.g, t, dur);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 2;
  bp.frequency.setValueAtTime(300, t);
  bp.frequency.exponentialRampToValueAtTime(8000, t + dur);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(1, t + dur * 0.95);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(bp).connect(env).connect(out(c, level, 0.3));
}

/** The downbeat of a drop: a deep boom and a crash tail. */
function impact(c: Chain, t: number): void {
  const { ctx } = c.g;
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(90, t);
  o.frequency.exponentialRampToValueAtTime(30, t + 0.9);
  const env = ctx.createGain();
  envelope(env.gain, t, 1, 0.003, 1.3);
  o.connect(env).connect(out(c, 0.7));
  o.start(t);
  o.stop(t + 1.4);
  const n = noiseSource(c.g, t, 1.6);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 2500;
  const nenv = ctx.createGain();
  envelope(nenv.gain, t, 1, 0.003, 1.5);
  n.connect(hp).connect(nenv).connect(out(c, 0.16, 0.8));
}

// ---------------------------------------------------------------------------
// Arrangement
// ---------------------------------------------------------------------------

function scheduleStep(c: Chain, n: number, t: number): void {
  const bar = Math.floor(n / STEPS_PER_BAR);
  const s = n % STEPS_PER_BAR;
  const sec = section(bar);
  const chord = CHORDS[Math.floor(bar / 2) % CHORDS.length];
  const barStart = s === 0;
  const chordStart = barStart && bar % 2 === 0;
  const twoBars = STEP * STEPS_PER_BAR * 2;
  const progress = (sec.barIn * STEPS_PER_BAR + s) / (sec.bars * STEPS_PER_BAR);
  const arpNote = () => chord.tones[ARP_ORDER[s % ARP_ORDER.length]] + (s >= 8 ? 12 : 0);

  switch (sec.id) {
    case 'intro': {
      if (chordStart) {
        pad(c, t, chord.tones, twoBars, 0.035, 700 + progress * 900);
        drone(c, t, chord.root + 12, twoBars, 0.12);
      }
      // The arp fades in and its filter opens bar by bar.
      arp(c, t, arpNote(), 0.03 + progress * 0.05, 500 + progress * 1800);
      if (sec.barIn >= 4 && s % 2 === 0) hat(c, t, s % 4 === 2 ? 0.07 : 0.035);
      break;
    }
    case 'build':
    case 'build2': {
      if (chordStart) pad(c, t, chord.tones, twoBars, 0.035, 1200 + progress * 1500);
      if (barStart && sec.barIn === 0) riser(c, t, STEP * STEPS_PER_BAR * sec.bars, 0.13);
      arp(c, t, arpNote(), 0.08, 1800 + progress * 3600);
      hat(c, t, s % 4 === 2 ? 0.1 : 0.05, s % 8 === 6);
      if (s % 4 === 0) kick(c, t, 0.55 + progress * 0.3);
      // A snare roll through the last bars, doubling up at the very end.
      const barsLeft = sec.bars - sec.barIn;
      if (barsLeft <= 2 && (barsLeft === 1 ? true : s % 2 === 0)) snare(c, t, 0.18 + progress * 0.35);
      else if (s === 4 || s === 12) snare(c, t, 0.3);
      break;
    }
    case 'dropA':
    case 'dropB': {
      const b = sec.id === 'dropB';
      if (barStart && sec.barIn === 0) impact(c, t);
      if (chordStart) pad(c, t, chord.tones, twoBars, 0.018, 900);
      // Half-time drums: kick on one, snare on three, with ghost kicks that move each pass.
      if (s === 0 || s === 10 || (bar % 2 === 1 && s === 7 && sec.pass % 2 === 0)) kick(c, t);
      if (s === 8) snare(c, t);
      if (b && s === 13 && bar % 2 === 1) snare(c, t, 0.18);
      hat(c, t, s % 4 === 2 ? 0.09 : 0.04, s === 14);
      if (s === 14 && bar % (b ? 2 : 4) === 3) metal(c, t, 0.06);
      const pattern = b ? BASS_B : BASS_A;
      const hit = pattern.find(([at]) => at === s);
      if (hit) {
        const [, len, octave] = hit;
        reese(c, t, chord.root + 12 + octave, len * STEP, 0.16, b ? 0.9 : 0.5 + (sec.barIn % 4) * 0.12);
      }
      if (b) arp(c, t, arpNote(), 0.025, 2400);
      break;
    }
    case 'break': {
      if (chordStart) {
        pad(c, t, chord.tones, twoBars, 0.045, 1600);
        drone(c, t, chord.root + 12, twoBars, 0.1);
      }
      arp(c, t, arpNote(), 0.05, 1300);
      if (s % 4 === 2) hat(c, t, 0.05);
      if (s === 0 && sec.barIn % 4 === 3) metal(c, t, 0.05);
      break;
    }
  }
}

function tick(): void {
  if (!chain || hidden) return;
  const now = chain.g.ctx.currentTime;
  // After a stall (a hidden tab), skip the missed steps and rejoin on the beat grid.
  if (nextTime < now) {
    const missed = Math.ceil((now - nextTime) / STEP);
    step += missed;
    nextTime += missed * STEP;
  }
  while (nextTime < now + LOOKAHEAD) {
    scheduleStep(chain, step, nextTime);
    step++;
    nextTime += STEP;
  }
}

export function musicPlaying(): boolean {
  return timer !== null;
}

/** Starts the track from the top. Call from a user gesture the first time, or browsers block it. */
export function startMusic(vol: number): void {
  const g = audioGraph();
  if (!g) return;
  volume = vol;
  g.music.gain.setTargetAtTime(volume, g.ctx.currentTime, 0.05);
  chain ??= buildChain(g);
  if (timer) return;
  step = 0;
  nextTime = g.ctx.currentTime + 0.1;
  timer = setInterval(tick, TICK_MS);
  tick();
}

export function stopMusic(): void {
  if (timer) clearInterval(timer);
  timer = null;
  const g = existingGraph();
  // Fade rather than cut, so held notes do not click.
  if (g) g.music.gain.setTargetAtTime(0.0001, g.ctx.currentTime, 0.15);
}

export function setMusicVolume(vol: number): void {
  volume = vol;
  const g = existingGraph();
  if (g && timer) g.music.gain.setTargetAtTime(volume, g.ctx.currentTime, 0.05);
}

/** Pauses scheduling while the tab is hidden, and picks up again when it returns. */
export function pauseMusicForVisibility(isHidden: boolean): void {
  hidden = isHidden;
  const g = existingGraph();
  if (!g || !timer) return;
  if (isHidden) g.music.gain.setTargetAtTime(0.0001, g.ctx.currentTime, 0.1);
  else g.music.gain.setTargetAtTime(volume, g.ctx.currentTime, 0.2);
}
