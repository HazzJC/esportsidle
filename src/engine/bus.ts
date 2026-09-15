import type { Buff, Tone } from './types';

export type GameEvent =
  | { type: 'toast'; title: string; body?: string; icon?: string; tone?: Tone }
  | { type: 'achievement'; id: string }
  | { type: 'buffStart'; buff: Buff }
  | { type: 'buffEnd'; buff: Buff }
  | { type: 'crowd' }
  | { type: 'drop'; kind: 'hype' | 'drama' }
  | { type: 'choice' };

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
