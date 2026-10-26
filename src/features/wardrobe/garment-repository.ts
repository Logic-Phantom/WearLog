import type { GarmentCategory } from '@/domain/categories';
import type { GarmentItem } from '@/domain/models';
import { getDb, parseJsonArray } from '@/infrastructure/database/database';
import { deleteGarmentFiles } from '@/infrastructure/file-storage/app-files';

interface Row {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  source_type: string;
  original_uri: string | null;
  thumbnail_uri: string | null;
  cutout_uri: string | null;
  color_ids_json: string;
  pattern: string;
  fit: string | null;
  season_tags_json: string;
  style_tags_json: string;
  occasion_tags_json: string;
  outer_weight: string | null;
  water_resistant: number | null;
  brand: string | null;
  size_label: string | null;
  purchase_price_minor: number | null;
  currency: string;
  purchased_at: string | null;
  note: string | null;
  status: string;
  user_verified_json: string;
  from_template_id: string | null;
  created_at: string;
  updated_at: string;
}

function fromRow(r: Row): GarmentItem {
  return {
    id: r.id,
    name: r.name,
    category: r.category as GarmentItem['category'],
    subcategory: r.subcategory,
    sourceType: r.source_type as GarmentItem['sourceType'],
    originalUri: r.original_uri,
    thumbnailUri: r.thumbnail_uri,
    cutoutUri: r.cutout_uri,
    colorIds: parseJsonArray(r.color_ids_json),
    pattern: r.pattern as GarmentItem['pattern'],
    fit: r.fit as GarmentItem['fit'],
    seasonTags: parseJsonArray(r.season_tags_json),
    styleTags: parseJsonArray(r.style_tags_json),
    occasionTags: parseJsonArray(r.occasion_tags_json),
    outerWeight: r.outer_weight as GarmentItem['outerWeight'],
    waterResistant: r.water_resistant == null ? null : r.water_resistant === 1,
    brand: r.brand,
    sizeLabel: r.size_label,
    purchasePriceMinor: r.purchase_price_minor,
    currency: 'KRW',
    purchasedAt: r.purchased_at,
    note: r.note,
    status: r.status as GarmentItem['status'],
    userVerifiedFields: parseJsonArray(r.user_verified_json),
    fromTemplateId: r.from_template_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listGarments(category?: GarmentCategory | null): Promise<GarmentItem[]> {
  const db = await getDb();
  const rows = category
    ? await db.getAllAsync<Row>("SELECT * FROM garments WHERE status = 'active' AND category = ? ORDER BY updated_at DESC", category)
    : await db.getAllAsync<Row>("SELECT * FROM garments WHERE status = 'active' ORDER BY updated_at DESC");
  return rows.map(fromRow);
}

export async function getGarment(id: string): Promise<GarmentItem | null> {
  const db = await getDb();
  const r = await db.getFirstAsync<Row>('SELECT * FROM garments WHERE id = ?', id);
  return r ? fromRow(r) : null;
}

export async function saveGarment(g: GarmentItem): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO garments (id, name, category, subcategory, source_type, original_uri, thumbnail_uri, cutout_uri, color_ids_json, pattern, fit,
      season_tags_json, style_tags_json, occasion_tags_json, outer_weight, water_resistant, brand, size_label, purchase_price_minor, currency,
      purchased_at, note, status, user_verified_json, from_template_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, subcategory=excluded.subcategory,
      original_uri=excluded.original_uri, thumbnail_uri=excluded.thumbnail_uri, cutout_uri=excluded.cutout_uri,
      color_ids_json=excluded.color_ids_json, pattern=excluded.pattern, fit=excluded.fit, season_tags_json=excluded.season_tags_json,
      style_tags_json=excluded.style_tags_json, occasion_tags_json=excluded.occasion_tags_json, outer_weight=excluded.outer_weight,
      water_resistant=excluded.water_resistant, brand=excluded.brand, size_label=excluded.size_label,
      purchase_price_minor=excluded.purchase_price_minor, purchased_at=excluded.purchased_at, note=excluded.note, status=excluded.status,
      user_verified_json=excluded.user_verified_json, updated_at=excluded.updated_at`,
    g.id,
    g.name,
    g.category,
    g.subcategory,
    g.sourceType,
    g.originalUri,
    g.thumbnailUri,
    g.cutoutUri,
    JSON.stringify(g.colorIds),
    g.pattern,
    g.fit,
    JSON.stringify(g.seasonTags),
    JSON.stringify(g.styleTags),
    JSON.stringify(g.occasionTags),
    g.outerWeight,
    g.waterResistant == null ? null : g.waterResistant ? 1 : 0,
    g.brand,
    g.sizeLabel,
    g.purchasePriceMinor,
    g.currency,
    g.purchasedAt,
    g.note,
    g.status,
    JSON.stringify(g.userVerifiedFields),
    g.fromTemplateId,
    g.createdAt,
    g.updatedAt,
  );
}

/**
 * Deletes the garment row, its wear links (events themselves stay — the day's log is kept) and its
 * derived files. Original library photos are untouched.
 */
export async function deleteGarment(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM garments WHERE id = ?', id);
  deleteGarmentFiles(id);
}

export async function countOwnedByCategory(): Promise<Record<string, number>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ category: string; n: number }>("SELECT category, COUNT(*) AS n FROM garments WHERE status = 'active' GROUP BY category");
  return Object.fromEntries(rows.map((r) => [r.category, r.n]));
}
