import type { Buff, NotifyChannel, Tone } from './types';

export type GameEvent =
  | { type: 'toast'; title: string; body?: string; icon?: string; tone?: Tone; channel?: NotifyChannel }
  | { type: 'achievement'; id: string }
  | { type: 'buffStart'; buff: Buff }
  | { type: 'buffEnd'; buff: Buff }
  | { type: 'crowd' }
  | { type: 'hypeChain' }
  | { type: 'drop'; kind: 'hype' | 'drama' }
  | { type: 'choice' }
  /** The org can be sold for the first time. */
  | { type: 'saleReady' }
  /** A centre tab has just opened. */
  | { type: 'section'; id: string; text: string };

type Listener = (event: GameEvent) => void;

const listeners = new Set<Listener>();

export function emit(event: GameEvent): void {
  for (const listener of listeners) listener(event);
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
