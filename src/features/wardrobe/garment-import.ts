import * as ImagePicker from 'expo-image-picker';

import type { GarmentCategory } from '@/domain/categories';
import { AppError } from '@/domain/errors';
import type { GarmentItem } from '@/domain/models';
import { renderJpeg } from '@/infrastructure/image-processing/image-pipeline';
import { persistGarmentFile } from '@/infrastructure/file-storage/app-files';
import { downloadProductImage, fetchPageHtml } from '@/infrastructure/product-link/link-fetcher';

import { cleanTitle, guessCategory, normalizeProductUrl, parseProductMeta, type ProductMeta } from './product-link';

/** Long side of the stored working copy / grid thumbnail. */
const WORKING_MAX = 1280;
const THUMB_MAX = 384;

export interface PickedPhoto {
  uri: string;
  width: number;
  height: number;
}

/**
 * OS photo picker (user selects one image; no library-wide access) or camera.
 * EXIF is not requested and not stored (prompt §10.1).
 */
export async function pickGarmentPhoto(source: 'library' | 'camera'): Promise<PickedPhoto | null> {
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new AppError('permission-denied');
  }
  const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, quality: 1, exif: false, allowsMultipleSelection: false };
  const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
  if (res.canceled || !res.assets?.[0]) return null;
  const a = res.assets[0];
  return { uri: a.uri, width: a.width, height: a.height };
}

/**
 * Several photos at once (여러 장 한 번에 등록) from the OS picker — in selection order, no cropping
 * (the picker can't crop multiple images). Each photo still goes through the editor.
 */
export async function pickGarmentPhotos(limit: number): Promise<PickedPhoto[]> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1, exif: false, allowsMultipleSelection: true, selectionLimit: limit, orderedSelection: true });
  if (res.canceled || !res.assets) return [];
  return res.assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height }));
}

/**
 * Stores derived copies (working JPEG + thumbnail) in the garment's app folder. The picked source
 * is only read. Background removal / segmentation is NOT done here — that waits for the Phase 0
 * vision POC (docs/VISION_POC.md); the UI says "자동 분석 미지원".
 */
export async function storeGarmentPhoto(photo: PickedPhoto, garmentId: string): Promise<Pick<GarmentItem, 'originalUri' | 'thumbnailUri'>> {
  const size = { width: photo.width, height: photo.height };
  const work = await renderJpeg(photo.uri, size, WORKING_MAX, 0.88, process.env.EXPO_OS === 'web');
  const thumb = await renderJpeg(photo.uri, size, THUMB_MAX, 0.8, process.env.EXPO_OS === 'web');
  const originalUri = await persistGarmentFile(work.uri, garmentId, 'original', work.base64);
  const thumbnailUri = await persistGarmentFile(thumb.uri, garmentId, 'thumb', thumb.base64);
  return { originalUri, thumbnailUri };
}

export interface LinkImport {
  photo: PickedPhoto;
  meta: ProductMeta;
  categoryHint: GarmentCategory | null;
  name: string | null;
}

/**
 * Shopping-mall link → product photo + suggested fields. Reads only the page's link-preview
 * metadata (Open Graph / schema.org Product). Pages that hide it behind a login or script render
 * fail with a clear message; the user can save the photo and upload it instead.
 */
export async function importFromProductLink(input: string): Promise<LinkImport> {
  const url = normalizeProductUrl(input);
  if (!url) throw new AppError('validation', '상품 페이지 링크(https://…)를 붙여 넣어 주세요.');
  // Instagram pages sit behind a login wall and its terms forbid automated reading (D-018).
  if (/(^|\.)(instagram\.com|instagr\.am)$/i.test(new URL(url).hostname)) {
    throw new AppError('validation', '인스타그램 게시물은 링크로 가져올 수 없어요. 사진을 기기에 저장한 뒤 「여러 장 한 번에 등록」이나 사진 추가로 올려 주세요.');
  }
  const meta = parseProductMeta(await fetchPageHtml(url), url);
  if (!meta.imageUrl) throw new AppError('link-unreadable');
  const photo = await downloadProductImage(meta.imageUrl);
  return { photo, meta, categoryHint: guessCategory(meta.title), name: cleanTitle(meta.title, meta.siteName) };
}
