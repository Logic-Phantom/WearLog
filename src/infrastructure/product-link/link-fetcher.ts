import { Directory, File, Paths } from 'expo-file-system';
import { Image } from 'react-native';

import { AppError } from '@/domain/errors';

const TIMEOUT_MS = 10_000;
/** Product pages can be large; metadata lives in <head>, so stop reading after this. */
const MAX_HTML_CHARS = 600_000;

/**
 * Fetches a product page's HTML directly from the device (no WearLog server in between). Only the
 * URL the user pasted is requested; no cookies or account data are attached.
 */
export async function fetchPageHtml(url: string): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'ko-KR,ko;q=0.9' }, credentials: 'omit' });
    if (!res.ok) throw new AppError('link-unreadable');
    return (await res.text()).slice(0, MAX_HTML_CHARS);
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError('network', undefined, e);
  } finally {
    clearTimeout(timer);
  }
}

/** Downloads the product image into the cache; the garment pipeline then makes its own copies. */
export async function downloadProductImage(imageUrl: string): Promise<{ uri: string; width: number; height: number }> {
  try {
    const dir = new Directory(Paths.cache, 'wearlog-link-import');
    if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
    const ext = /\.png(\?|$)/i.test(imageUrl) ? 'png' : /\.webp(\?|$)/i.test(imageUrl) ? 'webp' : 'jpg';
    const file = await File.downloadFileAsync(imageUrl, new File(dir, `import-${Date.now()}.${ext}`), { idempotent: true });
    const size = await new Promise<{ width: number; height: number }>((resolve, reject) => Image.getSize(file.uri, (width, height) => resolve({ width, height }), reject));
    return { uri: file.uri, ...size };
  } catch (e) {
    throw new AppError('link-unreadable', undefined, e);
  }
}
