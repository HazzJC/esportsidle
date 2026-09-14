import { ACHIEVEMENT_MAP } from '../data/achievements';
import { subscribe, type GameEvent } from '../engine/bus';
import { clickLogo, type ClickResult } from '../engine/clicker';
import { computeMods, computeRates } from '../engine/economy';
import { money, setNumberFormat, type NumberFormat } from '../engine/format';
import { advance, applyOfflineProgress, tick, TICK_SECONDS, type OfflineReport } from '../engine/game';
import { pickNews } from '../engine/news';
import type { GearSlot } from '../data/gear';
import { getGame } from '../data/games';
import { refreshMarket, rerollMarket, seedMarketForGame, sellPlayer, signListing } from '../engine/market';
import { buyOperation, sellOperation } from '../engine/operations';
import { DECOR_MAP } from '../data/decor';
import { buyGear } from '../engine/players';
import { buyDecor, hireStaff } from '../engine/staff';
import { Rng } from '../engine/rng';
import { assignSlot, benchPlayer, changeTier, unlockGame } from '../engine/teams';
import type { Appearance } from '../engine/types';
import { clearSave, decodeSave, encodeSave, readSave, saveFileName, SAVE_KEY, writeSave, type StorageLike } from '../engine/save';
import { createNewGame } from '../engine/state';
import type { GameState, Mods, Rates, Settings, Tone } from '../engine/types';
import { buyAllUpgrades, buyUpgrade, refreshUpgradeUnlocks } from '../engine/upgrades';

export type TabId = 'hq' | 'house' | 'teams' | 'roster' | 'market' | 'staff' | 'achievements' | 'stats' | 'options';
export type MobileView = 'clicker' | 'center' | 'store';

export interface Toast {
  id: number;
  title: string;
  body?: string;
  icon?: string;
  tone: Tone;
}

export interface View {
  s: GameState;
  r: Rates;
  m: Mods;
  frame: number;
}

const UI_INTERVAL_MS = 1000 / 15;
const NEWS_INTERVAL_MS = 14_000;
const MAX_ONLINE_CATCHUP_SECONDS = 3600;
const MAX_TOASTS = 5;

/**
 * The engine mutates one plain state object in place. Svelte skips updates when a derived value keeps the
 * same identity, so each UI frame exposes the state through fresh (pass-through) proxies at every depth.
 */
function frameProxy<T extends object>(target: T): T {
  const cache = new WeakMap<object, object>();
  const handler: ProxyHandler<object> = {
    get(obj, key) {
      const value = Reflect.get(obj, key);
      return value !== null && typeof value === 'object' ? wrap(value) : value;
    },
  };
  function wrap(obj: object): object {
    let proxy = cache.get(obj);
    if (!proxy) {
      proxy = new Proxy(obj, handler);
      cache.set(obj, proxy);
    }
    return proxy;
  }
  return wrap(target) as T;
}

function getStorage(): StorageLike | null {
  try {
    const ls = window.localStorage;
    const key = '__esportsidle_probe';
    ls.setItem(key, '1');
    ls.removeItem(key);
    return ls;
  } catch {
    return null;
  }
}

class GameStore {
  toasts = $state<Toast[]>([]);
  offlineReport = $state<OfflineReport | null>(null);
  news = $state('');
  tab = $state<TabId>('hq');
  mobileView = $state<MobileView>('clicker');
  lastSavedAt = $state(0);
  saveError = $state<string | null>(null);

  private storage = getStorage();
  private pendingToasts: Omit<Toast, 'id'>[] = [];
  state: GameState = this.loadInitial();
  view = $state.raw<View>(this.makeView());

  private running = false;
  private lastFrame = 0;
  private acc = 0;
  private lastUi = 0;
  private lastAutosave = 0;
  private lastNews = 0;
  private toastId = 0;
  private frameCount = 0;
  private unsubscribe: (() => void) | null = null;
  private bgTimer: ReturnType<typeof setInterval> | undefined;

  private loadInitial(): GameState {
    if (!this.storage) {
      this.pendingToasts.push({
        title: 'Saving unavailable',
        body: 'Your browser is blocking local storage. Use Export in Options to keep your progress.',
        icon: 'save',
        tone: 'bad',
      });
      return createNewGame();
    }
    const result = readSave(this.storage);
    if (result.state) {
      if (result.source !== SAVE_KEY) {
        this.pendingToasts.push({
          title: 'Recovered from backup',
          body: 'Your latest save was damaged, so a recent backup was loaded.',
          icon: 'save',
          tone: 'bad',
        });
      }
      return result.state;
    }
    if (result.error) {
      this.pendingToasts.push({ title: 'Could not load save', body: result.error, icon: 'save', tone: 'bad' });
    }
    return createNewGame();
  }

  private makeView(): View {
    const m = computeMods(this.state);
    return { s: frameProxy(this.state), r: computeRates(this.state, m), m, frame: ++this.frameCount };
  }

  refresh(): void {
    this.view = this.makeView();
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------
  start(): void {
    if (this.running) return;
    this.running = true;
    setNumberFormat(this.state.settings.numberFormat);
    this.unsubscribe = subscribe((e) => this.onEvent(e));
    for (const t of this.pendingToasts) this.toast(t);
    this.pendingToasts = [];

    const report = applyOfflineProgress(this.state);
    if (report && report.earned > 0) this.offlineReport = report;
    refreshUpgradeUnlocks(this.state);

    const now = performance.now();
    this.lastFrame = now;
    this.lastUi = now;
    this.lastAutosave = now;
    this.lastNews = now;
    this.news = pickNews(this.state);
    this.refresh();

    requestAnimationFrame(this.frame);
    this.bgTimer = setInterval(() => {
      if (document.hidden) this.step(performance.now());
    }, 1000);
    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('pagehide', this.onPageHide);
    window.addEventListener('keydown', this.onKeyDown);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.unsubscribe?.();
    clearInterval(this.bgTimer);
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('pagehide', this.onPageHide);
    window.removeEventListener('keydown', this.onKeyDown);
  }

  private frame = (now: number): void => {
    if (!this.running) return;
    this.step(now);
    requestAnimationFrame(this.frame);
  };

  private step(now: number): void {
    const dt = (now - this.lastFrame) / 1000;
    this.lastFrame = now;
    if (dt > 0) {
      if (dt > 2) {
        this.catchUp(dt);
        this.acc = 0;
      } else {
        this.acc += dt;
        let steps = 0;
        while (this.acc >= TICK_SECONDS && steps < 40) {
          tick(this.state, TICK_SECONDS);
          this.acc -= TICK_SECONDS;
          steps++;
        }
        if (steps >= 40) this.acc = 0;
      }
    }
    if (now - this.lastUi >= UI_INTERVAL_MS) {
      this.lastUi = now;
      this.refresh();
    }
    if (now - this.lastAutosave >= this.state.settings.autosaveSeconds * 1000) {
      this.lastAutosave = now;
      this.save(false);
    }
    if (now - this.lastNews >= NEWS_INTERVAL_MS) {
      this.lastNews = now;
      this.news = pickNews(this.state, Math.random, this.news);
    }
  }

  /** Catches up after the tab was throttled or suspended. */
  private catchUp(seconds: number): void {
    const online = Math.min(seconds, MAX_ONLINE_CATCHUP_SECONDS);
    advance(this.state, online, false);
    const rest = seconds - online;
    if (rest > 0 && this.state.settings.offlineProgress) {
      const cap = computeMods(this.state).offlineCapHours * 3600;
      advance(this.state, Math.min(rest, cap), true);
    }
  }

  private onVisibility = (): void => {
    if (document.hidden) this.save(false);
  };

  private onPageHide = (): void => {
    this.save(false);
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      this.save(true);
    }
  };

  private onEvent(e: GameEvent): void {
    switch (e.type) {
      case 'toast':
        this.toast({ title: e.title, body: e.body, icon: e.icon, tone: e.tone ?? 'info' });
        break;
      case 'achievement': {
        const def = ACHIEVEMENT_MAP.get(e.id);
        if (def) this.toast({ title: 'Achievement unlocked', body: def.name, icon: def.icon, tone: 'gold' });
        break;
      }
      case 'crowd':
        this.toast({ title: 'The crowd goes wild!', body: 'Income ×2 while the hype lasts.', icon: 'megaphone', tone: 'good' });
        break;
      default:
        break;
    }
  }

  toast(t: Omit<Toast, 'id'> & { tone?: Tone }, durationMs = 5000): void {
    const id = ++this.toastId;
    this.toasts.push({ ...t, tone: t.tone ?? 'info', id });
    if (this.toasts.length > MAX_TOASTS) this.toasts.splice(0, this.toasts.length - MAX_TOASTS);
    setTimeout(() => this.dismissToast(id), durationMs);
  }

  dismissToast(id: number): void {
    const i = this.toasts.findIndex((t) => t.id === id);
    if (i >= 0) this.toasts.splice(i, 1);
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  click(): ClickResult {
    const result = clickLogo(this.state);
    this.refresh();
    return result;
  }

  buyOperation(id: string, amount: number): number {
    const n = buyOperation(this.state, id, amount);
    if (n > 0) {
      refreshUpgradeUnlocks(this.state);
      this.refresh();
    }
    return n;
  }

  sellOperation(id: string, amount: number): number {
    const refund = sellOperation(this.state, id, amount);
    if (refund > 0) this.refresh();
    return refund;
  }

  buyUpgrade(id: string): boolean {
    const ok = buyUpgrade(this.state, id);
    if (ok) {
      refreshUpgradeUnlocks(this.state);
      this.refresh();
    }
    return ok;
  }

  buyAllUpgrades(): number {
    const n = buyAllUpgrades(this.state);
    if (n > 0) {
      refreshUpgradeUnlocks(this.state);
      this.refresh();
      this.toast({ title: `Bought ${n} upgrade${n === 1 ? '' : 's'}`, icon: 'sparkles', tone: 'good' }, 2500);
    }
    return n;
  }

  // ---------------------------------------------------------------------------
  // Teams & players
  // ---------------------------------------------------------------------------
  /** Player whose detail panel is open. */
  selectedPlayer = $state<string | null>(null);
  /** Game filter for the transfer market. */
  marketFilter = $state<string | null>(null);

  unlockGame(gameId: string): boolean {
    if (!unlockGame(this.state, gameId)) return false;
    const mods = computeMods(this.state);
    seedMarketForGame(this.state, new Rng(this.state), gameId, 4, mods);
    const game = getGame(gameId);
    this.toast({ title: `${game.name} team founded!`, body: 'Sign players from the transfer market to fill your lineup.', icon: game.icon, tone: 'gold' });
    this.refresh();
    return true;
  }

  signPlayer(playerId: string): boolean {
    const result = signListing(this.state, playerId, computeMods(this.state));
    if (!result.ok) {
      this.toast({ title: 'Signing failed', body: result.reason, icon: 'user-plus', tone: 'bad' }, 3500);
      return false;
    }
    const p = result.player;
    this.toast({ title: `Signed ${p.tag}!`, body: `${p.first} ${p.last} joins your ${getGame(p.gameId).name} roster.`, icon: 'user-plus', tone: 'good' }, 3500);
    this.refresh();
    return true;
  }

  sellPlayer(playerId: string): number {
    const p = this.state.players[playerId];
    const value = sellPlayer(this.state, playerId);
    if (value > 0 && p) {
      if (this.selectedPlayer === playerId) this.selectedPlayer = null;
      this.toast({ title: `Sold ${p.tag}`, body: `A rival org paid ${money(value)}.`, icon: 'handshake', tone: 'info' }, 3500);
      this.refresh();
    }
    return value;
  }

  rerollMarket(): boolean {
    const ok = rerollMarket(this.state, new Rng(this.state), computeMods(this.state), this.view.r.cpsNoBuffs);
    if (ok) this.refresh();
    return ok;
  }

  forceRefreshMarket(): void {
    refreshMarket(this.state, new Rng(this.state), computeMods(this.state));
    this.refresh();
  }

  buyGear(playerId: string, slot: GearSlot): boolean {
    const ok = buyGear(this.state, playerId, slot, computeMods(this.state));
    if (ok) this.refresh();
    return ok;
  }

  assignSlot(gameId: string, playerId: string, slot: number): void {
    if (assignSlot(this.state, gameId, playerId, slot)) this.refresh();
  }

  benchPlayer(gameId: string, playerId: string): void {
    if (benchPlayer(this.state, gameId, playerId, computeMods(this.state))) this.refresh();
    else this.toast({ title: 'Bench is full', body: 'Buy bench upgrades to hold more substitutes.', icon: 'users', tone: 'bad' }, 3000);
  }

  changeTier(gameId: string, delta: number): void {
    const winChance = this.view.r.teams[gameId]?.winChance ?? 0;
    if (changeTier(this.state, gameId, delta, winChance)) this.refresh();
  }

  setTeamOption(gameId: string, key: 'autoPromote' | 'autoSub', value: boolean): void {
    const team = this.state.teams[gameId];
    if (!team) return;
    team[key] = value;
    this.refresh();
  }

  hireStaff(id: string, amount: number): number {
    const n = hireStaff(this.state, id, amount, computeMods(this.state).staffCostMult);
    if (n > 0) {
      refreshUpgradeUnlocks(this.state);
      this.refresh();
    }
    return n;
  }

  buyDecor(id: string): boolean {
    const ok = buyDecor(this.state, id);
    if (ok) {
      const def = DECOR_MAP.get(id);
      this.toast({ title: `${def?.name ?? 'Decor'} installed`, body: 'The house is looking better already.', icon: def?.icon ?? 'house', tone: 'good' }, 2500);
      this.refresh();
    }
    return ok;
  }

  updateLook(playerId: string, patch: Partial<Appearance>): void {
    const p = this.state.players[playerId];
    if (!p) return;
    Object.assign(p.look, patch);
    this.state.stats.looksChanged++;
    this.refresh();
  }

  renamePlayer(playerId: string, fields: { tag?: string; first?: string; last?: string; jersey?: number }): void {
    const p = this.state.players[playerId];
    if (!p) return;
    if (fields.tag !== undefined && fields.tag.trim()) p.tag = fields.tag.trim().slice(0, 16);
    if (fields.first !== undefined && fields.first.trim()) p.first = fields.first.trim().slice(0, 16);
    if (fields.last !== undefined) p.last = fields.last.trim().slice(0, 20);
    if (fields.jersey !== undefined && Number.isFinite(fields.jersey)) p.jersey = Math.max(0, Math.min(99, Math.floor(fields.jersey)));
    this.refresh();
  }

  rename(name: string): void {
    const clean = name.replace(/\s+/g, ' ').trim().slice(0, 24);
    if (!clean || clean === this.state.org.name) return;
    this.state.org.name = clean;
    this.state.stats.renames++;
    this.refresh();
  }

  setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
    this.state.settings[key] = value;
    if (key === 'numberFormat') setNumberFormat(value as NumberFormat);
    this.refresh();
  }

  // ---------------------------------------------------------------------------
  // Saving
  // ---------------------------------------------------------------------------
  save(manual: boolean): boolean {
    if (!this.storage) {
      if (manual) this.toast({ title: 'Saving unavailable', body: 'Use Export in Options instead.', icon: 'save', tone: 'bad' });
      return false;
    }
    try {
      if (manual) this.state.stats.manualSaves++;
      writeSave(this.storage, this.state);
      this.lastSavedAt = Date.now();
      this.saveError = null;
      if (manual) this.toast({ title: 'Game saved', icon: 'save', tone: 'good' }, 2000);
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (this.saveError !== message) {
        this.toast({ title: 'Save failed', body: message, icon: 'save', tone: 'bad' });
      }
      this.saveError = message;
      return false;
    }
  }

  exportSave(): string {
    this.state.stats.exports++;
    return encodeSave(this.state);
  }

  importSave(text: string): boolean {
    try {
      const loaded = decodeSave(text);
      loaded.lastSaved = Date.now();
      loaded.stats.imports++;
      this.state = loaded;
      setNumberFormat(loaded.settings.numberFormat);
      refreshUpgradeUnlocks(loaded);
      this.acc = 0;
      this.save(false);
      this.refresh();
      this.toast({ title: 'Save imported', body: `Welcome back, ${loaded.org.name}.`, icon: 'upload', tone: 'good' });
      return true;
    } catch (e) {
      this.toast({ title: 'Import failed', body: e instanceof Error ? e.message : String(e), icon: 'upload', tone: 'bad' });
      return false;
    }
  }

  downloadSave(): void {
    const text = this.exportSave();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = saveFileName(this.state);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async uploadSave(file: File): Promise<boolean> {
    const text = await file.text();
    return this.importSave(text);
  }

  hardReset(): void {
    const settings = this.state.settings;
    if (this.storage) clearSave(this.storage);
    this.state = createNewGame();
    this.state.settings = settings;
    this.offlineReport = null;
    this.acc = 0;
    this.save(false);
    this.refresh();
    this.toast({ title: 'Fresh start', body: 'Your org is back in the garage.', icon: 'house', tone: 'info' });
  }

  /** Short description of income, used in the document title. */
  titleText(): string {
    return `${money(this.state.cash)} · Esports Idle`;
  }
}

export const game = new GameStore();
