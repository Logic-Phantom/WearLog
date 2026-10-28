import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';

import { AppText, Card, Row, spacing, useColors } from '@/design-system';

import { outfitGuide } from '../outfit-guide';
import type { WeatherSignal } from '../weather-signal';

/**
 * "오늘 옷차림" — one line per condition the weather actually reported (band, 일교차, wind, rain).
 * Renders nothing without weather, so it never shows advice for made-up conditions.
 */
export function OutfitGuideCard({ weather, compact }: { weather: WeatherSignal; compact?: boolean }) {
  const c = useColors();
  const lines = outfitGuide(weather);
  if (!lines.length) return null;
  const body = (
    <View style={{ gap: spacing.xs }} accessible accessibilityLabel={`오늘 옷차림. ${lines.map((l) => l.text).join('. ')}`}>
      {compact ? null : <AppText variant="bodyStrong">오늘 옷차림</AppText>}
      {lines.map((l) => (
        <Row key={l.icon} gap={spacing.xs}>
          <Ionicons name={l.icon} size={16} color={c.weatherIcon} />
          <AppText variant="secondary" tone="secondary" style={{ flex: 1 }}>
            {l.text}
          </AppText>
        </Row>
      ))}
    </View>
  );
  return compact ? body : <Card>{body}</Card>;
}
