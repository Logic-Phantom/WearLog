import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Row, radius, spacing, typography, useColors, type IconName } from '@/design-system';
import type { ManualWeather, PrecipitationType, WeatherSnapshot } from '@/domain/models';
import { MANUAL_WEATHER_OPTIONS } from '@/domain/recommendation-policy';

import { isSnapshotFresh } from '../weather-signal';

function iconFor(s: WeatherSnapshot): IconName {
  const t: PrecipitationType | null = s.precipitationType;
  if (t === 'snow' || t === 'rainSnow') return 'snow-outline';
  if (t && t !== 'none') return 'rainy-outline';
  if (s.conditionLabelKo === '맑음') return 'sunny-outline';
  if (s.conditionLabelKo === '흐림') return 'cloudy-outline';
  return 'partly-sunny-outline';
}

const time = (iso: string) => new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

/**
 * Home weather card (showcase: 서울시 강남구 · 12°C · 체감 9°C · 비 60% · 최저/최고).
 * Shows only fields the provider sent; "추정" is printed for app-estimated felt temperature.
 */
export function WeatherCard({
  snapshot,
  manual,
  loading,
  error,
  onPress,
}: {
  snapshot: WeatherSnapshot | null;
  manual: ManualWeather | null;
  loading: boolean;
  error: string | null;
  onPress: () => void;
}) {
  const c = useColors();
  const fresh = snapshot && isSnapshotFresh(snapshot);
  const manualLabel = manual ? MANUAL_WEATHER_OPTIONS.find((o) => o.id === manual)?.labelKo : null;

  let body;
  if (manual) {
    body = (
      <View style={{ gap: spacing.xxs }}>
        <AppText variant="caption" tone="weather">직접 고른 날씨</AppText>
        <AppText variant="title" tone="weather">{manualLabel}</AppText>
        <AppText variant="caption" tone="weather">날씨 카드를 눌러 바꿀 수 있어요</AppText>
      </View>
    );
  } else if (snapshot && fresh) {
    const s = snapshot;
    body = (
      <View style={styles.row}>
        <View style={{ flex: 1, gap: 2 }}>
          <Row gap={4}>
            <Ionicons name="location-outline" size={14} color={c.weatherText} />
            <AppText variant="caption" tone="weather">{s.locationLabel}</AppText>
          </Row>
          {s.temperatureC != null ? <AppText style={[typography.temperature, { color: c.weatherText }]}>{Math.round(s.temperatureC)}°C</AppText> : null}
          {s.apparentTemperatureC != null ? (
            <AppText variant="caption" tone="weather">
              체감온도 {Math.round(s.apparentTemperatureC)}°C{s.apparentTemperatureSource === 'estimated' ? ' (추정)' : ''}
            </AppText>
          ) : null}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Ionicons name={iconFor(s)} size={40} color={c.weatherText} />
          {s.conditionLabelKo ? <AppText variant="label" tone="weather">{s.conditionLabelKo}</AppText> : null}
          {s.precipitationProbabilityPct != null ? <AppText variant="caption" tone="weather">강수확률 {Math.round(s.precipitationProbabilityPct)}%</AppText> : null}
          {s.minTemperatureC != null && s.maxTemperatureC != null ? (
            <AppText variant="caption" tone="weather">
              최저 {Math.round(s.minTemperatureC)}° / 최고 {Math.round(s.maxTemperatureC)}°
            </AppText>
          ) : null}
        </View>
      </View>
    );
  } else {
    body = (
      <View style={{ gap: spacing.xxs }}>
        <AppText variant="bodyStrong" tone="weather">{error ? '날씨를 불러오지 못했어요' : '오늘 날씨를 반영해 볼까요?'}</AppText>
        <AppText variant="secondary" tone="weather">{error ?? '내 주변 날씨를 쓰거나, 지역·날씨를 직접 고를 수 있어요.'}</AppText>
      </View>
    );
  }

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="날씨 상세 보기" accessibilityHint="지역, 시간대, 직접 선택을 바꿀 수 있어요">
      <LinearGradient colors={[c.weatherFrom, c.weatherTo]} style={styles.card}>
        {body}
        <Row style={{ justifyContent: 'space-between' }}>
          <AppText variant="caption" tone="weather">
            {snapshot && fresh && !manual ? `${time(snapshot.fetchedAt)} 기준 · 출처 ${snapshot.attribution}` : ' '}
          </AppText>
          {loading ? <ActivityIndicator size="small" color={c.weatherText} /> : <Ionicons name="chevron-forward" size={16} color={c.weatherText} />}
        </Row>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.tile, padding: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
});
