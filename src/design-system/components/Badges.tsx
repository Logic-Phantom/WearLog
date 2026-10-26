import { StyleSheet, View } from 'react-native';

import { useColors } from '../theme';
import { radius } from '../tokens';
import { AppText } from './AppText';

export type GarmentSource = 'owned' | 'sample';

/**
 * 출처 배지. Sample garments must never pass as owned ones (prompt §3.2), so every tile/card that
 * shows a garment or outfit renders this. Text label always present — not color alone.
 */
export function SourceBadge({ source }: { source: GarmentSource }) {
  const c = useColors();
  const owned = source === 'owned';
  return (
    <View
      style={[styles.badge, { backgroundColor: owned ? c.badgeOwnedBg : c.badgeSampleBg }]}
      accessible
      accessibilityLabel={owned ? '내 옷' : '샘플'}>
      <AppText variant="caption" style={{ color: owned ? c.badgeOwnedText : c.badgeSampleText }}>
        {owned ? '내 옷' : '샘플'}
      </AppText>
    </View>
  );
}

/** Small count/status pill (e.g. "1.2k" over a feed photo). */
export function CountPill({ label, accessibilityLabel }: { label: string; accessibilityLabel?: string }) {
  const c = useColors();
  return (
    <View style={[styles.badge, { backgroundColor: c.surface }]} accessibilityLabel={accessibilityLabel}>
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.chip },
});
