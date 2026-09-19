import { DEFAULT_KIT, LEGACY_KIT } from '../data/palette';
import LZString from 'lz-string';
import { GAMES } from '../data/games';
import { sanitizeDesign } from './designs';
import { createFounder } from './players';
import { Rng } from './rng';
import { SAVE_VERSION, addFounder, createBaseState, setupNewRun } from './state';
import { createDraft } from './draft';
import { isEmblem } from '../data/emblems';
import { openAllSections, updateSections } from './sections';
import { addToTeam, createTeam, teamPlayerIds } from './teams';
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
  2: (raw) => {
    const org = raw.org as Record<string, unknown> | undefined;
    if (org && org.primary === LEGACY_KIT.primary && org.secondary === LEGACY_KIT.secondary) {
      org.primary = DEFAULT_KIT.primary;
      org.secondary = DEFAULT_KIT.secondary;
    }
  },
  // v3 -> v4 added the tutorial, the first-player draft and quests. Orgs from before then are well
  // past the tutorial and keep their founder; their quest board starts fresh.
  3: (raw) => {
    raw.tutorial = { step: 'done' };
    raw.draft = null;
  },
  // v4 -> v5 added sections that open as the org grows. Orgs past the tutorial have seen them all.
  4: (raw) => {
    const tutorial = raw.tutorial as { step?: string } | undefined;
    if (tutorial?.step === 'done') raw.__openAllSections = true;
  },
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
  const openAll = migrated.__openAllSections === true;
  delete migrated.__openAllSections;
  const state = mergeDefaults(createBaseState(createdAt), migrated) as GameState;
  if (openAll) {
    openAllSections(state);
    for (const id of Object.keys(state.sections)) state.sectionsSeen[id] = true;
  }
  repairState(state);
  return state;
}

/** Fills defaults inside dynamic records and restores invariants. */
export function repairState(s: GameState): void {
  // An org with no roster and no teams always has a way to start: saves from before the draft get
  // the founder they would have had, and anything newer gets the draft.
  if (Object.keys(s.players).length === 0 && !s.draft && Object.keys(s.teams).length === 0) {
    if (s.tutorial.step === 'done' && s.prestige.runs === 0 && s.stats.playersSigned === 0) addFounder(s);
    else setupNewRun(s);
  }
  // Drafts from when three prospects were offered become the single first-player prospect.
  if (s.draft && s.draft.length !== 1) s.draft = createDraft(s, new Rng(s));
  // A run that already has signed players skips any left-over draft.
  if (Object.keys(s.players).length > 0) s.draft = null;
  if (!isEmblem(s.org.emblem)) s.org.emblem = { shape: 'shield', mark: 'initials' };
  updateSections(s, false);
  for (const [id, design] of Object.entries(s.designs)) {
    s.designs[id] = sanitizeDesign({ ...design, id });
  }
  if (s.org.logo && !s.designs[s.org.logo]) s.org.logo = null;
  if (s.org.jersey && !s.designs[s.org.jersey]) s.org.jersey = null;

  // Restore/migrate founder for saves where the first drafted player was not flagged as founder
  if (!s.players.founder) {
    const smashStarterId = s.teams.smash?.lineup[0];
    const candidateId = (smashStarterId && s.players[smashStarterId])
      ? smashStarterId
      : (s.players.p1 ? 'p1' : (Object.keys(s.players).length === 1 ? Object.keys(s.players)[0] : undefined));

    if (candidateId && s.players[candidateId]) {
      const candidate = s.players[candidateId];
      candidate.founder = true;
      candidate.cut = 0;
      if (candidateId !== 'founder') {
        candidate.id = 'founder';
        delete s.players[candidateId];
        s.players.founder = candidate;
        for (const team of Object.values(s.teams)) {
          team.lineup = team.lineup.map((id) => (id === candidateId ? 'founder' : id));
          team.bench = team.bench.map((id) => (id === candidateId ? 'founder' : id));
        }
      }
    } else if (s.tutorial.step === 'done' && !s.draft) {
      // If the founder was previously deleted (due to retirement or prestige without founder id), restore them
      addFounder(s);
    }
  } else {
    s.players.founder.founder = true;
    s.players.founder.cut = 0;
  }

  const template = createFounder(new Rng({ rng: 1 }), 'Template');
  for (const [id, p] of Object.entries(s.players)) {
    const tracked = (p as Partial<GameState['players'][string]>).signedLevel !== undefined;
    const merged = mergeDefaults(template, p) as GameState['players'][string];
    // Players from older saves get no development credit for levels gained before it was tracked.
    if (!tracked) merged.signedLevel = merged.level;
    s.players[id] = merged;
  }
  for (const game of GAMES) {
    const team = s.teams[game.id];
    if (team) s.teams[game.id] = mergeDefaults(createTeam(game.id), team) as GameState['teams'][string];
    // While the draft is open the org has no team yet; the first signing founds it.
    else if (s.games[game.id]?.unlocked && !s.draft) s.teams[game.id] = createTeam(game.id);
  }
  // Ensure every player in s.players is on their game's team (lineup or bench)
  for (const p of Object.values(s.players)) {
    const team = s.teams[p.gameId];
    if (team && !teamPlayerIds(team).includes(p.id)) {
      addToTeam(s, p, { benchSlots: 100 });
    }
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
