import { Image } from 'react-native';

import { AppError } from '@/domain/errors';

/**
 * Web development preview. Browsers block cross-site page reads (CORS), so most shops fail here —
 * link import is a native feature; this stub exists so the preview bundles.
 */
export async function fetchPageHtml(url: string): Promise<string> {
  try {
    const res = await fetch(url, { credentials: 'omit' });
    if (!res.ok) throw new AppError('link-unreadable');
    return await res.text();
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError('link-unreadable', undefined, e);
  }
}

export async function downloadProductImage(imageUrl: string): Promise<{ uri: string; width: number; height: number }> {
  const size = await new Promise<{ width: number; height: number }>((resolve, reject) => Image.getSize(imageUrl, (width, height) => resolve({ width, height }), reject)).catch((e) => {
    throw new AppError('link-unreadable', undefined, e);
  });
  return { uri: imageUrl, ...size };
}
