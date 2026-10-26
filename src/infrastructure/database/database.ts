import * as SQLite from 'expo-sqlite';

import { MIGRATIONS } from './migrations';

/**
 * Local-first store. Metadata and app-private file URIs only — never photo binaries.
 * The file is not encrypted; it relies on the OS app sandbox (docs/PRIVACY.md).
 */
const DB_NAME = 'wearlog.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  if (process.env.EXPO_OS !== 'web') await db.execAsync('PRAGMA journal_mode = WAL;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < MIGRATIONS.length) {
    // Each migration and its version bump commit together, so a crash never leaves a half-applied step.
    const next = version + 1;
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[next - 1]);
      await db.execAsync(`PRAGMA user_version = ${next}`);
    });
    version = next;
  }
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await migrate(db);
      return db;
    })();
    dbPromise.catch(() => {
      dbPromise = null;
    });
  }
  return dbPromise;
}

export async function kvGet<T>(key: string): Promise<T | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM kv WHERE key = ?', key);
  if (!row) return null;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return null;
  }
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, JSON.stringify(value));
}

export async function kvDelete(key: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM kv WHERE key = ?', key);
}

/** "전체 데이터 삭제". Derived files are cleared by the caller (file-storage). */
export async function wipeAllTables(): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM wear_event_items; DELETE FROM wear_events; DELETE FROM canvas_layouts; DELETE FROM outfits; DELETE FROM garments; DELETE FROM feedback_events; DELETE FROM kv;');
  });
}

export function parseJsonArray<T>(json: string | null | undefined): T[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}
