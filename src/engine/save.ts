import LZString from 'lz-string';
import { SAVE_VERSION, createNewGame } from './state';
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
const MIGRATIONS: Record<number, (raw: Json) => void> = {};

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
  return mergeDefaults(createNewGame(createdAt), migrated) as GameState;
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
