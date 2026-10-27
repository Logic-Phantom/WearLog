import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { GarmentEditor, emptyGarment } from '@/features/wardrobe/components/GarmentEditor';
import { useAppState } from '@/hooks/app-state';

/**
 * 옷 등록 (사진 · 쇼핑몰 링크 · 직접 입력). Also the landing screen for "공유 → WearLog": a shared
 * photo arrives as `sharedImage`, a shared link/text as `sharedLink` (ShareIntentRouter).
 */
export default function AddGarmentScreen() {
  const router = useRouter();
  const { bumpData } = useAppState();
  const params = useLocalSearchParams<{ sharedImage?: string; sharedWidth?: string; sharedHeight?: string; sharedLink?: string }>();
  const [initial] = useState(emptyGarment);
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
