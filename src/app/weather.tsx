import { useState } from 'react';
import { View } from 'react-native';

import { AppSwitch, AppText, BottomSheet, Card, ChipRow, InlineMessage, ListRow, PrimaryButton, ScreenScroll, SecondaryButton, spacing } from '@/design-system';
import type { ManualWeather } from '@/domain/models';
import { MANUAL_WEATHER_OPTIONS } from '@/domain/recommendation-policy';
import { WeatherCard } from '@/features/weather/components/WeatherCard';
import { KOREA_AREAS, getArea } from '@/infrastructure/weather-providers/korea-areas';
import { useAppState } from '@/hooks/app-state';

type ManualOpt = ManualWeather | 'auto';

/**
 * 날씨 상세·설정 (prompt §3.9). Location is requested only after this explanation and only when the
 * user taps; denial leads to region choice or manual weather — never a silent default city.
 */
export default function WeatherScreen() {
  const { weather, weatherLoading, weatherError, weatherPrefs, updateWeatherPrefs, refresh, manualWeather, setManualWeather, period } = useAppState();
  const [areaSheet, setAreaSheet] = useState(false);
  const area = weatherPrefs.manualAreaId ? getArea(weatherPrefs.manualAreaId) : null;

  const useCurrent = async () => {
    await updateWeatherPrefs({ locationMode: 'current' });
    setManualWeather(null);
    await refresh({ locationMode: 'current' });
  };

  return (
    <ScreenScroll>
      <WeatherCard snapshot={weather?.[period] ?? weather?.now ?? null} manual={manualWeather} loading={weatherLoading} error={weatherError} onPress={() => refresh()} />

      <Card>
        <View style={{ gap: spacing.sm }}>
          <AppText variant="sectionTitle">날씨 가져오기</AppText>
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
