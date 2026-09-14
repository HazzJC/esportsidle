import { ACHIEVEMENTS, ACHIEVEMENT_MAP, type AchievementDef } from '../data/achievements';
import { emit } from './bus';
import type { GameState, Rates } from './types';

export function checkAchievements(s: GameState, rates: Rates): AchievementDef[] {
  const unlocked: AchievementDef[] = [];
  for (const def of ACHIEVEMENTS) {
    if (s.achievements[def.id] !== undefined) continue;
    if (def.check(s, rates)) {
      s.achievements[def.id] = Date.now();
      unlocked.push(def);
      emit({ type: 'achievement', id: def.id });
    }
  }
  return unlocked;
}

export function unlockAchievement(s: GameState, id: string): boolean {
  if (s.achievements[id] !== undefined || !ACHIEVEMENT_MAP.has(id)) return false;
  s.achievements[id] = Date.now();
  emit({ type: 'achievement', id });
  return true;
}
