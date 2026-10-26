import { AppError } from '@/domain/errors';
import { scanJpegMetadata } from '@/infrastructure/image-processing/jpeg-metadata';
import { renderJpeg, type Size } from '@/infrastructure/image-processing/image-pipeline';
import { base64ToBytes } from '@/utils/base64';

import type { FeedPost, NewPostInput } from './community-repository';
import { COMMUNITY_LIMITS } from './moderation-policy';
import { communityRepository } from './supabase-community-repository';

/**
 * Builds the share derivative from an image the user chose at publish time (outfit photo or a
 * rendered canvas snapshot): re-encoded JPEG (long side ≤ 1440) + thumbnail. Re-encoding drops the
 * source EXIF block; the GPS scan below is a second guard. The local original is untouched.
 */
export async function prepareShareDerivative(localUri: string, size: Size) {
  const image = await renderJpeg(localUri, size, COMMUNITY_LIMITS.imageMaxSide, COMMUNITY_LIMITS.imageQuality, true);
  const thumb = await renderJpeg(localUri, size, COMMUNITY_LIMITS.thumbMaxSide, COMMUNITY_LIMITS.thumbQuality, true);
  if (!image.base64 || !thumb.base64) throw new Error('derivative-missing-data');
  const imageBytes = base64ToBytes(image.base64);
  const thumbBytes = base64ToBytes(thumb.base64);
  if (scanJpegMetadata(imageBytes).hasGps || scanJpegMetadata(thumbBytes).hasGps) {
    throw new AppError('validation', '공유용 사본에서 위치 정보가 발견돼 업로드를 중단했어요.');
  }
  if (imageBytes.byteLength > COMMUNITY_LIMITS.maxUploadBytes) throw new AppError('validation', '이미지가 너무 커요.');
  return {
    image: { bytes: imageBytes, width: image.width, height: image.height },
    thumb: { bytes: thumbBytes, width: thumb.width, height: thumb.height },
    previewUri: `data:image/jpeg;base64,${thumb.base64}`,
  };
}

export interface PublishConsent {
  imageIsPublic: boolean;
  handleAndTagsArePublic: boolean;
  visibleUntilDeleted: boolean;
}

export function consentComplete(c: PublishConsent): boolean {
  return c.imageIsPublic && c.handleAndTagsArePublic && c.visibleUntilDeleted;
}

/** Explicit opt-in publish: refuses without all consent boxes (prompt §3.10). */
export async function publishOutfit(
  derivative: Awaited<ReturnType<typeof prepareShareDerivative>>,
  meta: Omit<NewPostInput, 'image' | 'thumb'>,
  consent: PublishConsent,
): Promise<FeedPost> {
  if (!consentComplete(consent)) throw new AppError('validation', '공개 전 확인 항목에 모두 동의해 주세요.');
  return communityRepository.createPost({ image: derivative.image, thumb: derivative.thumb, ...meta });
}
