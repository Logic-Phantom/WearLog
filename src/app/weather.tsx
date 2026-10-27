import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppSwitch, AppText, BottomSheet, Card, ChipRow, InlineMessage, ListRow, PrimaryButton, Row, ScreenScroll, SecondaryButton, SectionTitle, SourceBadge, radius, spacing, useColors } from '@/design-system';
import type { ForecastPeriod, ManualWeather, WeatherSnapshot } from '@/domain/models';
import { SAMPLE_LOOKS } from '@/features/community/sample-feed';
import { isSnapshotFresh } from '@/features/weather/weather-signal';
import { MANUAL_WEATHER_OPTIONS } from '@/domain/recommendation-policy';
import { WeatherCard } from '@/features/weather/components/WeatherCard';
import { KOREA_AREAS, getArea } from '@/infrastructure/weather-providers/korea-areas';
import { useAppState } from '@/hooks/app-state';

type ManualOpt = ManualWeather | 'auto';

/**
 * 날씨 상세·설정 (prompt §3.9). Location is requested only after this explanation and only when the
 * user taps; denial leads to region choice or manual weather — never a silent default city.
 */
const PERIOD_LABEL: Record<ForecastPeriod, string> = { now: '지금', morning: '오전', afternoon: '오후', evening: '저녁' };

export default function WeatherScreen() {
  const router = useRouter();
  const c = useColors();
  const { weather, weatherLoading, weatherError, weatherPrefs, updateWeatherPrefs, refresh, manualWeather, setManualWeather, period } = useAppState();
  const [areaSheet, setAreaSheet] = useState(false);
  const area = weatherPrefs.manualAreaId ? getArea(weatherPrefs.manualAreaId) : null;
  const hourly = (['morning', 'afternoon', 'evening'] as const).flatMap((id) => {
    const snap: WeatherSnapshot | undefined | null = weather?.[id];
    return snap && isSnapshotFresh(snap) ? [{ id, s: snap }] : [];
  });

  const useCurrent = async () => {
    await updateWeatherPrefs({ locationMode: 'current' });
    setManualWeather(null);
    await refresh({ locationMode: 'current' });
  };

  return (
    <ScreenScroll>
      <WeatherCard snapshot={weather?.[period] ?? weather?.now ?? null} manual={manualWeather} loading={weatherLoading} error={weatherError} onPress={() => refresh()} locationLabel={area?.label ?? null} />

      {/* Showcase hourly strip: only periods the provider actually returned. */}
      {hourly.length > 1 ? (
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            {hourly.map(({ id, s: snap }) => (
              <View key={id} style={{ alignItems: 'center', gap: 4, flex: 1 }}>
                <AppText variant="caption" tone="secondary">{PERIOD_LABEL[id]}</AppText>
                <Ionicons name={snap.precipitationType && snap.precipitationType !== 'none' ? 'rainy' : 'partly-sunny'} size={22} color={c.weatherIcon} />
                {snap.temperatureC != null ? <AppText variant="label">{Math.round(snap.temperatureC)}°</AppText> : null}
                {snap.precipitationProbabilityPct != null ? <AppText variant="caption" tone="tertiary">{Math.round(snap.precipitationProbabilityPct)}%</AppText> : null}
              </View>
            ))}
          </Row>
        </Card>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <SectionTitle title="오늘의 코디 추천" />
        <Row gap={spacing.xs} style={{ alignItems: 'flex-start' }}>
          {SAMPLE_LOOKS.map((l) => (
            <View key={l.id} style={{ flex: 1, gap: 6 }}>
              <View style={[styles.look, { backgroundColor: c.photoBackdrop }]}>
                <Image source={l.image} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={`샘플 코디, ${l.caption}`} />
                <View style={{ position: 'absolute', top: 4, left: 4 }}>
                  <SourceBadge source="sample" />
                </View>
              </View>
              <AppText variant="caption" align="center" numberOfLines={2}>
                {l.caption}
              </AppText>
            </View>
          ))}
        </Row>
        <PrimaryButton label="다른 코디 보기" onPress={() => router.push('/recommend')} style={{ backgroundColor: c.textSecondary, borderColor: c.textSecondary }} />
      </View>

      <Card>
        <View style={{ gap: spacing.sm }}>
          <AppText variant="sectionTitle">날씨 설정</AppText>
          <AppText variant="secondary" tone="secondary">
            현재 위치는 버튼을 누를 때 한 번만 확인하고, 약 5km 격자 번호로 바꿔 날씨를 조회해요. 좌표는 저장하거나 공유하지 않아요.
          </AppText>
          <PrimaryButton label="내 주변 날씨 사용" icon="navigate-outline" onPress={useCurrent} disabled={weatherLoading} />
          <SecondaryButton label={area ? `지역: ${area.label}` : '지역 직접 선택'} icon="map-outline" onPress={() => setAreaSheet(true)} />
          {weatherPrefs.locationMode !== 'off' ? <SecondaryButton label="새로고침" icon="refresh" onPress={() => refresh()} loading={weatherLoading} /> : null}
        </View>
      </Card>

      <Card>
        <View style={{ gap: spacing.sm }}>
          <AppText variant="sectionTitle">날씨 직접 고르기</AppText>
          <AppText variant="secondary" tone="secondary">위치를 쓰지 않거나 날씨를 못 불러올 때, 고른 날씨로 추천해요.</AppText>
          <ChipRow<ManualOpt>
            options={[{ id: 'auto', label: '자동' }, ...MANUAL_WEATHER_OPTIONS.map((o) => ({ id: o.id, label: o.labelKo }))]}
            value={manualWeather ?? 'auto'}
            onChange={(v) => setManualWeather(v === 'auto' ? null : v)}
          />
        </View>
      </Card>

      <Card padded={false}>
        <ListRow
          label="코디 추천에 날씨 반영"
          right={<AppSwitch accessibilityLabel="코디 추천에 날씨 반영" value={weatherPrefs.weatherRecommendationEnabled} onValueChange={(v) => updateWeatherPrefs({ weatherRecommendationEnabled: v })} />}
        />
        <ListRow
          label="선택한 지역 기억하기"
          right={<AppSwitch accessibilityLabel="선택한 지역 기억하기" value={weatherPrefs.rememberManualArea} onValueChange={(v) => updateWeatherPrefs({ rememberManualArea: v })} />}
        />
      </Card>
      <InlineMessage message="날씨 데이터: 기상청 단기예보. 체감온도는 기상청 공식(겨울철 풍속 기준)으로 계산한 추정값일 때 '추정'으로 표시해요." />

      <BottomSheet visible={areaSheet} title="지역 선택" onClose={() => setAreaSheet(false)}>
        {KOREA_AREAS.map((a) => (
          <ListRow
            key={a.id}
            label={a.label}
            onPress={async () => {
              await updateWeatherPrefs({ locationMode: 'manual', manualAreaId: a.id });
              setAreaSheet(false);
              setManualWeather(null);
              await refresh({ locationMode: 'manual', manualAreaId: a.id });
            }}
          />
        ))}
      </BottomSheet>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  look: { width: '100%', aspectRatio: 0.78, borderRadius: radius.photo, overflow: 'hidden' },
});
