import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { AppText, Card, DangerButton, ErrorState, ScreenScroll, SecondaryButton, spacing } from '@/design-system';
import { toUserMessage } from '@/domain/errors';
import { formatKrw } from '@/domain/wear';
import { GarmentEditor } from '@/features/wardrobe/components/GarmentEditor';
import { deleteGarment, getGarment } from '@/features/wardrobe/garment-repository';
import { garmentWearStats } from '@/features/wear-log/wear-repository';
import { useAppState } from '@/hooks/app-state';
import { useAsync } from '@/hooks/use-async';

/** 옷 상세: 착용 횟수·CPW(계산 근거 공개) + 수정 + 삭제 (기록 처리 방식 안내). */
export default function GarmentDetailScreen() {
  const router = useRouter();
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const { bumpData, dataVersion } = useAppState();
  const [editing, setEditing] = useState(false);
  const data = useAsync(async () => ({ g: await getGarment(itemId), stats: (await garmentWearStats()).get(itemId) ?? null }), [itemId, dataVersion]);

  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  if (!data.data) return null;
  const { g, stats } = data.data;
  if (!g) return <ErrorState title="옷을 찾을 수 없어요" message="삭제됐을 수 있어요." />;
  if (editing) return <GarmentEditor initial={g} onSaved={() => (bumpData(), setEditing(false))} />;

  const cpw = stats?.cpw;
  const cpwText = !cpw
    ? '계산 전'
    : cpw.kind === 'value'
      ? `${formatKrw(cpw.cpwMinor)} (${formatKrw(cpw.priceMinor)} ÷ ${cpw.wearCount}회)`
      : cpw.kind === 'noPrice'
        ? '가격 미입력'
        : '착용 기록 없음';

  const confirmDelete = () =>
    Alert.alert('이 옷을 삭제할까요?', '옷장과 앱 내 사진 사본이 삭제돼요. 착용 기록의 날짜는 남지만 이 옷과의 연결은 사라져요. 휴대폰 사진첩의 원본은 그대로예요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () =>
          deleteGarment(g.id)
            .then(() => (bumpData(), router.back()))
            .catch((e) => Alert.alert('삭제하지 못했어요', toUserMessage(e))),
      },
    ]);

  return (
    <ScreenScroll>
      <Stack.Screen options={{ title: g.name }} />
      <Card>
        <View style={{ gap: spacing.xs }}>
          <AppText variant="label">착용 횟수</AppText>
          <AppText variant="numeric">{stats?.wearCount ?? 0}회</AppText>
          <AppText variant="label">CPW (1회 착용당 비용)</AppText>
          <AppText variant="body">{cpwText}</AppText>
          {stats?.lastWornDay ? <AppText variant="caption" tone="secondary">마지막 착용 {stats.lastWornDay}</AppText> : null}
        </View>
      </Card>
      <SecondaryButton label="정보 수정" icon="create-outline" onPress={() => setEditing(true)} />
      <DangerButton label="삭제" icon="trash-outline" onPress={confirmDelete} />
    </ScreenScroll>
  );
}
