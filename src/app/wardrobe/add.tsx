import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { AppText, GhostButton, InlineMessage, Row, spacing } from '@/design-system';
import { toUserMessage } from '@/domain/errors';
import { getTemplate } from '@/features/sample-wardrobe/catalog';
import { BATCH_LIMIT, advanceBatch, batchLabel, batchSummary, startBatch, type BatchState } from '@/features/wardrobe/batch-import';
import { GarmentEditor } from '@/features/wardrobe/components/GarmentEditor';
import { emptyGarment, garmentFromTemplate } from '@/features/wardrobe/garment-draft';
import { pickGarmentPhotos } from '@/features/wardrobe/garment-import';
import { useAppState } from '@/hooks/app-state';

/**
 * 옷 등록 (사진 · 쇼핑몰 링크 · 직접 입력). Also the landing screen for "공유 → WearLog": a shared
 * photo arrives as `sharedImage`, a shared link/text as `sharedLink` (ShareIntentRouter).
 * `fromTemplate` (샘플 옷장 → "내 옷으로 등록") pre-fills attributes from a sample, never its photo.
 * "여러 장 한 번에 등록" queues photos (e.g. saved from Instagram) and opens the editor for each.
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
  const [batch, setBatch] = useState<BatchState | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/wardrobe'));

  const startMany = async () => {
    setBatchError(null);
    try {
      const s = startBatch(await pickGarmentPhotos(BATCH_LIMIT));
      if (s) setBatch(s);
    } catch (e) {
      setBatchError(toUserMessage(e));
    }
  };

  const next = (outcome: 'saved' | 'skipped') => {
    if (!batch) return;
    if (outcome === 'saved') bumpData();
    const after = advanceBatch(batch, outcome);
    if (after) return setBatch(after);
    const saved = batch.saved + (outcome === 'saved' ? 1 : 0);
    const skipped = batch.skipped + (outcome === 'skipped' ? 1 : 0);
    Alert.alert('여러 장 등록 완료', batchSummary(saved, skipped), [{ text: '확인', onPress: close }]);
  };

  if (batch) {
    return (
      <GarmentEditor
        // A fresh draft per photo: nothing carries over between garments.
        key={batch.index}
        initial={emptyGarment()}
        initialPhoto={batch.photos[batch.index]}
        onSaved={() => next('saved')}
        header={
          <Row style={{ justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <AppText variant="bodyStrong">
              여러 장 등록 {batchLabel(batch)}
            </AppText>
            <GhostButton label="이 사진 건너뛰기" icon="play-skip-forward-outline" onPress={() => next('skipped')} />
          </Row>
        }
      />
    );
  }

  return (
    <GarmentEditor
      initial={initial}
      initialPhoto={sharedPhoto}
      initialLink={params.sharedLink ?? null}
      onSaved={() => (bumpData(), close())}
      header={
        !sharedPhoto && !params.sharedLink && !params.fromTemplate ? (
          <View style={{ gap: spacing.xxs, marginBottom: spacing.sm }}>
            <GhostButton label={`여러 장 한 번에 등록 (최대 ${BATCH_LIMIT}장)`} icon="images-outline" onPress={startMany} />
            <AppText variant="caption" tone="tertiary" align="center">
              인스타그램·쇼핑몰에서 저장한 사진을 골라 한 벌씩 차례로 확인해요
            </AppText>
            {batchError ? <InlineMessage tone="error" message={batchError} /> : null}
          </View>
        ) : null
      }
    />
  );
}
