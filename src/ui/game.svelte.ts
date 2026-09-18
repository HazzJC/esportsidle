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
import { calmDrama, clickDrop } from '../engine/drops';
import {
  addDesign,
  deleteDesign,
  generateDesign,
  setJerseyDesign,
  setOrgLogo,
  updateDesign,
  type DesignDraft,
} from '../engine/designs';
import { setLineDesign, setLinePrice, unlockProduct } from '../engine/merch';
import { cancelContract, signOffer } from '../engine/sponsors';
import { buyNode, sellOrg, type SellOptions } from '../engine/prestige';
import { LEGACY_NODE_MAP } from '../data/legacy';
import { BRAND_MAP } from '../data/sponsors';
import { PRODUCT_MAP } from '../data/merch';
import { buyOperation, levelUpOperation, sellOperation } from '../engine/operations';
import { resolveChoice } from '../engine/worldEvents';
import { DECOR_MAP } from '../data/decor';
import { buyGear } from '../engine/players';
import { buyDecor, hireStaff } from '../engine/staff';
import { Rng } from '../engine/rng';
import { assignSlot, benchPlayer, changeTier, unlockGame } from '../engine/teams';
import type { Appearance, TeamKit } from '../engine/types';
import { isHexColor } from '../data/palette';
import { cleanOrgName, completeOnboarding as completeOnboardingState } from '../engine/org';
import { clearSave, decodeSave, encodeSave, readSave, saveFileName, SAVE_KEY, writeSave, type StorageLike } from '../engine/save';
import { createNewGame } from '../engine/state';
import type { GameState, Mods, Rates, Settings, Tone } from '../engine/types';
import { buyAllUpgrades, buyUpgrade, refreshUpgradeUnlocks } from '../engine/upgrades';
import { playSound, type SoundId } from './sound';

export type TabId =
  | 'hq'
  | 'house'
  | 'teams'
  | 'roster'
  | 'market'
  | 'staff'
  | 'studio'
  | 'sponsors'
  | 'legacy'
  | 'achievements'
  | 'stats'
  | 'options';
export type MobileView = 'clicker' | 'center' | 'store';

export interface ToastAchievement {
  name: string;
  desc: string;
  icon: string;
  /** Counts towards the trophy cabinet income bonus. */
  cabinet: boolean;
}

export interface Toast {
  id: number;
  title: string;
  body?: string;
  icon?: string;
  tone: Tone;
  /** Milliseconds on screen, driving the countdown bar. */
  duration: number;
  /** Present on achievement popups, which get their own card. */
  achievements?: ToastAchievement[];
}

export type ToastInput = Omit<Toast, 'id' | 'tone' | 'duration'> & { tone?: Tone };

export interface View {
  s: GameState;
  r: Rates;
  m: Mods;
  frame: number;
}

const UI_INTERVAL_MS = 1000 / 15;
const NEWS_INTERVAL_MS = 14_000;
const MAX_ONLINE_CATCHUP_SECONDS = 3600;
/** Popups sit over the top-left corner, so only a few are shown at once. */
const MAX_TOASTS = 3;
/** Unlocks landing within this window share one popup and one chime. */
const ACHIEVEMENT_BATCH_MS = 450;

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
  private pendingToasts: ToastInput[] = [];
  private pendingAchievements: string[] = [];
  private achievementTimer: ReturnType<typeof setTimeout> | undefined;
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
        if (e.tone === 'gold') this.sfx('win');
        else if (e.tone === 'bad') this.sfx('error');
        break;
      case 'achievement': {
        this.pendingAchievements.push(e.id);
        this.achievementTimer ??= setTimeout(() => this.flushAchievements(), ACHIEVEMENT_BATCH_MS);
        break;
      }
      case 'crowd':
        this.toast({ title: 'The crowd goes wild!', body: 'Income ×2 while the hype lasts.', icon: 'megaphone', tone: 'good' });
        this.sfx('crowd');
        break;
      case 'drop':
        this.sfx('drop');
        break;
      default:
        break;
    }
  }

  /** Plays a UI sound unless the player has muted them. */
  sfx(id: SoundId): void {
    const { muted, volume } = this.state.settings;
    if (!muted && volume > 0) playSound(id, volume);
  }

  /** Shows every achievement unlocked in the last batch window as a single popup. */
  private flushAchievements(): void {
    this.achievementTimer = undefined;
    const defs = this.pendingAchievements.map((id) => ACHIEVEMENT_MAP.get(id)).filter((d) => d !== undefined);
    this.pendingAchievements = [];
    if (defs.length === 0) return;
    this.sfx('achievement');
    const achievements = defs.map((d) => ({ name: d.name, desc: d.desc(), icon: d.icon, cabinet: !d.shadow }));
    const title = defs.length === 1 ? 'Achievement unlocked' : `${defs.length} achievements unlocked`;
    this.toast({ title, icon: defs[0].icon, tone: 'gold', achievements }, defs.length === 1 ? 6000 : 8000);
  }

  toast(t: ToastInput, durationMs = 5000): void {
    const id = ++this.toastId;
    this.toasts.push({ ...t, tone: t.tone ?? 'info', id, duration: durationMs });
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
    this.sfx('click');
    this.refresh();
    return result;
  }

  buyOperation(id: string, amount: number): number {
    const n = buyOperation(this.state, id, amount);
    if (n > 0) {
      this.sfx('buy');
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
      this.sfx('upgrade');
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
    this.sfx('promote');
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
    this.sfx('buy');
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
    if (ok) {
      this.sfx('buy');
      this.refresh();
    }
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

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------
  private eventContext() {
    const mods = computeMods(this.state);
    return { rng: new Rng(this.state), mods, rates: computeRates(this.state, mods) };
  }

  clickDrop(id: number): void {
    const result = clickDrop(this.state, id, this.eventContext());
    if (result) {
      this.sfx('dropClick');
      refreshUpgradeUnlocks(this.state);
      this.refresh();
    }
  }

  resolveChoice(choiceId: number, option: number): void {
    if (resolveChoice(this.state, choiceId, option, this.eventContext())) this.refresh();
  }

  dismissTournament(): void {
    const t = this.state.events.lastTournament;
    if (t) t.seen = true;
    this.refresh();
  }

  levelUpOperation(id: string): void {
    if (levelUpOperation(this.state, id)) this.refresh();
  }

  calmDrama(): void {
    if (calmDrama(this.state, this.view.r.cpsNoBuffs)) {
      this.toast({ title: 'PR team deployed', body: 'No Drama Drops for the next 30 minutes.', icon: 'shield', tone: 'good' }, 3000);
      this.refresh();
    }
  }

  // ---------------------------------------------------------------------------
  // Designs, merch & sponsors
  // ---------------------------------------------------------------------------
  saveDesign(id: string | null, draft: DesignDraft): string | null {
    if (id) {
      if (!updateDesign(this.state, id, { name: draft.name, pixels: draft.pixels, palette: draft.palette })) return null;
      this.toast({ title: 'Design saved', body: draft.name, icon: 'palette', tone: 'good' }, 2000);
      this.refresh();
      return id;
    }
    const newId = addDesign(this.state, draft);
    if (!newId) {
      this.toast({ title: 'Design library full', body: 'Delete a design to make room.', icon: 'palette', tone: 'bad' }, 3000);
      return null;
    }
    if (!this.state.org.logo) setOrgLogo(this.state, newId);
    this.toast({
      title: 'Design saved',
      body: this.state.org.logo === newId ? `${draft.name} is now your org logo.` : draft.name,
      icon: 'palette',
      tone: 'good',
    });
    this.refresh();
    return newId;
  }

  generateDesign(size = 32): void {
    const count = Object.values(this.state.designs).filter((d) => !d.handmade).length + 1;
    const id = addDesign(this.state, generateDesign(new Rng(this.state), size, `Auto design ${count}`));
    if (!id) this.toast({ title: 'Design library full', icon: 'palette', tone: 'bad' }, 2500);
    this.refresh();
  }

  deleteDesign(id: string): void {
    if (deleteDesign(this.state, id)) this.refresh();
  }

  setLogo(id: string | null): void {
    if (setOrgLogo(this.state, id)) this.refresh();
  }

  setJersey(id: string | null): void {
    if (setJerseyDesign(this.state, id)) this.refresh();
  }

  unlockProduct(id: string): void {
    if (unlockProduct(this.state, id)) {
      const p = PRODUCT_MAP.get(id);
      this.toast({ title: `${p?.name ?? 'Product'} launched`, body: 'Pick a design so it starts selling.', icon: p?.icon ?? 'shirt', tone: 'good' }, 3000);
      refreshUpgradeUnlocks(this.state);
      this.refresh();
    }
  }

  setLineDesign(productId: string, designId: string | null): void {
    if (setLineDesign(this.state, productId, designId)) this.refresh();
  }

  setLinePrice(productId: string, price: number): void {
    if (setLinePrice(this.state, productId, price)) this.refresh();
  }

  // ---------------------------------------------------------------------------
  // Prestige
  // ---------------------------------------------------------------------------
  sellOrg(options: SellOptions): boolean {
    const entry = sellOrg(this.state, options);
    if (!entry) return false;
    this.sfx('legacy');
    this.offlineReport = null;
    this.selectedPlayer = null;
    this.marketFilter = null;
    this.acc = 0;
    refreshUpgradeUnlocks(this.state);
    this.save(false);
    this.refresh();
    return true;
  }

  buyLegacyNode(id: string): void {
    if (!buyNode(this.state, id)) return;
    this.sfx('upgrade');
    const def = LEGACY_NODE_MAP.get(id);
    this.toast({ title: `${def?.name ?? 'Legacy node'} unlocked`, body: def?.desc, icon: def?.icon ?? 'crown', tone: 'gold' }, 3000);
    this.refresh();
  }

  signSponsor(offerId: number): void {
    const result = signOffer(this.state, offerId, computeMods(this.state));
    if (!result.ok) {
      this.toast({ title: 'Could not sign', body: result.reason, icon: 'handshake', tone: 'bad' }, 3000);
      return;
    }
    const brand = BRAND_MAP.get(result.contract.brandId);
    this.sfx('promote');
    this.toast({ title: `${brand?.name ?? 'Sponsor'} signed!`, body: brand?.slogan, icon: 'handshake', tone: 'gold' });
    refreshUpgradeUnlocks(this.state);
    this.refresh();
  }

  cancelSponsor(contractId: number): void {
    if (cancelContract(this.state, contractId)) this.refresh();
  }

  hireStaff(id: string, amount: number): number {
    const n = hireStaff(this.state, id, amount, computeMods(this.state).staffCostMult);
    if (n > 0) {
      this.sfx('buy');
      refreshUpgradeUnlocks(this.state);
      this.refresh();
    }
    return n;
  }

  buyDecor(id: string): boolean {
    const ok = buyDecor(this.state, id);
    if (ok) {
      this.sfx('buy');
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
    const clean = cleanOrgName(name);
    if (!clean || clean === this.state.org.name) return;
    this.state.org.name = clean;
    this.state.stats.renames++;
    this.refresh();
  }

  /** Interface tone: recolours menus and buttons only, never in-game kit. */
  setTone(color: string): void {
    if (!isHexColor(color)) return;
    this.state.settings.uiAccent = color.toLowerCase();
    this.refresh();
  }

  /** Finishes the first-run screen. The rules live in engine/org.ts. */
  completeOnboarding(name: string, tone: string): void {
    completeOnboardingState(this.state, name, tone);
    this.save(false);
    this.refresh();
  }

  /** Org-wide team colours: the default for every team without its own kit. */
  setOrgKit(primary: string, secondary: string): void {
    if (!isHexColor(primary) || !isHexColor(secondary)) return;
    this.state.org.primary = primary.toLowerCase();
    this.state.org.secondary = secondary.toLowerCase();
    this.refresh();
  }

  /** Gives one team its own colours, or returns it to the org colours with null. */
  setTeamKit(gameId: string, kit: TeamKit | null): void {
    const team = this.state.teams[gameId];
    if (!team) return;
    if (kit && (!isHexColor(kit.primary) || !isHexColor(kit.secondary))) return;
    team.kit = kit ? { primary: kit.primary.toLowerCase(), secondary: kit.secondary.toLowerCase() } : null;
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
