/**
 * Shared WebAudio graph for sound effects and music. Everything is synthesised at runtime, so the
 * game ships no audio files. Two volume buses (sfx, music) run into a gentle compressor. Sound
 * effects send to a generated reverb that returns through the sfx bus, so its tail follows the
 * effects volume; the music builds its own reverb the same way.
 */

export interface AudioGraph {
  ctx: AudioContext;
  sfx: GainNode;
  music: GainNode;
  /** Send sound effects here for space; it returns through the sfx bus. */
  reverb: GainNode;
  noise: AudioBuffer;
}

let graph: AudioGraph | null = null;

export function impulse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
  }
  return buffer;
}

/** The audio graph, created on first use. Browsers only allow sound after a user gesture. */
export function audioGraph(): AudioGraph | null {
  if (typeof window === 'undefined') return null;
  if (!graph) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    const ctx = new Ctor();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 12;
    comp.ratio.value = 3;
    comp.attack.value = 0.004;
    comp.release.value = 0.2;
    comp.connect(ctx.destination);

    const sfx = ctx.createGain();
    const music = ctx.createGain();
    sfx.connect(comp);
    music.connect(comp);

    const convolver = ctx.createConvolver();
    convolver.buffer = impulse(ctx, 2.6, 3.2);
    const reverb = ctx.createGain();
    reverb.gain.value = 0.9;
    reverb.connect(convolver).connect(sfx);

    const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    graph = { ctx, sfx, music, reverb, noise };
  }
  if (graph.ctx.state === 'suspended') void graph.ctx.resume();
  return graph;
}

/** The graph only if it already exists, for callers that must not create it (no user gesture yet). */
export function existingGraph(): AudioGraph | null {
  return graph;
}

export const midiHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

const curves = new Map<number, Float32Array<ArrayBuffer>>();

/** A soft-clipping curve for grit; higher drive is dirtier. */
export function driveCurve(drive: number): Float32Array<ArrayBuffer> {
  const key = Math.round(drive * 10);
  let curve = curves.get(key);
  if (!curve) {
    curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) {
      const x = (i / (curve.length - 1)) * 2 - 1;
      curve[i] = Math.tanh(x * drive) / Math.tanh(drive);
    }
    curves.set(key, curve);
  }
  return curve;
}

/** An envelope on a gain param: quick attack to `peak`, exponential fall to silence over `decay`. */
export function envelope(param: AudioParam, start: number, peak: number, attack: number, decay: number): void {
  param.cancelScheduledValues(start);
  param.setValueAtTime(0.0001, start);
  param.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + attack);
  param.exponentialRampToValueAtTime(0.0001, start + attack + decay);
}

/** A slice of the shared noise buffer as a one-shot source. */
export function noiseSource(g: AudioGraph, start: number, duration: number): AudioBufferSourceNode {
  const src = g.ctx.createBufferSource();
  src.buffer = g.noise;
  src.loop = true;
  src.start(start, Math.random() * 1.5);
  src.stop(start + duration + 0.05);
  return src;
}

/** Stereo placement, when the browser supports it. */
export function panner(ctx: AudioContext, pan: number): AudioNode {
  if (typeof ctx.createStereoPanner !== 'function') return ctx.createGain();
  const p = ctx.createStereoPanner();
  p.pan.value = pan;
  return p;
}
