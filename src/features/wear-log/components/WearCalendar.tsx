import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Row, spacing, useColors } from '@/design-system';
import type { ISODate } from '@/domain/models';

import { monthGrid } from '../calendar';

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * Month grid for 착용 기록: a dot marks days with a wear, tapping a day selects it. Days after
 * `today` are disabled (a wear cannot be recorded in the future).
 */
export function WearCalendar({ year, month, today, wornDays, selected, onSelect, onPrev, onNext, picking }: {
  year: number;
  month: number;
  today: ISODate;
  wornDays: Set<ISODate>;
  selected: ISODate | null;
  onSelect: (day: ISODate) => void;
  onPrev: () => void;
  onNext: () => void;
  /** "날짜 바꾸기" mode: highlights the grid and changes the hint. */
  picking?: boolean;
}) {
  const c = useColors();
  const weeks = monthGrid(year, month);
  const nextDisabled = `${year}-${String(month + 1).padStart(2, '0')}` >= today.slice(0, 7);
  return (
    <View style={{ gap: spacing.xs }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Pressable onPress={onPrev} hitSlop={12} accessibilityRole="button" accessibilityLabel="이전 달">
          <Ionicons name="chevron-back" size={20} color={c.textSecondary} />
        </Pressable>
        <AppText variant="bodyStrong" accessibilityRole="header">
          {year}년 {month + 1}월
        </AppText>
        <Pressable onPress={onNext} disabled={nextDisabled} hitSlop={12} accessibilityRole="button" accessibilityLabel="다음 달" accessibilityState={{ disabled: nextDisabled }}>
          <Ionicons name="chevron-forward" size={20} color={nextDisabled ? c.textTertiary : c.textSecondary} />
        </Pressable>
      </Row>
      {picking ? (
        <AppText variant="caption" tone="secondary" align="center">
          옮길 날짜를 눌러 주세요
        </AppText>
      ) : null}
      <Row>
        {WEEK.map((w) => (
          <AppText key={w} variant="caption" tone="tertiary" align="center" style={{ flex: 1 }}>
            {w}
          </AppText>
        ))}
      </Row>
      {weeks.map((week, wi) => (
        <Row key={wi}>
          {week.map((day, di) => {
            if (!day) return <View key={di} style={styles.cell} />;
            const future = day > today;
            const isSelected = day === selected;
            const worn = wornDays.has(day);
            return (
              <Pressable
                key={day}
                onPress={() => onSelect(day)}
                disabled={future}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled: future }}
                accessibilityLabel={`${Number(day.slice(8))}일${day === today ? ', 오늘' : ''}${worn ? ', 착용 기록 있음' : ''}`}
                style={styles.cell}
              >
                <View style={[styles.day, isSelected && { backgroundColor: c.selected }, !isSelected && day === today && { borderWidth: 1, borderColor: c.textPrimary }, picking && !future && !isSelected && { backgroundColor: c.surfaceSunken }]}>
                  <AppText variant="label" style={{ color: isSelected ? c.selectedText : future ? c.textTertiary : c.textPrimary }}>
                    {Number(day.slice(8))}
                  </AppText>
                </View>
                <View style={[styles.dot, { backgroundColor: worn ? c.textPrimary : 'transparent' }]} />
              </Pressable>
            );
          })}
        </Row>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 2 },
  day: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 4, height: 4, borderRadius: 2 },
});
