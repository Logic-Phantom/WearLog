import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { AppText, Card, DangerButton, ErrorState, ScreenScroll, SecondaryButton, ValueRow, radius, spacing, useColors } from '@/design-system';
import { FITS, GARMENT_CATEGORIES, OCCASIONS, OUTER_WEIGHTS, PATTERNS, SEASONS, STYLE_TAGS, labelOf } from '@/domain/categories';
import { toUserMessage } from '@/domain/errors';
import { getColor } from '@/domain/palette';
import { ItemVisual } from '@/features/outfit-builder/components/ItemVisual';
import { getTemplate } from '@/features/sample-wardrobe/catalog';
import { formatKrw } from '@/domain/wear';
import { GarmentEditor } from '@/features/wardrobe/components/GarmentEditor';
import { deleteGarment, getGarment } from '@/features/wardrobe/garment-repository';
import { garmentWearStats } from '@/features/wear-log/wear-repository';
import { useAppState } from '@/hooks/app-state';
import { useAsync } from '@/hooks/use-async';

/** 옷 상세: 사진·속성 + 착용 횟수·CPW(계산 근거 공개) + 수정 + 삭제 (기록 처리 방식 안내). */
export default function GarmentDetailScreen() {
  const router = useRouter();
  const c = useColors();
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

  const list = (ids: string[], vocab: readonly { id: string; label: string }[]) => (ids.length ? ids.map((id) => labelOf(vocab, id)).join(' · ') : null);
  const fromSample = g.fromTemplateId ? getTemplate(g.fromTemplateId) : undefined;
  const rows: [string, string | null][] = [
    ['카테고리', labelOf(GARMENT_CATEGORIES, g.category)],
    ['색상', g.colorIds.map((id) => getColor(id)?.nameKo ?? id).join(' · ') || null],
    ['패턴', labelOf(PATTERNS, g.pattern)],
    ['핏', g.fit ? labelOf(FITS, g.fit) : null],
    ['계절', list(g.seasonTags, SEASONS)],
    ['스타일', list(g.styleTags, STYLE_TAGS)],
    ['상황', list(g.occasionTags, OCCASIONS)],
    ['두께', g.outerWeight ? labelOf(OUTER_WEIGHTS, g.outerWeight) : null],
    ['방수', g.waterResistant == null ? null : g.waterResistant ? '예' : '아니요'],
    ['브랜드', g.brand],
    ['사이즈', g.sizeLabel],
    ['구매가', g.purchasePriceMinor != null ? formatKrw(g.purchasePriceMinor) : null],
    ['구매일', g.purchasedAt],
  ];

  return (
    <ScreenScroll>
      <Stack.Screen options={{ title: g.name }} />
      <View style={{ alignItems: 'center', justifyContent: 'center', borderRadius: radius.photo, backgroundColor: c.photoBackdrop, paddingVertical: spacing.md }}>
        <ItemVisual itemRef={{ kind: 'ownedGarment', garmentItemId: g.id }} owned={g} size={220} />
      </View>
      <View>
        {rows
          .filter((r): r is [string, string] => !!r[1])
          .map(([label, value]) => (
            <ValueRow key={label} label={label} value={value} />
          ))}
      </View>
      {g.note ? (
        <AppText variant="secondary" tone="secondary" selectable>
          {g.note}
        </AppText>
      ) : null}
      {fromSample ? (
        <AppText variant="caption" tone="tertiary">
          샘플 &apos;{fromSample.nameKo}&apos;의 속성을 가져와 등록한 내 옷이에요
        </AppText>
      ) : null}
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
