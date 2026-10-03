/**
 * Collapsible HQ cards ("Next steps", "Org activity"): whether each is open, remembered per browser,
 * and the rule that urgent items open a card by themselves.
 *
 * A card opens when an urgent item it has not shown before appears (a starter who cannot play, a
 * sale ready, a scandal). If the player closes it again, it stays closed for that item; the next
 * new urgent item opens it again.
 */

export interface CollapseMemory {
  open: boolean;
  /** The urgent item the card last opened itself for, so closing it sticks until a new one comes. */
  seenUrgent: string | null;
}

const KEY = (id: string) => `esportsidle.collapse.${id}`;
const DEFAULT: CollapseMemory = { open: true, seenUrgent: null };

export function readCollapse(id: string): CollapseMemory {
  try {
    const raw = localStorage.getItem(KEY(id));
    if (!raw) return { ...DEFAULT };
    const v = JSON.parse(raw) as Partial<CollapseMemory>;
    return { open: v.open !== false, seenUrgent: typeof v.seenUrgent === 'string' ? v.seenUrgent : null };
  } catch {
    return { ...DEFAULT };
  }
}

export function writeCollapse(id: string, mem: CollapseMemory): void {
  try {
    localStorage.setItem(KEY(id), JSON.stringify(mem));
  } catch {
    // Not remembered, that's all.
  }
}

/** Applies the urgent rule: a new urgent item opens the card; once it is gone, the next one counts as new. */
export function withUrgent(mem: CollapseMemory, urgent: string | null): CollapseMemory {
  if (urgent === null) return mem.seenUrgent === null ? mem : { ...mem, seenUrgent: null };
  if (urgent === mem.seenUrgent) return mem;
  return { open: true, seenUrgent: urgent };
}
