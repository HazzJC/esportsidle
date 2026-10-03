import { describe, expect, it } from 'vitest';
import { QUESTS, QUEST_TOOLS, type QuestReward } from '../src/data/quests';
import { questArtSvg, questColor, questEmblemSvg, rewardArtSvg } from '../src/ui/questArt';

const count = (s: string, needle: string) => s.split(needle).length - 1;

/** Every reward kind once, plus every tool, so each reward key has a picture. */
const REWARDS: QuestReward[] = [
  { kind: 'cash', seconds: 60, min: 1 },
  { kind: 'fans', seconds: 60, min: 1 },
  { kind: 'trophies', amount: 1 },
  { kind: 'levels', amount: 1 },
  { kind: 'legacy', amount: 1 },
  { kind: 'perk', label: 'Test', effects: [] },
  { kind: 'opAffinity', op: 'grinder' },
  { kind: 'cosmetic', id: 'x', label: 'X' },
  { kind: 'title', id: 'x', label: 'X' },
  ...(Object.keys(QUEST_TOOLS) as (keyof typeof QUEST_TOOLS)[]).map((id) => ({ kind: 'tool' as const, id })),
];

describe('quest art', () => {
  it('draws an emblem for every quest, each one its own', () => {
    for (const q of QUESTS) expect(questArtSvg(q.art, '#4f9dff'), q.id).toBeTruthy();
    expect(new Set(QUESTS.map((q) => q.art)).size).toBe(QUESTS.length);
  });

  it('draws a picture for every reward a quest can pay', () => {
    for (const r of REWARDS) expect(rewardArtSvg(r, QUESTS[0]).length, r.kind).toBeGreaterThan(40);
  });

  it('produces well-formed, inert markup', () => {
    const all = [...QUESTS.map((q) => questEmblemSvg(q)), ...REWARDS.map((r) => rewardArtSvg(r, QUESTS[0]))];
    for (const m of all) {
      expect(m).not.toMatch(/undefined|NaN|Infinity|\[object/);
      expect(m).not.toMatch(/<script|<foreignObject|\son[a-z]+=|javascript:|href=/i);
      expect(count(m, '<')).toBe(count(m, '>'));
      for (const el of m.match(/<[a-z]+ [^>]*>/g) ?? []) {
        const names = [...el.matchAll(/\s([a-z-]+)=/g)].map((x) => x[1]);
        expect(new Set(names).size, el).toBe(names.length);
      }
    }
  });

  it('colours later quests further up the rarity ladder', () => {
    expect(questColor(QUESTS[0].id)).not.toBe(questColor(QUESTS[QUESTS.length - 1].id));
  });
});
