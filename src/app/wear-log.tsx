import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card, ErrorState, GhostButton, InlineMessage, PillSegment, Row, ScreenScroll, SourceBadge, elevation, radius, spacing, useColors } from '@/design-system';
import { toUserMessage } from '@/domain/errors';
import type { GarmentItem, ISODate } from '@/domain/models';
import { localDay } from '@/domain/wear';
import { ItemVisual } from '@/features/outfit-builder/components/ItemVisual';
import { listOutfits } from '@/features/outfit-builder/outfit-repository';
import { listGarments } from '@/features/wardrobe/garment-repository';
import { addMonths, monthRange } from '@/features/wear-log/calendar';
import { WearCalendar } from '@/features/wear-log/components/WearCalendar';
import { deleteWear, garmentWearStats, listWearsBetween, moveWear } from '@/features/wear-log/wear-repository';
import { useAppState } from '@/hooks/app-state';
import { useAsync } from '@/hooks/use-async';

type Range = 'all' | 'month' | 'year';
const DAY = 24 * 60 * 60 * 1000;
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;
const md = (day: ISODate) => `${Number(day.slice(5, 7))}월 ${Number(day.slice(8))}일`;

/** Showcase example rows, shown only while there are no records. Never stored, never counted. */
const EXAMPLES = [
  { id: 'ex-1', templateId: 'ph-zip-jacket-black', name: '블랙 집업 재킷', wears: 5, price: 45000 },
  { id: 'ex-2', templateId: 'ph-jeans-mid', name: '와이드 데님', wears: 8, price: 79000 },
  { id: 'ex-3', templateId: 'ph-knit-cream', name: '크림 니트', wears: 3, price: 12000 },
];

/**
 * 착용 기록 (showcase): 전체 | 이번달 | 올해 · 이번 주 달력(펼치면 월 달력) · 그날 기록(날짜 수정·삭제) ·
 * 옷별 착용 횟수와 CPW. Counts come from wear events of owned garments only (samples are never recorded).
 */
export default function WearLogScreen() {
  const router = useRouter();
  const c = useColors();
  const { dataVersion, bumpData } = useAppState();
  const [range, setRange] = useState<Range>('all');
  const today = useMemo(() => new Date(), []);
  const todayKey = localDay(today);
  const [monthView, setMonthView] = useState(false);
  const [ym, setYm] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDay, setSelectedDay] = useState<ISODate | null>(null);
  /** Wear event being moved ("날짜 바꾸기"): the next day tap is the target. */
  const [moving, setMoving] = useState<string | null>(null);
  const [note, setNote] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const from = range === 'month' ? localDay(new Date(today.getFullYear(), today.getMonth(), 1)) : range === 'year' ? localDay(new Date(today.getFullYear(), 0, 1)) : '2000-01-01';
  const data = useAsync(async () => ({ wears: await listWearsBetween(from, todayKey), garments: await listGarments(), stats: await garmentWearStats() }), [dataVersion, from]);
  const cal = monthRange(ym);
  // The week strip can span two months, so the day list reads from both month and week ranges.
  const weekStart = localDay(new Date(today.getTime() - today.getDay() * DAY));
  const calFrom = cal.from < weekStart ? cal.from : weekStart;
  const calTo = cal.to > todayKey ? cal.to : todayKey;
  const calData = useAsync(async () => ({ wears: await listWearsBetween(calFrom, calTo), outfits: await listOutfits(500) }), [dataVersion, calFrom, calTo]);

  const week = useMemo(() => {
    const start = new Date(today.getTime() - today.getDay() * DAY);
    return Array.from({ length: 7 }, (_, i) => new Date(start.getTime() + i * DAY));
  }, [today]);
  const wornDays = useMemo(() => new Set((calData.data?.wears ?? []).map((w) => w.date)), [calData.data]);
  const garmentById = useMemo(() => new Map((data.data?.garments ?? []).map((g) => [g.id, g])), [data.data]);
  const dayEvents = selectedDay ? (calData.data?.wears ?? []).filter((w) => w.date === selectedDay) : [];

  const rows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const w of data.data?.wears ?? []) for (const id of w.garmentIds) counts.set(id, (counts.get(id) ?? 0) + 1);
    return [...counts.entries()]
      .map(([id, n]) => ({ g: garmentById.get(id), n }))
      .filter((r): r is { g: GarmentItem; n: number } => !!r.g)
      .sort((a, b) => b.n - a.n);
  }, [data.data, garmentById]);

  const onDay = async (day: ISODate) => {
    setNote(null);
    if (!moving) return setSelectedDay(day === selectedDay ? null : day);
    try {
      const r = await moveWear(moving, day);
      setMoving(null);
      if (r === 'duplicate') return setNote({ tone: 'error', text: '그날 이미 같은 코디 기록이 있어 옮기지 않았어요.' });
      if (r === 'notFound') return setNote({ tone: 'error', text: '기록을 찾을 수 없어요. 이미 삭제됐을 수 있어요.' });
      setSelectedDay(day);
      setNote({ tone: 'success', text: `${md(day)}로 옮겼어요.` });
      bumpData();
    } catch (e) {
      setMoving(null);
      setNote({ tone: 'error', text: toUserMessage(e) });
    }
  };

  const confirmDelete = (eventId: string) =>
    Alert.alert('이 착용 기록을 삭제할까요?', '옷의 착용 횟수와 CPW에서 빠져요. 옷과 코디는 그대로예요.', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteWear(eventId).then(bumpData, (e) => setNote({ tone: 'error', text: toUserMessage(e) })) },
    ]);

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

      {monthView || moving ? (
        <View style={{ gap: spacing.xs }}>
          <WearCalendar
            year={ym.year}
            month={ym.month}
            today={todayKey}
            wornDays={wornDays}
            selected={selectedDay}
            onSelect={onDay}
            onPrev={() => setYm((v) => addMonths(v, -1))}
            onNext={() => setYm((v) => addMonths(v, 1))}
            picking={!!moving}
          />
          {!moving ? (
            <Pressable onPress={() => setMonthView(false)} hitSlop={10} accessibilityRole="button" style={{ alignSelf: 'center' }}>
              <AppText variant="caption" tone="secondary">
                이번 주만 보기
              </AppText>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <AppText variant="bodyStrong">{today.getMonth() + 1}월</AppText>
            <Pressable onPress={() => (setYm({ year: today.getFullYear(), month: today.getMonth() }), setMonthView(true))} hitSlop={10} accessibilityRole="button">
              <AppText variant="caption" tone="secondary">
                달력 펼치기
              </AppText>
            </Pressable>
          </Row>
          <Row style={{ justifyContent: 'space-between' }}>
            {week.map((d) => {
              const key = localDay(d);
              const isToday = key === todayKey;
              const on = selectedDay ? selectedDay === key : isToday;
              const worn = wornDays.has(key);
              return (
                <Pressable
                  key={key}
                  onPress={() => onDay(key)}
                  disabled={key > todayKey}
                  style={{ alignItems: 'center', gap: 6, flex: 1 }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedDay === key, disabled: key > todayKey }}
                  accessibilityLabel={`${d.getDate()}일${isToday ? ', 오늘' : ''}${worn ? ', 착용 기록 있음' : ''}`}
                >
                  <AppText variant="caption" tone="tertiary">
                    {isToday ? '오늘' : WEEK[d.getDay()]}
                  </AppText>
                  <View style={[styles.day, on && { backgroundColor: c.selected }]}>
                    <AppText variant="label" style={{ color: on ? c.selectedText : key > todayKey ? c.textTertiary : c.textPrimary }}>
                      {d.getDate()}
                    </AppText>
                  </View>
                  <View style={[styles.wornDot, { backgroundColor: worn ? c.textPrimary : 'transparent' }]} />
                </Pressable>
              );
            })}
          </Row>
        </View>
      )}

      {note ? <InlineMessage tone={note.tone} message={note.text} /> : null}
      {selectedDay ? (
        <Card>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="bodyStrong">{md(selectedDay)} 기록</AppText>
            {dayEvents.length === 0 ? (
              <AppText variant="secondary" tone="tertiary">
                이날은 착용 기록이 없어요
              </AppText>
            ) : (
              dayEvents.map((ev) => {
                const title = (ev.outfitId && calData.data?.outfits.find((o) => o.id === ev.outfitId)?.title) || '직접 기록';
                return (
                  <View key={ev.id} style={{ gap: spacing.xs }}>
                    <AppText variant="label">{title}</AppText>
                    <Row gap={spacing.xs} wrap>
                      {ev.garmentIds.map((id) => (
                        <View key={id} style={[styles.mini, { backgroundColor: c.photoBackdrop }]}>
                          <ItemVisual itemRef={{ kind: 'ownedGarment', garmentItemId: id }} owned={garmentById.get(id)} size={44} />
                        </View>
                      ))}
                    </Row>
                    {moving === ev.id ? (
                      <GhostButton label="날짜 바꾸기 취소" icon="close" onPress={() => setMoving(null)} />
                    ) : (
                      <Row gap={spacing.xs}>
                        <GhostButton label="날짜 바꾸기" icon="calendar-outline" onPress={() => (setNote(null), setYm({ year: Number(ev.date.slice(0, 4)), month: Number(ev.date.slice(5, 7)) - 1 }), setMoving(ev.id))} />
                        <GhostButton label="삭제" icon="trash-outline" onPress={() => confirmDelete(ev.id)} />
                      </Row>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </Card>
      ) : null}

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
  mini: { width: 52, height: 52, borderRadius: radius.photo, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cpw: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
});
