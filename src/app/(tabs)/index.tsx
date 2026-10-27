import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AppText, Card, HeartPill, PrimaryButton, Row, ScreenScroll, SecondaryButton, SectionTitle, SourceBadge, contentMaxWidth, elevation, radius, spacing, useColors } from '@/design-system';
import { communityRepository } from '@/features/community/supabase-community-repository';
import { SAMPLE_POSTS } from '@/features/community/sample-feed';
import { OutfitBoard } from '@/features/outfit-builder/components/OutfitBoard';
import { useRecommendations } from '@/features/recommendations/use-recommendations';
import { WeatherCard } from '@/features/weather/components/WeatherCard';
import { getArea } from '@/infrastructure/weather-providers/korea-areas';
import { useAppState } from '@/hooks/app-state';

const NO_KEYS: string[] = [];

/** 홈 (showcase): 위치 · 날씨 카드 · 오늘의 베스트 착장(가로 카드) · 오늘의 추천 코디. */
export default function HomeScreen() {
  const router = useRouter();
  const c = useColors();
  const { width } = useWindowDimensions();
  const { weather, weatherLoading, weatherError, manualWeather, period, weatherPrefs } = useAppState();
  const owned = useRecommendations({ mode: 'ownedOnly', occasion: null, excludedKeys: NO_KEYS, pinnedKeys: NO_KEYS });
  const withSamples = useRecommendations({ mode: 'withSamples', occasion: null, excludedKeys: NO_KEYS, pinnedKeys: NO_KEYS });
  const fromOwned = owned.result?.kind === 'ok';
  const pick = fromOwned ? owned.result : withSamples.result;
  const top = pick?.kind === 'ok' ? pick.results[0] : null;
  const snapshot = weather?.[period] ?? weather?.now ?? null;
  const area = weatherPrefs.manualAreaId ? getArea(weatherPrefs.manualAreaId) : null;
  const communityReady = communityRepository.status() === 'ready';
  const cardW = Math.round((Math.min(width, contentMaxWidth) - spacing.md * 2) * 0.62);
  // Showcase order: the trench look first.
  const best = [...SAMPLE_POSTS.filter((p) => p.featured)].sort((a, b) => Number(b.id === 'sample-trench') - Number(a.id === 'sample-trench'));

  return (
    <ScreenScroll topInset>
      <WeatherCard snapshot={snapshot} manual={manualWeather} loading={weatherLoading} error={weatherError} onPress={() => router.push('/weather')} locationLabel={area?.label ?? null} />

      <View style={{ gap: spacing.sm }}>
        <SectionTitle title="오늘의 베스트 착장" onMore={() => router.push('/community')} />
        {!communityReady ? (
          <AppText variant="caption" tone="tertiary">
            샘플 게시물이에요 · 커뮤니티 서버를 연결하면 실제 착장이 보여요
          </AppText>
        ) : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.md }} style={{ marginRight: -spacing.md }}>
          {best.map((p) => (
            <Pressable key={p.id} onPress={() => router.push({ pathname: '/community/post/[postId]', params: { postId: p.id } })} accessibilityRole="button" accessibilityLabel={`샘플 게시물, ${p.title}`} style={{ width: cardW, gap: spacing.xs }}>
              <View style={[styles.bestPhoto, { backgroundColor: c.photoBackdrop }]}>
                <Image source={p.image} style={StyleSheet.absoluteFill} contentFit="cover" />
                <View style={styles.heart}>
                  <HeartPill count={p.likeCount} />
                </View>
              </View>
              <AppText variant="label" numberOfLines={1}>
                {p.title}
              </AppText>
              <AppText variant="caption" tone="tertiary" numberOfLines={1}>
                {p.hashtags.join('  ')}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={{ gap: spacing.sm }}>
        <SectionTitle title="오늘의 추천 코디" onMore={() => router.push('/recommend')} />
        {top ? (
          <Card style={elevation.card}>
            <View style={{ gap: spacing.sm }}>
              <OutfitBoard items={top.items.map((i) => ({ ref: i.ref, category: i.category }))} owned={owned.ownedMap} />
              {top.reasons.slice(0, 2).map((r) => (
                <Row key={r.code + r.text} gap={6}>
                  <View style={[styles.dot, { backgroundColor: c.textTertiary }]} />
                  <AppText variant="secondary" tone="secondary" style={{ flex: 1 }}>
                    {r.text}
                  </AppText>
                </Row>
              ))}
              {!fromOwned ? (
                <Row gap={6}>
                  <SourceBadge source="sample" />
                  <AppText variant="caption" tone="tertiary" style={{ flex: 1 }}>
                    내 옷이 부족해 샘플 옷으로 보여드려요
                  </AppText>
                </Row>
              ) : null}
              <PrimaryButton label="이 코디로 편집하기" onPress={() => router.push({ pathname: '/builder/[outfitId]', params: { outfitId: 'new', refs: JSON.stringify(top.items.map((i) => ({ itemRef: i.ref, category: i.category }))) } })} />
            </View>
          </Card>
        ) : (
          <Card>
            <View style={{ gap: spacing.sm }}>
              <AppText variant="bodyStrong">옷을 등록하지 않아도 바로 코디해 볼 수 있어요</AppText>
              <PrimaryButton label="샘플로 코디해 보기" onPress={() => router.push('/sample-wardrobe')} />
              <SecondaryButton label="내 옷 등록하기" onPress={() => router.push('/wardrobe/add')} />
            </View>
          </Card>
        )}
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  bestPhoto: { width: '100%', aspectRatio: 0.86, borderRadius: radius.tile, overflow: 'hidden' },
  heart: { position: 'absolute', right: spacing.xs, bottom: spacing.xs },
  dot: { width: 4, height: 4, borderRadius: 2 },
});
