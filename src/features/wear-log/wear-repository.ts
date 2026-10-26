import type { ISODate, ItemRef, WearEvent } from '@/domain/models';
import { computeCpw, wearIdempotencyKey, type CpwResult } from '@/domain/wear';
import { getDb } from '@/infrastructure/database/database';
import { newId } from '@/utils/id';

/** Only owned garments can be worn; sample refs are dropped here, not by the caller. */
export function ownedIdsOf(refs: ItemRef[]): string[] {
  return [...new Set(refs.flatMap((r) => (r.kind === 'ownedGarment' ? [r.garmentItemId] : [])))];
}

/**
 * Records a wear. Idempotent: the same outfit/item-set on the same day is stored once even if the
 * button is tapped twice or the write is retried (UNIQUE idempotency_key + INSERT OR IGNORE).
 * Returns null when nothing owned was in the outfit (samples never count as worn).
 */
export async function recordWear(date: ISODate, outfitId: string | null, refs: ItemRef[], note: string | null = null): Promise<WearEvent | null> {
  const ids = ownedIdsOf(refs);
  if (ids.length === 0) return null;
  const db = await getDb();
  const key = wearIdempotencyKey(date, outfitId, ids);
  const now = new Date().toISOString();
  const id = newId('we_');
  await db.withTransactionAsync(async () => {
    const res = await db.runAsync('INSERT OR IGNORE INTO wear_events (id, date, outfit_id, note, idempotency_key, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)', id, date, outfitId, note, key, now, now);
    if (res.changes === 0) return;
    for (const gid of ids) await db.runAsync('INSERT OR IGNORE INTO wear_event_items (wear_event_id, garment_id) VALUES (?, ?)', id, gid);
  });
  const row = await db.getFirstAsync<{ id: string; created_at: string; updated_at: string; note: string | null }>('SELECT id, created_at, updated_at, note FROM wear_events WHERE idempotency_key = ?', key);
  return row ? { id: row.id, date, outfitId, garmentItemIds: ids, note: row.note, idempotencyKey: key, createdAt: row.created_at, updatedAt: row.updated_at } : null;
}

export async function deleteWear(eventId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM wear_events WHERE id = ?', eventId);
}

export async function listWearsBetween(from: ISODate, to: ISODate): Promise<{ id: string; date: ISODate; outfitId: string | null; garmentIds: string[] }[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string; date: string; outfit_id: string | null; ids: string | null }>(
    `SELECT e.id, e.date, e.outfit_id, GROUP_CONCAT(i.garment_id) AS ids
     FROM wear_events e LEFT JOIN wear_event_items i ON i.wear_event_id = e.id
     WHERE e.date BETWEEN ? AND ? GROUP BY e.id ORDER BY e.date DESC`,
    from,
    to,
  );
  return rows.map((r) => ({ id: r.id, date: r.date, outfitId: r.outfit_id, garmentIds: r.ids ? r.ids.split(',') : [] }));
}

export interface GarmentWearStats {
  garmentId: string;
  wearCount: number;
  lastWornDay: ISODate | null;
  cpw: CpwResult;
}

/** Wear count = distinct events linked to the garment (the link table PK de-duplicates). */
export async function garmentWearStats(): Promise<Map<string, GarmentWearStats>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string; price: number | null; n: number; last: string | null }>(
    `SELECT g.id, g.purchase_price_minor AS price, COUNT(i.wear_event_id) AS n, MAX(e.date) AS last
     FROM garments g
     LEFT JOIN wear_event_items i ON i.garment_id = g.id
     LEFT JOIN wear_events e ON e.id = i.wear_event_id
     WHERE g.status = 'active' GROUP BY g.id`,
  );
  return new Map(rows.map((r) => [r.id, { garmentId: r.id, wearCount: r.n, lastWornDay: r.last, cpw: computeCpw(r.price, r.n) }]));
}
