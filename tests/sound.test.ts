import { beforeAll, describe, expect, it, vi } from 'vitest';
import { subscribe, type GameEvent } from '../src/engine/bus';
import { QUESTS } from '../src/data/quests';
import { updateQuests } from '../src/engine/quests';
import { foundedGame } from './fixtures';

/** A stand-in node: every method returns another stand-in, `connect` returns its target, and starts are counted. */
const started: string[] = [];
function fakeNode(kind: string): unknown {
  const target: Record<string, unknown> = {};
  return new Proxy(target, {
    get(_, key: string) {
      if (key === 'connect') return (to: unknown) => to;
      if (key === 'start') return () => started.push(kind);
      if (key === 'stop') return () => undefined;
      if (key === 'getChannelData') return () => new Float32Array(8);
      if (key in target) return target[key];
      if (key.startsWith('create')) return (...args: unknown[]) => fakeNode(key.replace('create', '') + String(args.length));
      // Params (gain, frequency, Q, detune, pan): objects whose methods do nothing.
      return new Proxy({ value: 0 }, { get: (p, k: string) => (k in p ? (p as Record<string, unknown>)[k] : () => undefined), set: () => true });
    },
    set(_, key: string, value) {
      target[key] = value;
      return true;
    },
  });
}

class FakeAudioContext {
  currentTime = 0;
  sampleRate = 8000;
  state = 'running';
  destination = fakeNode('destination');
  constructor() {
    return new Proxy(this, {
      get: (obj, key: string) => (key in obj ? (obj as never)[key] : key.startsWith('create') ? (...a: unknown[]) => fakeNode(key.replace('create', '') + String(a.length)) : undefined),
    });
  }
}

beforeAll(() => {
  (globalThis as { window?: unknown }).window = { AudioContext: FakeAudioContext };
});

describe('quest complete sound', () => {
  it('plays a layered jingle and ignores an immediate repeat', async () => {
    const { playSound } = await import('../src/ui/sound');
    started.length = 0;
    playSound('quest', 0.5);
    // A transient and a sub knock, four plucks (two oscillators each), a four-note chord (two each) and a bell (two).
    expect(started.length).toBeGreaterThanOrEqual(16);
    const first = started.length;
    playSound('quest', 0.5);
    expect(started.length).toBe(first);
  });

  it('is silent at zero volume', async () => {
    const { playSound } = await import('../src/ui/sound');
    vi.useFakeTimers();
    started.length = 0;
    playSound('quest', 0);
    vi.useRealTimers();
    expect(started.length).toBe(0);
  });
});

describe('quest complete event', () => {
  it('asks for the quest jingle, not the generic gold chime', () => {
    const s = foundedGame(0, 1);
    const heard: GameEvent[] = [];
    const off = subscribe((e) => heard.push(e));
    const def = QUESTS.find((q) => q.mode === 'delta')!;
    // Put the quest on the board with its metric already past the target since it began.
    s.quests.active = [{ id: def.id, base: def.metric(s) - def.target - 1, ready: false }];
    updateQuests(s);
    off();
    const toast = heard.find((e) => e.type === 'toast' && e.title.startsWith('Quest complete'));
    expect(toast && toast.type === 'toast' ? toast.sound : undefined).toBe('quest');
  });
});
