import type { CanvasLayout, Outfit } from '@/domain/models';
import { getDb, parseJsonArray } from '@/infrastructure/database/database';

import { deserializeLayout, serializeLayout } from './canvas-state';

interface Row {
  id: string;
  title: string;
  item_refs_json: string;
  style_tags_json: string;
  occasion: string | null;
  source: string;
  thumbnail_uri: string | null;
  created_at: string;
  updated_at: string;
}

function fromRow(r: Row): Outfit {
  return {
    id: r.id,
    title: r.title,
    itemRefs: parseJsonArray(r.item_refs_json),
    styleTags: parseJsonArray(r.style_tags_json),
    occasion: r.occasion as Outfit['occasion'],
    source: r.source as Outfit['source'],
    thumbnailUri: r.thumbnail_uri,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** Outfit row + its canvas JSON in one transaction. */
export async function saveOutfit(outfit: Outfit, layout: CanvasLayout | null): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO outfits (id, title, item_refs_json, style_tags_json, occasion, source, thumbnail_uri, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET title=excluded.title, item_refs_json=excluded.item_refs_json, style_tags_json=excluded.style_tags_json,
         occasion=excluded.occasion, thumbnail_uri=excluded.thumbnail_uri, updated_at=excluded.updated_at`,
      outfit.id,
      outfit.title,
      JSON.stringify(outfit.itemRefs),
      JSON.stringify(outfit.styleTags),
      outfit.occasion,
      outfit.source,
      outfit.thumbnailUri,
      outfit.createdAt,
      outfit.updatedAt,
    );
    if (layout) {
      await db.runAsync(
        'INSERT INTO canvas_layouts (outfit_id, layout_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(outfit_id) DO UPDATE SET layout_json = excluded.layout_json, updated_at = excluded.updated_at',
        outfit.id,
        serializeLayout(layout),
        layout.updatedAt,
      );
    }
  });
}

export async function getOutfit(id: string): Promise<{ outfit: Outfit; layout: CanvasLayout | null } | null> {
  const db = await getDb();
  const r = await db.getFirstAsync<Row>('SELECT * FROM outfits WHERE id = ?', id);
  if (!r) return null;
  const l = await db.getFirstAsync<{ layout_json: string }>('SELECT layout_json FROM canvas_layouts WHERE outfit_id = ?', id);
  return { outfit: fromRow(r), layout: l ? deserializeLayout(l.layout_json) : null };
}

export async function listOutfits(limit = 50): Promise<Outfit[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>('SELECT * FROM outfits ORDER BY updated_at DESC LIMIT ?', limit);
  return rows.map(fromRow);
}

export async function deleteOutfit(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM outfits WHERE id = ?', id);
}
