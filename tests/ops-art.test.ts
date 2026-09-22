import { describe, expect, it } from 'vitest';
import { GAMES } from '../src/data/games';
import { OPERATIONS } from '../src/data/operations';
import { BRANDS } from '../src/data/sponsors';
import { RIVAL_ORGS } from '../src/data/names';
import { brandLogoSvg } from '../src/ui/brandArt';
import { gameLogoSvg } from '../src/ui/gameArt';
import { OP_ART_IDS, opSceneBackground, opSceneSvg, opSpriteSvg } from '../src/ui/opsArt';
import { orgLogoSvg } from '../src/ui/orgArt';

describe('operation art', () => {
  it('draws a building and a scene for every operation, with no broken numbers', () => {
    expect([...OP_ART_IDS].sort()).toEqual(OPERATIONS.map((o) => o.id).sort());
    for (const op of OPERATIONS) {
      const sprite = opSpriteSvg(op.id, '#22e4ff');
      const scene = opSceneSvg(op.id, '#22e4ff');
      expect(sprite, op.id).toContain('viewBox="0 0 48 48"');
      expect(scene, op.id).toContain('viewBox="0 0 400 72"');
      expect(sprite + scene, op.id).not.toMatch(/NaN|undefined/);
      expect(opSceneBackground(op.id, '#22e4ff')).toMatch(/^url\("data:image\/svg\+xml,/);
    }
  });

  it('keeps sprites free of gradients and filters, which break when shared across the page', () => {
    for (const op of OPERATIONS) expect(opSpriteSvg(op.id, '#22e4ff'), op.id).not.toMatch(/Gradient|filter=|url\(#/);
  });
});

describe('logo depth', () => {
  it('gives every game, sponsor and rival logo its own lighting ids', () => {
    const logos = [
      ...GAMES.map((g) => gameLogoSvg(g.id, g.color, g.name)),
      ...BRANDS.map((b) => brandLogoSvg(b.id, b.color, b.name)),
      ...RIVAL_ORGS.map((n) => orgLogoSvg(n)),
    ];
    const ids = logos.map((svg) => svg.match(/id="(ld[0-9a-z]+)-e"/)?.[1]);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    for (const svg of logos) expect(svg).not.toMatch(/NaN|undefined/);
  });
});
