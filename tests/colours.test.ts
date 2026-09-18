import { describe, expect, it } from 'vitest';
import { DEFAULT_KIT, DEFAULT_TONE, LEGACY_KIT, RARITY_COLORS, TEAM_KITS, UI_TONES, isHexColor } from '../src/data/palette';
import { decodeSave, encodeSave } from '../src/engine/save';
import { createNewGame } from '../src/engine/state';
import { cleanOrgName, completeOnboarding } from '../src/engine/org';
import { teamKit, unlockGame } from '../src/engine/teams';
import { mix, readableOn, shade } from '../src/ui/color';

/** Re-labels a current save as an older version so it runs through the migrations. */
function asVersion(text: string, version: number): string {
  return text.replace(/^ESI\d+/, `ESI${version}`);
}

describe('palette data', () => {
  it('only ships valid colours', () => {
    for (const c of RARITY_COLORS) expect(isHexColor(c)).toBe(true);
    for (const t of UI_TONES) expect(isHexColor(t.color)).toBe(true);
    for (const k of TEAM_KITS) expect(isHexColor(k.primary) && isHexColor(k.secondary)).toBe(true);
    expect(new Set(UI_TONES.map((t) => t.id)).size).toBe(UI_TONES.length);
    expect(new Set(TEAM_KITS.map((k) => k.id)).size).toBe(TEAM_KITS.length);
  });

  it('rejects anything that is not a #rrggbb colour', () => {
    for (const bad of ['red', '#fff', '#12345g', '#1234567', 'javascript:alert(1)', 42, null, undefined]) {
      expect(isHexColor(bad)).toBe(false);
    }
  });
});

describe('interface tone and team colours', () => {
  it('starts new games un-onboarded, in the neutral tone and default kit', () => {
    const s = createNewGame(0, 1);
    expect(s.settings.onboarded).toBe(false);
    expect(s.settings.uiAccent).toBe(DEFAULT_TONE);
    expect(s.org.primary).toBe(DEFAULT_KIT.primary);
    expect(s.teams.smash.kit).toBeNull();
  });

  it('teams follow the org colours until given their own', () => {
    const s = createNewGame(0, 1);
    s.org.primary = '#112233';
    s.org.secondary = '#445566';
    expect(teamKit(s, 'smash')).toEqual({ primary: '#112233', secondary: '#445566' });

    s.teams.smash.kit = { primary: '#aa0000', secondary: '#00aa00' };
    expect(teamKit(s, 'smash')).toEqual({ primary: '#aa0000', secondary: '#00aa00' });

    // Other teams are unaffected, and a game without a team still gets the org kit.
    s.cash = 1e9;
    unlockGame(s, 'rocket');
    expect(teamKit(s, 'rocket').primary).toBe('#112233');
    expect(teamKit(s, 'counter').primary).toBe('#112233');

    s.teams.smash.kit = null;
    expect(teamKit(s, 'smash').primary).toBe('#112233');
  });
});

describe('v2 -> v3 migration', () => {
  it('moves saves still wearing the original neon kit onto the new default', () => {
    const s = createNewGame(0, 1);
    s.org.primary = LEGACY_KIT.primary;
    s.org.secondary = LEGACY_KIT.secondary;
    const loaded = decodeSave(asVersion(encodeSave(s), 2));
    expect(loaded.org.primary).toBe(DEFAULT_KIT.primary);
    expect(loaded.org.secondary).toBe(DEFAULT_KIT.secondary);
  });

  it('leaves any other kit alone', () => {
    const s = createNewGame(0, 1);
    s.org.primary = LEGACY_KIT.primary;
    s.org.secondary = '#123456';
    const loaded = decodeSave(asVersion(encodeSave(s), 2));
    expect(loaded.org.primary).toBe(LEGACY_KIT.primary);
    expect(loaded.org.secondary).toBe('#123456');
  });

  it('gives old teams no kit of their own and asks old players to pick a tone', () => {
    const s = createNewGame(0, 1) as unknown as { teams: Record<string, Record<string, unknown>>; settings: Record<string, unknown> };
    delete s.teams.smash.kit;
    delete s.settings.onboarded;
    delete s.settings.uiAccent;
    const loaded = decodeSave(asVersion(encodeSave(s as never), 2));
    expect(loaded.teams.smash.kit).toBeNull();
    expect(loaded.settings.onboarded).toBe(false);
    expect(loaded.settings.uiAccent).toBe(DEFAULT_TONE);
  });
});

describe('colour helpers', () => {
  it('picks readable ink for solid swatches', () => {
    expect(readableOn('#f5c451')).toBe('#141416');
    expect(readableOn('#1f7a4f')).toBe('#f6f6f4');
  });

  it('mixes and shades hex colours', () => {
    expect(mix('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mix('#000000', '#ffffff', 1)).toBe('#ffffff');
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(shade('#808080', -1)).toBe('#000000');
    expect(shade('#808080', 1)).toBe('#ffffff');
    // Invalid input passes through untouched instead of producing garbage.
    expect(mix('not-a-colour', '#ffffff', 0.5)).toBe('not-a-colour');
  });
});

describe('onboarding', () => {
  it('keeps the org name intact', () => {
    // Regression: a mangled whitespace regex once stripped every letter "s".
    const s = createNewGame(0, 1);
    completeOnboarding(s, 'Garage Gamers', '#34d399');
    expect(s.org.name).toBe('Garage Gamers');
    expect(cleanOrgName('  Sassy   Snipers  ')).toBe('Sassy Snipers');
    expect(cleanOrgName('x'.repeat(40))).toHaveLength(24);
  });

  it('sets the tone and seeds untouched team colours from it', () => {
    const s = createNewGame(0, 1);
    completeOnboarding(s, 'Org', '#34D399');
    expect(s.settings.onboarded).toBe(true);
    expect(s.settings.uiAccent).toBe('#34d399');
    expect(s.org.primary).toBe('#34d399');
    // A light tone gets a dark accent, a dark tone a light one, so the kit always has contrast.
    expect(s.org.secondary).toBe('#26262b');
    const dark = createNewGame(0, 1);
    completeOnboarding(dark, 'Org', '#2c4aa0');
    expect(dark.org.secondary).toBe('#f1f1f0');
  });

  it('never overwrites team colours the player already chose', () => {
    const s = createNewGame(0, 1);
    s.org.primary = '#c8283c';
    s.org.secondary = '#f1f1f0';
    completeOnboarding(s, 'Org', '#34d399');
    expect(s.org.primary).toBe('#c8283c');
    expect(s.settings.uiAccent).toBe('#34d399');
  });

  it('ignores an invalid tone and a blank name', () => {
    const s = createNewGame(0, 1);
    const name = s.org.name;
    completeOnboarding(s, '   ', 'url(evil)');
    expect(s.org.name).toBe(name);
    expect(s.settings.uiAccent).toBe(DEFAULT_TONE);
    expect(s.org.primary).toBe(DEFAULT_KIT.primary);
    expect(s.settings.onboarded).toBe(true);
  });
});
