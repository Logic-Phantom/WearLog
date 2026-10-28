import { Directory, File, Paths } from 'expo-file-system';

/**
 * App-private file storage (native). Only derived files live here — the user's picked original in
 * the photo library is never written, moved or deleted (prompt §0.7). Layout:
 *   wearlog/garments/<garmentId>/{original,thumb,cutout}.jpg|png
 */
const ROOT = 'wearlog';

export type GarmentFileKind = 'original' | 'thumb' | 'cutout';

function dir(...parts: string[]): Directory {
  const d = new Directory(Paths.document, ROOT, ...parts);
  if (!d.exists) d.create({ intermediates: true, idempotent: true });
  return d;
}

/** Moves a temporary manipulator output into the garment's folder; returns the persistent URI. */
export async function persistGarmentFile(tempUri: string, garmentId: string, kind: GarmentFileKind, _base64?: string, format?: 'jpeg' | 'png'): Promise<string> {
  const ext = (format ?? (kind === 'cutout' ? 'png' : 'jpeg')) === 'png' ? 'png' : 'jpg';
  const target = new File(dir('garments', garmentId), `${kind}.${ext}`);
  if (target.exists) target.delete();
  await new File(tempUri).move(target);
  return target.uri;
}

export function deleteGarmentFiles(garmentId: string): void {
  const d = new Directory(Paths.document, ROOT, 'garments', garmentId);
  if (d.exists) d.delete();
}

export function deleteAllAppFiles(): void {
  const d = new Directory(Paths.document, ROOT);
  if (d.exists) d.delete();
}

/** Whether a stored file is still reachable (shows a "사진 누락" state instead of crashing). */
export function isFileReachable(uri: string): boolean {
  try {
    if (!uri.startsWith('file:')) return true;
    return new File(uri).exists;
  } catch {
    return false;
  }
}

export function derivedStorageBytes(): number {
  const root = new Directory(Paths.document, ROOT);
  if (!root.exists) return 0;
  return root.size ?? 0;
}
