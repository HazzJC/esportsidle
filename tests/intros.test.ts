/**
 * Introductions to new mechanics: every tab that opens later has an intro card, a new org starts with
 * none of them read, and saves from before intro cards are not shown cards for things they already know.
 */
import { describe, expect, it } from 'vitest';
import { EVENT_INTROS, INTROS_KNOWN, TAB_INTROS, TAB_INTRO_MAP, firstKey, introKey } from '../src/data/intros';
import { decodeSave, encodeSave } from '../src/engine/save';
import { SECTIONS } from '../src/engine/sections';
import { createNewGame } from '../src/engine/state';
import { readFileSync } from 'node:fs';
import { foundedGame } from './fixtures';

/** The icon names ui/icons.ts knows, read from its source so the test needs no Svelte components. */
const ICON_NAMES = [...readFileSync('src/ui/icons.ts', 'utf8').matchAll(/^\s+'?([a-z0-9-]+)'?: /gm)].map((m) => m[1]);

describe('tab intro cards', () => {
  it('cover the Teams tab and every tab that opens as the org grows', () => {
    const tabs = ['teams', ...SECTIONS.filter((d) => d.unlock).map((d) => d.id)];
    for (const id of tabs) expect(TAB_INTRO_MAP.has(id), id).toBe(true);
  });

  it('use icons that exist and name a guide only where one is written', () => {
    const icons = [...TAB_INTROS.flatMap((d) => [d.icon, ...d.terms.map((t) => t.icon)]), ...Object.values(EVENT_INTROS).map((d) => d.icon)];
    for (const icon of icons) expect(ICON_NAMES, icon).toContain(icon);
    for (const d of TAB_INTROS) if (d.guide) expect(['teams', 'market'], d.id).toContain(d.guide);
  });

  it('start unread for a new org, which is marked as knowing about them', () => {
    const s = createNewGame(0, 1);
    expect(s.guides[INTROS_KNOWN]).toBe(true);
    for (const d of TAB_INTROS) expect(s.guides[introKey(d.id)], d.id).toBeUndefined();
    const back = decodeSave(encodeSave(s));
    for (const d of TAB_INTROS) expect(back.guides[introKey(d.id)], d.id).toBeUndefined();
  });

  it('are marked read on load for the tabs and events an older org has already met', () => {
    const s = foundedGame(0, 1);
    delete s.guides[INTROS_KNOWN];
    s.sectionsSeen = { market: true, staff: true };
    s.stats.dramaClicked = 3;
    s.stats.choicesMade = 0;
    s.stats.tournamentsPlayed = 1;
    const back = decodeSave(encodeSave(s));
    expect(back.guides[INTROS_KNOWN]).toBe(true);
    expect(back.guides[introKey('market')]).toBe(true);
    expect(back.guides[introKey('staff')]).toBe(true);
    expect(back.guides[introKey('teams')]).toBe(true);
    expect(back.guides[introKey('sponsors')]).toBeUndefined();
    expect(back.guides[firstKey('drama')]).toBe(true);
    expect(back.guides[firstKey('choice')]).toBeUndefined();
    expect(back.guides[firstKey('invitational')]).toBe(true);
  });
});
