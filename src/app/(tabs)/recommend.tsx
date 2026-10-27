import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, FilterChip, InlineMessage, PillSegment, PrimaryButton, Row, ScreenScroll, SourceBadge, radius, spacing, successFeedback, useColors } from '@/design-system';
import { toUserMessage } from '@/domain/errors';
import type { Outfit } from '@/domain/models';
import { MANUAL_WEATHER_OPTIONS } from '@/domain/recommendation-policy';
import { OutfitBoard } from '@/features/outfit-builder/components/OutfitBoard';
import { autoLayout } from '@/features/outfit-builder/canvas-state';
import { saveOutfit } from '@/features/outfit-builder/outfit-repository';
import { useRecommendations, type RecommendMode } from '@/features/recommendations/use-recommendations';
import { isSnapshotFresh } from '@/features/weather/weather-signal';
import { useAppState } from '@/hooks/app-state';
import { newId } from '@/utils/id';

const NO_KEYS: string[] = [];

/**
 * 오늘의 추천 코디 (showcase): 날씨 맞춤 | 취향 맞춤 · 플랫레이 · 추천 이유 · 코디 저장하기.
 * 내 옷만 is the default pool; when it can't make an outfit the screen says so and shows a
 * photo-sample outfit labeled "샘플" (prompt §3.5 provenance).
 */
export default function RecommendScreen() {
  const router = useRouter();
  const c = useColors();
  const { weather, period, manualWeather, bumpData } = useAppState();
  const [focus, setFocus] = useState<'weather' | 'taste'>('weather');
  const [mode, setMode] = useState<RecommendMode>('ownedOnly');
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState<Record<string, true>>({});
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const owned = useRecommendations({ mode, occasion: null, excludedKeys: NO_KEYS, pinnedKeys: NO_KEYS, focus });
  const samples = useRecommendations({ mode: 'withSamples', occasion: null, excludedKeys: NO_KEYS, pinnedKeys: NO_KEYS, focus });
  const fallback = owned.result?.kind === 'notEnoughItems';
  const result = fallback ? samples.result : owned.result;
  const list = result?.kind === 'ok' ? result.results : [];
  const rec = list.length ? list[index % list.length] : null;

  const snap = weather?.[period] ?? weather?.now ?? null;
  const fresh = snap && isSnapshotFresh(snap) && !manualWeather ? snap : null;
  const manual = manualWeather ? MANUAL_WEATHER_OPTIONS.find((o) => o.id === manualWeather) : null;
  const weatherLine = fresh
    ? [fresh.conditionLabelKo, fresh.precipitationProbabilityPct != null ? `강수확률 ${Math.round(fresh.precipitationProbabilityPct)}%` : null].filter(Boolean).join(' / ')
    : manual
      ? `직접 고른 날씨 / ${manual.labelKo}`
      : '날씨 정보 없음 · 날씨 카드에서 설정할 수 있어요';

  const save = async () => {
    if (!rec) return;
    try {
      const id = newId('of_');
      const now = new Date().toISOString();
      const refs = rec.items.map((i) => ({ itemRef: i.ref, category: i.category }));
      const onlySamples = rec.items.every((i) => i.ref.kind === 'sampleTemplate');
      const outfit: Outfit = { id, title: onlySamples ? '샘플 추천 코디' : '추천 코디', itemRefs: refs.map((r) => r.itemRef), styleTags: [], occasion: null, source: onlySamples ? 'samplePreset' : 'recommended', thumbnailUri: null, createdAt: now, updatedAt: now };
      await saveOutfit(outfit, autoLayout(id, refs).layout);
      setSaved((s) => ({ ...s, [rec.signature]: true }));
      successFeedback();
      bumpData();
      setMessage({ tone: 'success', text: '코디를 저장했어요.' });
    } catch (e) {
      setMessage({ tone: 'error', text: toUserMessage(e) });
    }
  };

  return (
    <ScreenScroll topInset>
      <AppText variant="screenTitle" style={{ marginTop: spacing.xs }}>
        오늘의 추천 코디
      </AppText>
      <PillSegment
        options={[
          { id: 'weather', label: '날씨 맞춤' },
          { id: 'taste', label: '취향 맞춤' },
        ]}
        value={focus}
        onChange={(v) => (setFocus(v), setIndex(0))}
      />

      {rec ? (
        <>
          <OutfitBoard
            items={rec.items.map((i) => ({ ref: i.ref, category: i.category }))}
            owned={owned.ownedMap}
            overlay={
              fresh?.temperatureC != null || manual ? (
                <View style={[styles.weatherChip, { backgroundColor: c.surface }]}>
                  <Ionicons name={fresh?.precipitationType && fresh.precipitationType !== 'none' ? 'rainy' : manual?.rain ? 'rainy' : 'partly-sunny'} size={22} color={c.weatherIcon} />
                  <AppText variant="bodyStrong">{fresh?.temperatureC != null ? `${Math.round(fresh.temperatureC)}°` : manual?.labelKo}</AppText>
                </View>
              ) : null
            }
          />
          <Row>
            <AppText variant="caption" tone="secondary" style={{ flex: 1 }}>
              {weatherLine}
            </AppText>
            <Pressable onPress={save} hitSlop={10} accessibilityRole="button" accessibilityLabel={saved[rec.signature] ? '저장된 코디' : '코디 저장'} accessibilityState={{ selected: !!saved[rec.signature] }}>
              <Ionicons name={saved[rec.signature] ? 'heart' : 'heart-outline'} size={24} color={c.heart} />
            </Pressable>
          </Row>

          <View style={[styles.divider, { backgroundColor: c.border }]} />

          <View style={{ gap: spacing.sm }}>
            <AppText variant="bodyStrong">추천 이유</AppText>
            {(rec.reasons.length ? rec.reasons : [{ code: 'base', text: '기본 조합 규칙(상의·하의·신발)으로 만든 코디예요' }]).slice(0, 4).map((r) => (
              <Row key={r.code + r.text} gap={spacing.xs}>
                <View style={[styles.reasonIcon, { backgroundColor: c.surfaceSunken }]}>
                  <Ionicons name="sparkles-outline" size={11} color={c.textSecondary} />
                </View>
                <AppText variant="secondary" style={{ flex: 1 }}>
                  {r.text}
                </AppText>
              </Row>
            ))}
            {rec.gaps.map((g) => (
              <AppText key={g} variant="caption" tone="warning">
                · {g}
              </AppText>
            ))}
          </View>

          {message ? <InlineMessage tone={message.tone} message={message.text} /> : null}
          <PrimaryButton label={saved[rec.signature] ? '저장했어요' : '코디 저장하기'} onPress={save} disabled={!!saved[rec.signature]} />
          <Row style={{ justifyContent: 'space-between' }}>
            <Pressable onPress={() => setIndex((i) => i + 1)} hitSlop={8} accessibilityRole="button" disabled={list.length < 2}>
              <AppText variant="caption" tone={list.length < 2 ? 'tertiary' : 'secondary'}>
                다른 코디 보기 ({(index % Math.max(list.length, 1)) + 1}/{list.length})
              </AppText>
            </Pressable>
            <Pressable onPress={() => router.push({ pathname: '/builder/[outfitId]', params: { outfitId: 'new', refs: JSON.stringify(rec.items.map((i) => ({ itemRef: i.ref, category: i.category }))) } })} hitSlop={8} accessibilityRole="button">
              <AppText variant="caption" tone="secondary">
                코디 빌더에서 편집
              </AppText>
            </Pressable>
          </Row>
        </>
      ) : owned.loading ? null : (
        <InlineMessage message="추천할 옷이 부족해요. 옷장에서 상의·하의·신발을 등록해 보세요." />
      )}

      <View style={{ gap: spacing.xs }}>
        <Row gap={spacing.xs}>
          <FilterChip label="내 옷만" selected={mode === 'ownedOnly'} onPress={() => (setMode('ownedOnly'), setIndex(0))} />
          <FilterChip label="샘플 포함" selected={mode === 'withSamples'} onPress={() => (setMode('withSamples'), setIndex(0))} />
        </Row>
        {fallback && mode === 'ownedOnly' ? (
          <Row gap={6}>
            <SourceBadge source="sample" />
            <AppText variant="caption" tone="tertiary" style={{ flex: 1 }}>
              내 옷이 부족해 샘플 옷으로 추천했어요
            </AppText>
          </Row>
        ) : null}
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  weatherChip: { position: 'absolute', left: spacing.sm, bottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.field, opacity: 0.94 },
  divider: { height: StyleSheet.hairlineWidth },
  reasonIcon: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
