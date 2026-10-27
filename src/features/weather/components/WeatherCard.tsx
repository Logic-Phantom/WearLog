import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Row, radius, spacing, typography, useColors, type IconName } from '@/design-system';
import type { ManualWeather, PrecipitationType, WeatherSnapshot } from '@/domain/models';
import { MANUAL_WEATHER_OPTIONS, TEMPERATURE_BANDS, type TemperatureBand } from '@/domain/recommendation-policy';

import { isSnapshotFresh } from '../weather-signal';

function iconFor(s: WeatherSnapshot): IconName {
  const t: PrecipitationType | null = s.precipitationType;
  if (t === 'snow' || t === 'rainSnow') return 'snow';
  if (t && t !== 'none') return 'rainy';
  if (s.conditionLabelKo === '맑음') return 'sunny';
  if (s.conditionLabelKo === '흐림') return 'cloudy';
  return 'partly-sunny';
}

const MANUAL_ICON: Record<ManualWeather, IconName> = { hot: 'sunny', warm: 'partly-sunny', mild: 'partly-sunny', chilly: 'cloudy', cold: 'cloudy', freezing: 'snow', rain: 'rainy', indoor: 'home' };

/** "13~18°C" for a policy band — the recommender's reference range, not a measured value. */
function bandRange(band: TemperatureBand | null): string | null {
  if (!band) return null;
  const i = TEMPERATURE_BANDS.findIndex((b) => b.band === band);
  const lo = i > 0 ? TEMPERATURE_BANDS[i - 1].maxC + 1 : null;
  const hi = TEMPERATURE_BANDS[i].maxC;
  if (lo == null) return `${hi}°C 이하`;
  if (!Number.isFinite(hi)) return `${lo}°C 이상`;
  return `${lo}~${hi}°C`;
}

const time = (iso: string) => new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

/**
 * Weather card (showcase: 📍 서울시 강남구 · 12°C · 체감온도 9°C · 비 60% · 최저 8° / 최고 14°).
 * Shows only fields the provider sent; "추정" is printed for app-estimated felt temperature. A manual
 * pick shows its label and the policy band it maps to — never a made-up temperature.
 */
export function WeatherCard({
  snapshot,
  manual,
  loading,
  error,
  onPress,
  locationLabel,
}: {
  snapshot: WeatherSnapshot | null;
  manual: ManualWeather | null;
  loading: boolean;
  error: string | null;
  onPress: () => void;
  /** Shown above the card when there is no fresh snapshot (e.g. a chosen area). */
  locationLabel?: string | null;
}) {
  const c = useColors();
  const fresh = snapshot && isSnapshotFresh(snapshot);
  const opt = manual ? MANUAL_WEATHER_OPTIONS.find((o) => o.id === manual) : null;
  const place = fresh && !manual ? snapshot.locationLabel : (locationLabel ?? null);

  let body;
  if (opt) {
    const range = bandRange(opt.band);
    body = (
      <View style={styles.row}>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText style={[typography.temperature, { color: c.weatherText, fontSize: 34, lineHeight: 42 }]}>{opt.labelKo}</AppText>
          <AppText variant="caption" tone="secondary">직접 고른 날씨</AppText>
        </View>
        <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', alignSelf: 'stretch' }}>
          <Ionicons name={MANUAL_ICON[opt.id]} size={40} color={c.weatherIcon} />
          {opt.rain ? <AppText variant="caption" tone="secondary">비 오는 날</AppText> : null}
          {range ? <AppText variant="caption" tone="secondary">추천 기준 {range}</AppText> : null}
        </View>
      </View>
    );
  } else if (snapshot && fresh) {
    const s = snapshot;
    body = (
      <View style={styles.row}>
        <View style={{ flex: 1, gap: 2 }}>
          {s.temperatureC != null ? <AppText style={[typography.temperature, { color: c.weatherText }]}>{Math.round(s.temperatureC)}°C</AppText> : <AppText variant="title">{s.conditionLabelKo ?? '날씨'}</AppText>}
          {s.apparentTemperatureC != null ? (
            <AppText variant="caption" tone="secondary">
              체감온도 {Math.round(s.apparentTemperatureC)}°C{s.apparentTemperatureSource === 'estimated' ? ' (추정)' : ''}
            </AppText>
          ) : null}
          {s.humidityPct != null ? <AppText variant="caption" tone="tertiary">습도 {Math.round(s.humidityPct)}%</AppText> : null}
        </View>
        <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', alignSelf: 'stretch' }}>
          <Ionicons name={iconFor(s)} size={40} color={c.weatherIcon} />
          <View style={{ alignItems: 'flex-end' }}>
            {s.precipitationProbabilityPct != null ? (
              <AppText variant="caption" tone="secondary">
                {s.precipitationType && s.precipitationType !== 'none' ? '비' : '강수'} {Math.round(s.precipitationProbabilityPct)}%
              </AppText>
            ) : null}
            {s.minTemperatureC != null && s.maxTemperatureC != null ? (
              <AppText variant="caption" tone="secondary">
                최저 {Math.round(s.minTemperatureC)}° / 최고 {Math.round(s.maxTemperatureC)}°
              </AppText>
            ) : null}
          </View>
        </View>
      </View>
    );
  } else {
    body = (
      <View style={styles.row}>
        <View style={{ flex: 1, gap: spacing.xxs }}>
          <AppText variant="sectionTitle">{error ? '날씨를 불러오지 못했어요' : '오늘 날씨를 반영해 볼까요?'}</AppText>
          <AppText variant="caption" tone="secondary">{error ?? '내 주변 날씨를 쓰거나, 날씨를 직접 고를 수 있어요.'}</AppText>
        </View>
        {loading ? <ActivityIndicator size="small" color={c.weatherIcon} /> : <Ionicons name="partly-sunny" size={40} color={c.weatherIcon} />}
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.xs }}>
      {place ? (
        <Row gap={4}>
          <Ionicons name="location-outline" size={14} color={c.textPrimary} />
          <AppText variant="caption">{place}</AppText>
        </Row>
      ) : null}
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="날씨 상세 보기" accessibilityHint="지역, 시간대, 직접 선택을 바꿀 수 있어요">
        <LinearGradient colors={[c.weatherFrom, c.weatherTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
          {body}
          {snapshot && fresh && !manual ? (
            <AppText variant="caption" tone="tertiary" style={{ fontSize: 10 }}>
              {time(snapshot.fetchedAt)} 기준 · 출처 {snapshot.attribution}
            </AppText>
          ) : null}
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.tile, padding: spacing.md, paddingVertical: spacing.lg, gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
});
