import * as ImagePicker from 'expo-image-picker';

import { AppError } from '@/domain/errors';
import type { GarmentItem } from '@/domain/models';
import { renderJpeg } from '@/infrastructure/image-processing/image-pipeline';
import { persistGarmentFile } from '@/infrastructure/file-storage/app-files';

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
