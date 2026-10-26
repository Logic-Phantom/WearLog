import { useMemo } from 'react';
import { Alert, View } from 'react-native';

import { AppText, Card, EmptyState, ErrorState, IconButton, Row, ScreenScroll, spacing } from '@/design-system';
import { toUserMessage } from '@/domain/errors';
import { localDay } from '@/domain/wear';
import { listGarments } from '@/features/wardrobe/garment-repository';
import { deleteWear, listWearsBetween } from '@/features/wear-log/wear-repository';
import { useAppState } from '@/hooks/app-state';
import { useAsync } from '@/hooks/use-async';

/** 착용 기록 (최근 60일 목록). Calendar month/week views: docs/ROADMAP.md Phase 5. */
export default function WearLogScreen() {
  const { dataVersion, bumpData } = useAppState();
  const data = useAsync(async () => {
    const now = new Date();
    const from = localDay(new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000));
    return { wears: await listWearsBetween(from, localDay(now)), garments: await listGarments() };
  }, [dataVersion]);
  const names = useMemo(() => new Map((data.data?.garments ?? []).map((g) => [g.id, g.name])), [data.data]);

  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  const wears = data.data?.wears ?? [];

  return (
    <ScreenScroll>
      {wears.length === 0 ? (
        <EmptyState icon="calendar-outline" title="아직 착용 기록이 없어요" message="코디 빌더에서 '오늘 착용함'을 누르면 내 옷의 착용 횟수와 CPW가 쌓여요. 샘플 아이템은 기록되지 않아요." />
      ) : (
        wears.map((w) => (
          <Card key={w.id}>
            <Row>
              <View style={{ flex: 1, gap: spacing.xxs }}>
                <AppText variant="bodyStrong">{w.date}</AppText>
                <AppText variant="secondary" tone="secondary">
                  {w.garmentIds.map((id) => names.get(id) ?? '삭제된 옷').join(' · ') || '연결된 옷 없음'}
                </AppText>
              </View>
              <IconButton
                icon="trash-outline"
                label={`${w.date} 기록 삭제`}
                onPress={() =>
                  Alert.alert('이 기록을 삭제할까요?', '착용 횟수와 CPW가 다시 계산돼요.', [
                    { text: '취소', style: 'cancel' },
                    { text: '삭제', style: 'destructive', onPress: () => deleteWear(w.id).then(bumpData).catch((e) => Alert.alert('삭제하지 못했어요', toUserMessage(e))) },
                  ])
                }
              />
            </Row>
          </Card>
        ))
      )}
    </ScreenScroll>
  );
}
