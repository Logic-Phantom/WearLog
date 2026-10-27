import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, type ImageSource } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { tapFeedback } from '../haptics';
import { useColors } from '../theme';
import { radius, spacing, touchTarget } from '../tokens';
import { AppText } from './AppText';

/**
 * Text tabs with an ink underline under the selected one (showcase: 내 옷장 | 샘플 옷장,
 * 추천 | 최신순 | 팔로잉). `align="start"` packs tabs left like the community header.
 */
export function UnderlineTabs<T extends string>({ options, value, onChange, align = 'stretch' }: { options: readonly { id: T; label: string }[]; value: T; onChange: (id: T) => void; align?: 'stretch' | 'start' }) {
  const c = useColors();
  return (
    <View style={[styles.utabs, { borderBottomColor: c.border }]} accessibilityRole="tablist">
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
            style={[styles.utab, align === 'stretch' ? { flex: 1 } : { paddingHorizontal: spacing.sm }]}>
            <AppText variant={selected ? 'bodyStrong' : 'body'} style={{ color: selected ? c.textPrimary : c.textTertiary }}>
              {o.label}
            </AppText>
            <View style={[styles.uline, { backgroundColor: selected ? c.textPrimary : 'transparent' }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Pill segment on a sunken track. `tone="ink"` = black selected pill (착용 기록: 전체 | 이번달 | 올해);
 * `tone="light"` = white selected pill with a short underline (코디 추천: 날씨 맞춤 | 취향 맞춤).
 */
export function PillSegment<T extends string>({ options, value, onChange, tone = 'light' }: { options: readonly { id: T; label: string }[]; value: T; onChange: (id: T) => void; tone?: 'ink' | 'light' }) {
  const c = useColors();
  return (
    <View style={[styles.track, { backgroundColor: c.surfaceSunken }]} accessibilityRole="tablist">
      {options.map((o) => {
        const selected = o.id === value;
        const bg = selected ? (tone === 'ink' ? c.selected : c.surface) : 'transparent';
        const fg = selected ? (tone === 'ink' ? c.selectedText : c.textPrimary) : c.textTertiary;
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
            style={[styles.pill, { backgroundColor: bg }, selected && tone === 'light' && styles.pillShadow]}>
            <AppText variant="label" style={{ color: fg }}>
              {o.label}
            </AppText>
            {selected && tone === 'light' ? <View style={[styles.pillLine, { backgroundColor: c.textPrimary }]} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Heart + count pill floating over a feed photo (showcase "♡ 1.2k"). */
export function HeartPill({ count, liked }: { count: number; liked?: boolean }) {
  const c = useColors();
  return (
    <View style={[styles.heartPill, { backgroundColor: c.surface }]} accessible accessibilityLabel={`하트 ${count}개`}>
      <Ionicons name={liked ? 'heart' : 'heart-outline'} size={13} color={liked ? c.heart : c.textPrimary} />
      <AppText variant="caption">{compactCount(count)}</AppText>
    </View>
  );
}

export function compactCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k`;
  return String(n);
}

/** Round avatar; falls back to a neutral person glyph (never a stranger's photo). */
export function Avatar({ source, size = 36, label }: { source?: ImageSource | number | null; size?: number; label?: string }) {
  const c = useColors();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: c.surfaceSunken, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={label}>
      {source ? <Image source={source} style={{ width: size, height: size }} contentFit="cover" /> : <Ionicons name="person" size={size * 0.5} color={c.textTertiary} />}
    </View>
  );
}

/** Settings-style row: label left, value + chevron right (옷 등록: 카테고리 › 상의). */
export function ValueRow({ label, value, onPress, children }: { label: string; value?: string; onPress?: () => void; children?: ReactNode }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={value ? `${label}, ${value}` : label} style={({ pressed }) => [styles.valueRow, { borderBottomColor: c.border }, pressed && onPress && { opacity: 0.6 }]}>
      <AppText variant="bodyStrong" style={{ flex: 1 }}>
        {label}
      </AppText>
      {children}
      {value ? (
        <AppText variant="secondary" tone="secondary">
          {value}
        </AppText>
      ) : null}
      {onPress ? <Ionicons name="chevron-forward" size={16} color={c.textTertiary} /> : null}
    </Pressable>
  );
}

/** Section title with an optional "더보기 ›" link (홈: 오늘의 베스트 착장). */
export function SectionTitle({ title, onMore, moreLabel = '더보기' }: { title: string; onMore?: () => void; moreLabel?: string }) {
  const c = useColors();
  return (
    <View style={styles.sectionTitle}>
      <AppText variant="sectionTitle" style={{ flex: 1 }} accessibilityRole="header">
        {title}
      </AppText>
      {onMore ? (
        <Pressable onPress={onMore} hitSlop={10} accessibilityRole="button" accessibilityLabel={`${title} ${moreLabel}`} style={styles.more}>
          <AppText variant="caption" tone="secondary">
            {moreLabel}
          </AppText>
          <Ionicons name="chevron-forward" size={12} color={c.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  utabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  utab: { alignItems: 'center', justifyContent: 'flex-end', minHeight: touchTarget, gap: spacing.xs },
  uline: { height: 2, alignSelf: 'stretch', borderRadius: 1, marginHorizontal: spacing.xs },
  track: { flexDirection: 'row', borderRadius: radius.chip, padding: 3 },
  pill: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radius.chip },
  pillShadow: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  pillLine: { position: 'absolute', bottom: 5, width: 40, height: 2, borderRadius: 1 },
  heartPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.chip },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 56, borderBottomWidth: StyleSheet.hairlineWidth },
  sectionTitle: { flexDirection: 'row', alignItems: 'center' },
  more: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: touchTarget / 1.5 },
});
