import LZString from 'lz-string';
import { GAMES } from '../data/games';
import { createFounder } from './players';
import { Rng } from './rng';
import { SAVE_VERSION, createBaseState, setupNewRun } from './state';
import { createTeam } from './teams';
import type { GameState } from './types';

export const SAVE_KEY = 'esportsidle.save';
export const BACKUP_KEYS = ['esportsidle.backup.0', 'esportsidle.backup.1', 'esportsidle.backup.2'];
export const BACKUP_TIME_KEY = 'esportsidle.backup.time';
export const CORRUPT_KEY = 'esportsidle.corrupt';
export const BACKUP_INTERVAL_MS = 10 * 60 * 1000;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

type Json = Record<string, unknown>;

/** Migrations keyed by the version they upgrade FROM. */
const MIGRATIONS: Record<number, (raw: Json) => void> = {
  // v1 -> v2 added players, teams and games. Static fields come from defaults; the founder and
  // starting team are created by repairState.
  1: () => {},
};

function isPlainObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function encodeSave(s: GameState): string {
  return `ESI${SAVE_VERSION}.${LZString.compressToBase64(JSON.stringify(s))}`;
}

/** Fills missing or invalid fields from `defaults`, keeping extra keys (e.g. dynamic records) from `value`. */
export function mergeDefaults(defaults: unknown, value: unknown): unknown {
  if (value === undefined) return defaults;
  if (defaults === null) return value;
  if (isPlainObject(defaults)) {
    if (!isPlainObject(value)) return defaults;
    const out: Json = { ...value };
    for (const key of Object.keys(defaults)) out[key] = mergeDefaults(defaults[key], value[key]);
    return out;
  }
  if (Array.isArray(defaults)) return Array.isArray(value) ? value : defaults;
  if (typeof defaults !== typeof value) return defaults;
  if (typeof value === 'number' && !Number.isFinite(value)) return defaults;
  return value;
}

export function migrate(raw: Json, fromVersion: number): Json {
  if (fromVersion > SAVE_VERSION) throw new Error('This save comes from a newer version of Esports Idle.');
  for (let v = fromVersion; v < SAVE_VERSION; v++) MIGRATIONS[v]?.(raw);
  raw.version = SAVE_VERSION;
  return raw;
}

export function decodeSave(text: string): GameState {
  const clean = text.trim().replace(/\s+/g, '');
  const match = /^ESI(\d+)\.(.+)$/.exec(clean);
  if (!match) throw new Error('That doesn’t look like an Esports Idle save.');
  const json = LZString.decompressFromBase64(match[2]);
  if (!json) throw new Error('The save data is corrupted.');
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error('The save data is corrupted.');
  }
  if (!isPlainObject(raw)) throw new Error('The save data is corrupted.');
  const migrated = migrate(raw, Number(match[1]));
  const createdAt = typeof migrated.createdAt === 'number' ? migrated.createdAt : Date.now();
  const state = mergeDefaults(createBaseState(createdAt), migrated) as GameState;
  repairState(state);
  return state;
}

/** Fills defaults inside dynamic records and restores invariants (founder, starting team). */
export function repairState(s: GameState): void {
  if (!s.players.founder && !s.teams.smash) {
    setupNewRun(s);
    return;
  }
  const template = createFounder(new Rng({ rng: 1 }), 'Template');
  for (const [id, p] of Object.entries(s.players)) {
    s.players[id] = mergeDefaults(template, p) as GameState['players'][string];
  }
  for (const game of GAMES) {
    const team = s.teams[game.id];
    if (team) s.teams[game.id] = mergeDefaults(createTeam(game.id), team) as GameState['teams'][string];
    else if (s.games[game.id]?.unlocked) s.teams[game.id] = createTeam(game.id);
  }
}

/** Writes the save, rotating backups at most every 10 minutes. */
export function writeSave(storage: StorageLike, s: GameState, now: number = Date.now()): string {
  s.lastSaved = now;
  const data = encodeSave(s);
  storage.setItem(SAVE_KEY, data);
  const lastBackup = Number(storage.getItem(BACKUP_TIME_KEY) ?? 0);
  if (now - lastBackup >= BACKUP_INTERVAL_MS) {
    for (let i = BACKUP_KEYS.length - 1; i > 0; i--) {
      const prev = storage.getItem(BACKUP_KEYS[i - 1]);
      if (prev) storage.setItem(BACKUP_KEYS[i], prev);
    }
    storage.setItem(BACKUP_KEYS[0], data);
    storage.setItem(BACKUP_TIME_KEY, String(now));
  }
  return data;
}

export interface LoadResult {
  state: GameState | null;
  source: string | null;
  error?: string;
}

/** Loads the main save, falling back to backups if it is corrupted. */
export function readSave(storage: StorageLike): LoadResult {
  let error: string | undefined;
  for (const key of [SAVE_KEY, ...BACKUP_KEYS]) {
    const text = storage.getItem(key);
    if (!text) continue;
    try {
      return { state: decodeSave(text), source: key, error };
    } catch (e) {
      if (key === SAVE_KEY) storage.setItem(CORRUPT_KEY, text);
      error ??= e instanceof Error ? e.message : String(e);
    }
  }
  return { state: null, source: null, error };
}

export function clearSave(storage: StorageLike): void {
  storage.removeItem(SAVE_KEY);
  for (const key of BACKUP_KEYS) storage.removeItem(key);
  storage.removeItem(BACKUP_TIME_KEY);
}

export function saveFileName(s: GameState, now: Date = new Date()): string {
  const safe = s.org.name.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'Org';
  const date = now.toISOString().slice(0, 10);
  return `EsportsIdle_${safe}_${date}.txt`;
}
