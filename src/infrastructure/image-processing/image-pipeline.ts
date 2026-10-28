import { ImageManipulator, SaveFormat, type ImageManipulatorContext, type ImageRef } from 'expo-image-manipulator';

import { AppError } from '@/domain/errors';

/**
 * expo-image-manipulator decodes the source natively (incl. HEIC + EXIF orientation), downsizes and
 * re-encodes. The full-resolution original is never held in JS memory and never modified.
 * Pattern ported from CutPick (docs/DECISIONS.md D-007).
 */

export type Size = { width: number; height: number };

function fitLongestSide(src: Size, maxSide: number): { width?: number; height?: number } {
  if (!src.width || !src.height) return { width: maxSide };
  if (Math.max(src.width, src.height) <= maxSide) return { width: src.width };
  return src.width >= src.height ? { width: maxSide } : { height: maxSide };
}

function release(obj: unknown): void {
  try {
    (obj as { release?: () => void })?.release?.();
  } catch {
    // shared object already released
  }
}

export interface RenderedJpeg {
  uri: string;
  width: number;
  height: number;
  base64?: string;
}

/** Downscales an image to a JPEG. Output has no EXIF block from the source (re-encoded bitmap). */
export function renderJpeg(uri: string, size: Size, maxSide: number, quality: number, withBase64 = false): Promise<RenderedJpeg> {
  return renderImage(uri, size, maxSide, quality, withBase64, 'jpeg');
}

/**
 * Downscales and re-encodes (no EXIF carried over). `png` keeps transparency — use it for sources
 * that may have an alpha channel (PNG/WebP product cut-outs), which JPEG would turn black.
 */
export async function renderImage(uri: string, size: Size, maxSide: number, quality: number, withBase64: boolean, format: 'jpeg' | 'png'): Promise<RenderedJpeg> {
  let ctx: ImageManipulatorContext | null = null;
  let ref: ImageRef | null = null;
  try {
    ctx = ImageManipulator.manipulate(uri);
    ctx.resize(fitLongestSide(size, maxSide));
    ref = await ctx.renderAsync();
    const out = await ref.saveAsync({ format: format === 'png' ? SaveFormat.PNG : SaveFormat.JPEG, compress: quality, base64: withBase64 });
    return { uri: out.uri, width: out.width, height: out.height, base64: out.base64 };
  } catch (e) {
    throw new AppError('decode-failed', undefined, e);
  } finally {
    release(ref);
    release(ctx);
  }
}
