import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { getTemplate } from '@/features/sample-wardrobe/catalog';
import { GarmentEditor } from '@/features/wardrobe/components/GarmentEditor';
import { emptyGarment, garmentFromTemplate } from '@/features/wardrobe/garment-draft';
import { useAppState } from '@/hooks/app-state';

/**
 * 옷 등록 (사진 · 쇼핑몰 링크 · 직접 입력). Also the landing screen for "공유 → WearLog": a shared
 * photo arrives as `sharedImage`, a shared link/text as `sharedLink` (ShareIntentRouter).
 * `fromTemplate` (샘플 옷장 → "내 옷으로 등록") pre-fills attributes from a sample, never its photo.
 */
export default function AddGarmentScreen() {
  const router = useRouter();
  const { bumpData } = useAppState();
  const params = useLocalSearchParams<{ sharedImage?: string; sharedWidth?: string; sharedHeight?: string; sharedLink?: string; fromTemplate?: string }>();
  const [initial] = useState(() => {
    const t = params.fromTemplate ? getTemplate(params.fromTemplate) : undefined;
    return t ? garmentFromTemplate(t) : emptyGarment();
  });
  const [sharedPhoto] = useState(() => (params.sharedImage ? { uri: params.sharedImage, width: Number(params.sharedWidth) || 0, height: Number(params.sharedHeight) || 0 } : null));
  return (
    <GarmentEditor
      initial={initial}
      initialPhoto={sharedPhoto}
      initialLink={params.sharedLink ?? null}
      onSaved={() => {
        bumpData();
        if (router.canGoBack()) router.back();
        else router.replace('/wardrobe');
      }}
    />
  );
}
