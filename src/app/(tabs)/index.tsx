import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { AppText, Card, GhostButton, InlineMessage, PrimaryButton, ScreenScroll, SecondaryButton, SectionHeader, SegmentedControl, spacing } from '@/design-system';
import type { ForecastPeriod } from '@/domain/models';
import { communityRepository } from '@/features/community/supabase-community-repository';
import { OutfitBoard } from '@/features/outfit-builder/components/OutfitBoard';
import { useRecommendations } from '@/features/recommendations/use-recommendations';
import { WeatherCard } from '@/features/weather/components/WeatherCard';
import { useAppState } from '@/hooks/app-state';

const PERIODS: { id: ForecastPeriod; label: string }[] = [
  { id: 'now', label: '지금' },
  { id: 'morning', label: '오전' },
  { id: 'afternoon', label: '오후' },
  { id: 'evening', label: '저녁' },
];

const NO_KEYS: string[] = [];

/** 홈: 날씨 카드 · 오늘의 추천 코디 · 오늘의 베스트 착장 미리보기. */
export default function HomeScreen() {
  const router = useRouter();
  const { weather, weatherLoading, weatherError, manualWeather, period, setPeriod, weatherPrefs } = useAppState();
  const { result, ownedMap, ownedCount, loading } = useRecommendations({ mode: 'ownedOnly', occasion: null, excludedKeys: NO_KEYS, pinnedKeys: NO_KEYS });
  const top = result?.kind === 'ok' ? result.results[0] : null;
  const snapshot = weather?.[period] ?? null;
  const periods = useMemo(() => PERIODS.filter((p) => p.id === 'now' || weather?.[p.id]), [weather]);
  const communityReady = communityRepository.status() === 'ready';

  return (
    <ScreenScroll topInset>
      <WeatherCard snapshot={snapshot ?? weather?.now ?? null} manual={manualWeather} loading={weatherLoading} error={weatherError} onPress={() => router.push('/weather')} />
      {weather && weatherPrefs.locationMode !== 'off' && !manualWeather && periods.length > 1 ? <SegmentedControl options={periods} value={period} onChange={setPeriod} /> : null}

      <View style={{ gap: spacing.sm }}>
        <SectionHeader title="오늘의 추천 코디" subtitle={top ? '내 옷장에서 골랐어요' : undefined} right={top ? <GhostButton compact label="더보기" onPress={() => router.push('/recommend')} /> : null} />
        {loading ? null : top ? (
          <Card>
            <View style={{ gap: spacing.sm }}>
              <OutfitBoard refs={top.items.map((i) => i.ref)} owned={ownedMap} height={220} />
              {top.reasons.slice(0, 3).map((r) => (
                <AppText key={r.code + r.text} variant="secondary" tone="secondary">
                  · {r.text}
                </AppText>
              ))}
              <PrimaryButton label="이 코디로 편집하기" onPress={() => router.push({ pathname: '/builder/[outfitId]', params: { outfitId: 'new', refs: JSON.stringify(top.items.map((i) => ({ itemRef: i.ref, category: i.category }))) } })} />
            </View>
          </Card>
        ) : (
          <Card>
            <View style={{ gap: spacing.sm }}>
              <AppText variant="bodyStrong">{ownedCount === 0 ? '옷을 등록하지 않아도 바로 코디해 볼 수 있어요' : '추천하려면 상의·하의·신발이 하나씩 필요해요'}</AppText>
              <AppText variant="secondary" tone="secondary">샘플 옷으로 조합해 보거나, 내 옷을 등록해 나만의 추천을 받아 보세요.</AppText>
              {/* Equal weight: neither path is forced (prompt §3.2). Stacked so labels never wrap. */}
              <PrimaryButton label="샘플로 코디해 보기" onPress={() => router.push('/sample-wardrobe')} />
              <SecondaryButton label="내 옷 등록하기" onPress={() => router.push('/wardrobe/add')} />
            </View>
          </Card>
        )}
      </View>

      <View style={{ gap: spacing.sm }}>
        <SectionHeader title="오늘의 베스트 착장" right={communityReady ? <GhostButton compact label="더보기" onPress={() => router.push('/community')} /> : null} />
        {communityReady ? (
          <InlineMessage message="커뮤니티 탭에서 오늘 운영자가 고른 착장을 볼 수 있어요." />
        ) : (
          <InlineMessage tone="info" title="커뮤니티 서버 미설정" message="옷장·코디·착용 기록은 로그인 없이 그대로 쓸 수 있어요." />
        )}
      </View>
    </ScreenScroll>
  );
}
