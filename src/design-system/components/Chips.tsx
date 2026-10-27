import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { tapFeedback } from '../haptics';
import { useColors } from '../theme';
import { radius, spacing, touchTarget } from '../tokens';
import { AppText } from './AppText';

/** Pill filter chip (옷장 카테고리: 전체/상의/하의/…). Selected = ink fill + bold label (fill change, not hue alone). */
export function FilterChip({ label, selected, onPress, testID }: { label: string; selected: boolean; onPress: () => void; testID?: string }) {
  const c = useColors();
  return (
    <Pressable
      testID={testID}
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      hitSlop={{ top: 4, bottom: 4 }}
      style={[styles.chip, { backgroundColor: selected ? c.selected : c.surfaceSunken, borderColor: selected ? c.selected : c.surfaceSunken }]}>
      <AppText variant={selected ? 'label' : 'secondary'} style={{ color: selected ? c.selectedText : c.textSecondary }}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** Horizontally scrolling chip row with one selected value. */
export function ChipRow<T extends string>({ options, value, onChange }: { options: readonly { id: T; label: string }[]; value: T; onChange: (id: T) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, paddingVertical: 2 }}>
      {options.map((o) => (
        <FilterChip key={o.id} label={o.label} selected={o.id === value} onPress={() => onChange(o.id)} />
      ))}
    </ScrollView>
  );
}

/**
 * Two-to-four option segmented control (showcase: 날씨 맞춤 | 취향 맞춤, 내 옷장 | 샘플 옷장,
 * 추천 | 최신순 | 팔로잉). Uses tab semantics for screen readers.
 */
export function SegmentedControl<T extends string>({ options, value, onChange }: { options: readonly { id: T; label: string }[]; value: T; onChange: (id: T) => void }) {
  const c = useColors();
  return (
    <View style={[styles.segment, { backgroundColor: c.surfaceSunken }]} accessibilityRole="tablist">
      {options.map((o) => {
        const selected = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => {
              tapFeedback();
              onChange(o.id);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={o.label}
            style={[styles.segmentItem, selected && [{ backgroundColor: c.surface }, styles.segmentShadow]]}>
            <AppText variant="label" style={{ color: selected ? c.textPrimary : c.textTertiary }}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Non-interactive hashtag-style tag (#데일리룩). */
export function Tag({ label }: { label: string }) {
  const c = useColors();
  return (
    <View style={[styles.tag, { backgroundColor: c.surfaceSunken }]}>
      <AppText variant="caption" tone="secondary">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.chip,
    borderWidth: 1,
  },
  segment: { flexDirection: 'row', borderRadius: radius.chip, padding: 3 },
  segmentItem: { flex: 1, minHeight: touchTarget - 6, alignItems: 'center', justifyContent: 'center', borderRadius: radius.chip },
  segmentShadow: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  tag: { paddingHorizontal: spacing.xs, paddingVertical: 3, borderRadius: radius.chip },
});

/** Wrapping multi-select chips (계절·스타일 태그). */
export function MultiChips<T extends string>({ options, values, onChange, max }: { options: readonly { id: T; label: string }[]; values: T[]; onChange: (v: T[]) => void; max?: number }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
      {options.map((o) => {
        const on = values.includes(o.id);
        return (
          <FilterChip
            key={o.id}
            label={o.label}
            selected={on}
            onPress={() => {
              if (on) onChange(values.filter((v) => v !== o.id));
              else if (!max || values.length < max) onChange([...values, o.id]);
            }}
          />
        );
      })}
    </View>
  );
}
