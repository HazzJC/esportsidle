/**
 * The simulated player's own dice (reaction times, noticing drops, judgement noise), kept apart from
 * the game's RNG so a player's choices never shift the game's own random stream.
 */
export class SimRandom {
  private state: number;

  constructor(seed: number) {
    this.state = (seed * 2654435761) >>> 0 || 1;
  }

  /** mulberry32 */
  next(): number {
    let t = (this.state = (this.state + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  /** Standard normal, Box-Muller. */
  normal(): number {
    const u = Math.max(1e-12, this.next());
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * this.next());
  }
}
