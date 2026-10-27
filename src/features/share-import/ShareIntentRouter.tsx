import { useRouter } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import { useEffect } from 'react';
import { Alert } from 'react-native';

import { toAddParams, toSharedGarmentInput } from './shared-content';

/**
 * Opens 옷 등록 with whatever another app shared to WearLog (Instagram, a shopping app, the
 * gallery). Nothing is saved until the user presses 등록하기; the payload is cleared right away.
 */
export function ShareIntentRouter() {
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent, error } = useShareIntentContext();

  useEffect(() => {
    if (!hasShareIntent) return;
    const input = toSharedGarmentInput(shareIntent);
    resetShareIntent();
    if (!input) return;
    if (input.kind === 'unsupported') {
      Alert.alert('공유한 내용을 쓸 수 없어요', input.reason);
      return;
    }
    router.push({ pathname: '/wardrobe/add', params: toAddParams(input) });
  }, [hasShareIntent, shareIntent, resetShareIntent, router]);

  // e.g. an app shared a photo without granting read access (patches/expo-share-intent+9.0.0.patch).
  useEffect(() => {
    if (!error) return;
    console.warn('[wearlog:share] share intent error');
    // Clear the failed payload, or the module re-reads it every time the app becomes active.
    resetShareIntent();
    Alert.alert('공유한 사진을 읽지 못했어요', '보낸 앱이 사진 접근을 허용하지 않았을 수 있어요. 사진을 기기에 저장한 뒤 옷 등록에서 직접 올려 주세요.');
  }, [error, resetShareIntent]);

  return null;
}
