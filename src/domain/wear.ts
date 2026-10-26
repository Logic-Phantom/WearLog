import type { ISODate, WearEvent } from './models';

/**
 * CPW (prompt §6): price / de-duplicated wear count, only when price > 0 and wears > 0.
 * Missing data is reported as a reason — never as 0원.
 */
export type CpwResult =
  | { kind: 'value'; cpwMinor: number; priceMinor: number; wearCount: number }
  | { kind: 'noPrice'; wearCount: number }
  | { kind: 'noWears'; priceMinor: number };

export function computeCpw(priceMinor: number | null, wearCount: number): CpwResult {
  if (priceMinor == null || !Number.isFinite(priceMinor) || priceMinor <= 0) return { kind: 'noPrice', wearCount };
  if (wearCount <= 0) return { kind: 'noWears', priceMinor: Math.round(priceMinor) };
  return { kind: 'value', cpwMinor: Math.round(priceMinor / wearCount), priceMinor: Math.round(priceMinor), wearCount };
}

/** Deterministic key: the same outfit (or item set) on the same day is one wear. */
export function wearIdempotencyKey(date: ISODate, outfitId: string | null, garmentItemIds: string[]): string {
  const subject = outfitId ?? [...new Set(garmentItemIds)].sort().join(',');
  return `${date}:${subject}`;
}

/** Wear count = number of distinct events (by idempotency key) that include the item. */
export function wearCountFor(itemId: string, events: Pick<WearEvent, 'garmentItemIds' | 'idempotencyKey'>[]): number {
  const keys = new Set<string>();
  for (const e of events) if (e.garmentItemIds.includes(itemId)) keys.add(e.idempotencyKey);
  return keys.size;
}

export function formatKrw(minor: number): string {
  return `${Math.round(minor).toLocaleString('ko-KR')}원`;
}

/** Local calendar day (device timezone) as YYYY-MM-DD. */
export function localDay(d: Date = new Date()): ISODate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
