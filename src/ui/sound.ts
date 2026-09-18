/** Tiny WebAudio synthesiser for UI sound effects (no audio files needed). */
export type SoundId =
  | 'click'
  | 'buy'
  | 'upgrade'
  | 'achievement'
  | 'drop'
  | 'dropClick'
  | 'crowd'
  | 'win'
  | 'promote'
  | 'error'
  | 'legacy';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const lastPlayed = new Map<SoundId, number>();
const MIN_GAP_MS: Partial<Record<SoundId, number>> = { click: 35, buy: 40, win: 250 };

function audio(volume: number): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  if (master) master.gain.value = volume;
  return ctx;
}

function tone(ac: AudioContext, freq: number, start: number, duration: number, type: OscillatorType, gain: number, slideTo?: number): void {
  if (!master) return;
  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(gain, start + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(env).connect(master);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function noise(ac: AudioContext, start: number, duration: number, gain: number): void {
  if (!master) return;
  const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * duration), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ac.createBufferSource();
  const env = ac.createGain();
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1200;
  src.buffer = buffer;
  env.gain.value = gain;
  src.connect(filter).connect(env).connect(master);
  src.start(start);
}

function sequence(ac: AudioContext, notes: number[], step: number, duration: number, type: OscillatorType, gain: number): void {
  const now = ac.currentTime;
  notes.forEach((f, i) => tone(ac, f, now + i * step, duration, type, gain));
}

export function playSound(id: SoundId, volume: number): void {
  if (volume <= 0) return;
  const gap = MIN_GAP_MS[id];
  const now = typeof performance === 'undefined' ? Date.now() : performance.now();
  if (gap && now - (lastPlayed.get(id) ?? 0) < gap) return;
  lastPlayed.set(id, now);
  const ac = audio(volume);
  if (!ac) return;
  const t = ac.currentTime;
  switch (id) {
    case 'click':
      tone(ac, 880 + Math.random() * 120, t, 0.05, 'square', 0.05, 620);
      break;
    case 'buy':
      sequence(ac, [523, 784], 0.045, 0.07, 'triangle', 0.08);
      break;
    case 'upgrade':
      sequence(ac, [523, 659, 784, 1046], 0.045, 0.09, 'triangle', 0.08);
      break;
    case 'achievement':
      sequence(ac, [659, 784, 988, 1319], 0.08, 0.18, 'sine', 0.12);
      break;
    case 'drop':
      tone(ac, 1318, t, 0.18, 'sine', 0.08, 1760);
      tone(ac, 1976, t + 0.09, 0.2, 'sine', 0.05);
      break;
    case 'dropClick':
      sequence(ac, [784, 1175, 1568], 0.05, 0.09, 'square', 0.06);
      break;
    case 'crowd':
      noise(ac, t, 0.7, 0.25);
      tone(ac, 220, t, 0.5, 'sawtooth', 0.04, 330);
      break;
    case 'win':
      sequence(ac, [659, 988], 0.06, 0.1, 'triangle', 0.05);
      break;
    case 'promote':
      sequence(ac, [392, 523, 659, 784], 0.07, 0.14, 'triangle', 0.1);
      break;
    case 'error':
      tone(ac, 196, t, 0.14, 'sawtooth', 0.06, 147);
      break;
    case 'legacy':
      [261.6, 329.6, 392, 523.3].forEach((f) => tone(ac, f, t, 0.9, 'sine', 0.07));
      break;
  }
}
