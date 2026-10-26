import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useColors } from '../theme';
import { spacing, touchTarget } from '../tokens';
import { AppText } from './AppText';
import type { IconName } from './Buttons';

/** Menu row with leading icon + chevron (프로필: 내 옷장 / 착용 기록 / 베스트 착장 / 설정). */
export function ListRow({ icon, label, detail, onPress, right, testID }: { icon?: IconName; label: string; detail?: string; onPress?: () => void; right?: ReactNode; testID?: string }) {
  const c = useColors();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={detail ? `${label}, ${detail}` : label}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.surfaceSunken }]}>
      {icon ? <Ionicons name={icon} size={20} color={c.textPrimary} /> : null}
      <AppText variant="body" style={{ flex: 1 }}>
        {label}
      </AppText>
      {detail ? <AppText variant="secondary" tone="tertiary">{detail}</AppText> : null}
      {right}
      {onPress ? <Ionicons name="chevron-forward" size={18} color={c.textTertiary} /> : null}
    </Pressable>
  );
}

export function Divider() {
  const c = useColors();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.border }} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: touchTarget + 8, paddingHorizontal: spacing.md },
});
