/**
 * Ordered schema migrations; index + 1 = `PRAGMA user_version`. Never edit a shipped migration —
 * append a new one. Schema notes: docs/DATA_MODEL.md.
 * Photos are never stored as BLOBs — only app-private file URIs.
 */
export const MIGRATIONS: string[] = [
  // v1
  `
  CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);

  CREATE TABLE IF NOT EXISTS garments (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    source_type TEXT NOT NULL,
    original_uri TEXT,
    thumbnail_uri TEXT,
    cutout_uri TEXT,
    color_ids_json TEXT NOT NULL DEFAULT '[]',
    pattern TEXT NOT NULL DEFAULT 'solid',
    fit TEXT,
    season_tags_json TEXT NOT NULL DEFAULT '[]',
    style_tags_json TEXT NOT NULL DEFAULT '[]',
    occasion_tags_json TEXT NOT NULL DEFAULT '[]',
    outer_weight TEXT,
    water_resistant INTEGER,
    brand TEXT,
    size_label TEXT,
    purchase_price_minor INTEGER CHECK (purchase_price_minor IS NULL OR purchase_price_minor >= 0),
    currency TEXT NOT NULL DEFAULT 'KRW',
    purchased_at TEXT,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    user_verified_json TEXT NOT NULL DEFAULT '[]',
    from_template_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_garments_cat ON garments(status, category, updated_at);

  CREATE TABLE IF NOT EXISTS outfits (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    item_refs_json TEXT NOT NULL,
    style_tags_json TEXT NOT NULL DEFAULT '[]',
    occasion TEXT,
    source TEXT NOT NULL,
    thumbnail_uri TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS canvas_layouts (
    outfit_id TEXT PRIMARY KEY NOT NULL REFERENCES outfits(id) ON DELETE CASCADE,
    layout_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS wear_events (
    id TEXT PRIMARY KEY NOT NULL,
    date TEXT NOT NULL,
    outfit_id TEXT REFERENCES outfits(id) ON DELETE SET NULL,
    note TEXT,
    idempotency_key TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_wear_date ON wear_events(date);

  -- Owned garments only. Deleting a garment removes its links but keeps the day's event.
  CREATE TABLE IF NOT EXISTS wear_event_items (
    wear_event_id TEXT NOT NULL REFERENCES wear_events(id) ON DELETE CASCADE,
    garment_id TEXT NOT NULL REFERENCES garments(id) ON DELETE CASCADE,
    PRIMARY KEY (wear_event_id, garment_id)
  );
  CREATE INDEX IF NOT EXISTS idx_wear_items_garment ON wear_event_items(garment_id);

  CREATE TABLE IF NOT EXISTS feedback_events (
    id TEXT PRIMARY KEY NOT NULL,
    type TEXT NOT NULL,
    subject_key TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  `,
];
