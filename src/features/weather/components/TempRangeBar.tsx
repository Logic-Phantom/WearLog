import { StyleSheet, View } from 'react-native';

import { AppText, Row, spacing, useColors } from '@/design-system';

/**
 * Today's low → high as a bar with a "지금" marker (provider values only). The scale widens to
 * include the current temperature when it sits outside the forecast low/high.
 */
export function TempRangeBar({ nowC, minC, maxC }: { nowC: number; minC: number; maxC: number }) {
  const c = useColors();
  const lo = Math.min(minC, nowC) - 1;
  const hi = Math.max(maxC, nowC) + 1;
  const pct = (t: number) => `${((t - lo) / (hi - lo)) * 100}%` as const;
  const range = Math.round(maxC - minC);
  return (
    <View style={{ gap: spacing.xxs }} accessible accessibilityLabel={`오늘 최저 ${Math.round(minC)}도, 최고 ${Math.round(maxC)}도, 지금 ${Math.round(nowC)}도, 일교차 ${range}도`}>
      <View style={[styles.track, { backgroundColor: c.surfaceSunken }]}>
        <View style={[styles.fill, { left: pct(minC), width: `${((maxC - minC) / (hi - lo)) * 100}%`, backgroundColor: c.weatherIcon }]} />
        <View style={[styles.marker, { left: pct(nowC), backgroundColor: c.textPrimary, borderColor: c.surface }]} />
      </View>
      <Row style={{ justifyContent: 'space-between' }}>
        <AppText variant="caption" tone="secondary">
          최저 {Math.round(minC)}°
        </AppText>
        <AppText variant="caption">지금 {Math.round(nowC)}° · 일교차 {range}°</AppText>
        <AppText variant="caption" tone="secondary">
          최고 {Math.round(maxC)}°
        </AppText>
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: 4, overflow: 'visible', justifyContent: 'center' },
  fill: { position: 'absolute', top: 0, bottom: 0, borderRadius: 4 },
  marker: { position: 'absolute', width: 14, height: 14, borderRadius: 7, marginLeft: -7, borderWidth: 2 },
});
