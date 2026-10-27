import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, ErrorState, PillSegment, Row, ScreenScroll, SourceBadge, elevation, radius, spacing, useColors } from '@/design-system';
import type { GarmentItem } from '@/domain/models';
import { localDay } from '@/domain/wear';
import { ItemVisual } from '@/features/outfit-builder/components/ItemVisual';
import { listGarments } from '@/features/wardrobe/garment-repository';
import { garmentWearStats, listWearsBetween } from '@/features/wear-log/wear-repository';
import { useAppState } from '@/hooks/app-state';
import { useAsync } from '@/hooks/use-async';

type Range = 'all' | 'month' | 'year';
const DAY = 24 * 60 * 60 * 1000;
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

/** Showcase example rows, shown only while there are no records. Never stored, never counted. */
const EXAMPLES = [
  { id: 'ex-1', templateId: 'ph-zip-jacket-black', name: '블랙 집업 재킷', wears: 5, price: 45000 },
  { id: 'ex-2', templateId: 'ph-jeans-mid', name: '와이드 데님', wears: 8, price: 79000 },
  { id: 'ex-3', templateId: 'ph-knit-cream', name: '크림 니트', wears: 3, price: 12000 },
];

/**
 * 착용 기록 (showcase): 전체 | 이번달 | 올해 · 이번 주 달력 · 옷별 착용 횟수와 CPW.
 * Counts come from wear events of owned garments only (samples are never recorded).
 */
export default function WearLogScreen() {
  const router = useRouter();
  const c = useColors();
  const { dataVersion } = useAppState();
  const [range, setRange] = useState<Range>('all');
  const today = useMemo(() => new Date(), []);
  const from = range === 'month' ? localDay(new Date(today.getFullYear(), today.getMonth(), 1)) : range === 'year' ? localDay(new Date(today.getFullYear(), 0, 1)) : '2000-01-01';
  const data = useAsync(async () => ({ wears: await listWearsBetween(from, localDay(today)), garments: await listGarments(), stats: await garmentWearStats() }), [dataVersion, from]);

  const week = useMemo(() => {
    const start = new Date(today.getTime() - today.getDay() * DAY);
    return Array.from({ length: 7 }, (_, i) => new Date(start.getTime() + i * DAY));
  }, [today]);
  const wornDays = useMemo(() => new Set((data.data?.wears ?? []).map((w) => w.date)), [data.data]);

  const rows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const w of data.data?.wears ?? []) for (const id of w.garmentIds) counts.set(id, (counts.get(id) ?? 0) + 1);
    const byId = new Map((data.data?.garments ?? []).map((g) => [g.id, g]));
    return [...counts.entries()]
      .map(([id, n]) => ({ g: byId.get(id), n }))
      .filter((r): r is { g: GarmentItem; n: number } => !!r.g)
      .sort((a, b) => b.n - a.n);
  }, [data.data]);

  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;

  return (
    <ScreenScroll>
      <PillSegment
        tone="ink"
        options={[
          { id: 'all', label: '전체' },
          { id: 'month', label: '이번달' },
          { id: 'year', label: '올해' },
        ]}
        value={range}
        onChange={setRange}
      />

      <View style={{ gap: spacing.sm }}>
        <AppText variant="bodyStrong">{today.getMonth() + 1}월</AppText>
        <Row style={{ justifyContent: 'space-between' }}>
          {week.map((d) => {
            const isToday = localDay(d) === localDay(today);
            const worn = wornDays.has(localDay(d));
            return (
              <View key={d.toISOString()} style={{ alignItems: 'center', gap: 6, flex: 1 }} accessible accessibilityLabel={`${d.getDate()}일${isToday ? ', 오늘' : ''}${worn ? ', 착용 기록 있음' : ''}`}>
                <AppText variant="caption" tone="tertiary">
                  {isToday ? '오늘' : WEEK[d.getDay()]}
                </AppText>
                <View style={[styles.day, isToday && { backgroundColor: c.selected }]}>
                  <AppText variant="label" style={{ color: isToday ? c.selectedText : c.textPrimary }}>
                    {d.getDate()}
                  </AppText>
                </View>
                <View style={[styles.wornDot, { backgroundColor: worn ? c.textPrimary : 'transparent' }]} />
              </View>
            );
          })}
        </Row>
      </View>

      {rows.length > 0 ? (
        rows.map(({ g, n }) => {
          // CPW is lifetime (price ÷ all wears); the range only filters which wears are counted here.
          const cpw = data.data?.stats.get(g.id)?.cpw;
          return (
            <LogCard key={g.id} visual={<ItemVisual itemRef={{ kind: 'ownedGarment', garmentItemId: g.id }} owned={g} size={64} />} name={g.name} wears={n} price={g.purchasePriceMinor} cpw={cpw?.kind === 'value' ? cpw.cpwMinor : null} onPress={() => router.push({ pathname: '/wardrobe/[itemId]', params: { itemId: g.id } })} />
          );
        })
      ) : (
        <>
          <Row gap={6}>
            <SourceBadge source="sample" />
            <AppText variant="caption" tone="tertiary" style={{ flex: 1 }}>
              예시 화면이에요. 코디 빌더에서 내 옷으로 &apos;오늘 착용함&apos;을 누르면 여기에 쌓여요.
            </AppText>
          </Row>
          {EXAMPLES.map((e) => (
            <LogCard key={e.id} visual={<ItemVisual itemRef={{ kind: 'sampleTemplate', templateId: e.templateId, customization: { colorId: 'black' } }} size={64} variant="tile" />} name={e.name} wears={e.wears} price={e.price} cpw={Math.round(e.price / e.wears)} muted />
          ))}
        </>
      )}
    </ScreenScroll>
  );
}

function LogCard({ visual, name, wears, price, cpw, onPress, muted }: { visual: React.ReactNode; name: string; wears: number; price: number | null; cpw: number | null; onPress?: () => void; muted?: boolean }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={`${muted ? '예시, ' : ''}${name}, ${wears}회 착용${cpw != null ? `, CPW ${won(cpw)}` : ''}`} style={[styles.card, elevation.card, { backgroundColor: c.surface, opacity: muted ? 0.8 : 1 }]}>
      <View style={[styles.thumb, { backgroundColor: c.photoBackdrop }]}>{visual}</View>
      <View style={{ flex: 1, gap: 4 }}>
        <AppText variant="bodyStrong">{name}</AppText>
        <AppText variant="caption" tone="secondary">
          {wears}회 착용{price != null ? ` · ${won(price)}` : ''}
        </AppText>
        <View style={[styles.cpw, { backgroundColor: c.surfaceSunken }]}>
          <AppText variant="caption">{cpw != null ? `CPW ${won(cpw)}` : 'CPW · 가격 입력 시 계산'}</AppText>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={c.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  day: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  wornDot: { width: 4, height: 4, borderRadius: 2 },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.tile },
  thumb: { width: 64, height: 64, borderRadius: radius.photo, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  cpw: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
});
