import { useState, type ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { SourceBadge, contentMaxWidth, radius, spacing, useColors } from '@/design-system';
import type { GarmentCategory } from '@/domain/categories';
import type { GarmentItem, ItemRef } from '@/domain/models';

import { ItemVisual } from './ItemVisual';

/** Flat-lay slots as fractions of the board (showcase "오늘의 추천 코디": knit left, coat center, shoes right). */
type Slot = { x: number; y: number; w: number; h: number };
const WITH_OUTER: Partial<Record<GarmentCategory, Slot[]>> = {
  outer: [{ x: 0.33, y: 0.17, w: 0.34, h: 0.45 }],
  top: [{ x: 0.04, y: 0.06, w: 0.3, h: 0.4 }],
  onepiece: [{ x: 0.04, y: 0.06, w: 0.3, h: 0.6 }],
  bottom: [{ x: 0.37, y: 0.6, w: 0.26, h: 0.38 }, { x: 0.68, y: 0.42, w: 0.24, h: 0.55 }],
  shoes: [{ x: 0.68, y: 0.14, w: 0.28, h: 0.24 }],
  hat: [{ x: 0.42, y: 0.01, w: 0.16, h: 0.15 }],
  bag: [{ x: 0.06, y: 0.55, w: 0.24, h: 0.32 }],
  accessory: [{ x: 0.06, y: 0.8, w: 0.18, h: 0.18 }],
};
const NO_OUTER: Partial<Record<GarmentCategory, Slot[]>> = {
  top: [{ x: 0.08, y: 0.06, w: 0.4, h: 0.48 }],
  onepiece: [{ x: 0.08, y: 0.06, w: 0.4, h: 0.8 }],
  bottom: [{ x: 0.5, y: 0.3, w: 0.3, h: 0.66 }],
  shoes: [{ x: 0.12, y: 0.62, w: 0.3, h: 0.28 }],
  hat: [{ x: 0.55, y: 0.04, w: 0.2, h: 0.2 }],
  bag: [{ x: 0.78, y: 0.06, w: 0.2, h: 0.3 }],
  accessory: [{ x: 0.8, y: 0.7, w: 0.18, h: 0.18 }],
};

/**
 * Flat-lay outfit preview (showcase "오늘의 추천 코디"): photo cutouts arranged on a neutral backdrop.
 * One source badge per board ("샘플 포함" / "내 옷") so samples never pass as owned clothes.
 */
export function OutfitBoard({ items, owned, height, overlay }: { items: { ref: ItemRef; category: GarmentCategory }[]; owned: Map<string, GarmentItem>; height?: number; overlay?: ReactNode }) {
  const c = useColors();
  const { width } = useWindowDimensions();
  // Measured width (the board often sits inside a padded card); window width is only the first guess.
  const [measured, setMeasured] = useState<number | null>(null);
  const w = measured ?? Math.min(width, contentMaxWidth) - spacing.md * 2;
  const h = height ?? Math.round(w * 0.82);
  const slots = items.some((i) => i.category === 'outer') ? WITH_OUTER : NO_OUTER;
  const used: Partial<Record<string, number>> = {};
  const hasSample = items.some((i) => i.ref.kind === 'sampleTemplate');
  return (
    <View onLayout={(e) => setMeasured(Math.round(e.nativeEvent.layout.width))} style={[styles.board, { backgroundColor: c.photoBackdrop, height: h }]}>
      {items.map((it, i) => {
        const list = slots[it.category] ?? slots.accessory!;
        const n = used[it.category] ?? 0;
        used[it.category] = n + 1;
        const s = list[Math.min(n, list.length - 1)];
        const size = Math.min(s.w * w, s.h * h);
        return (
          <View key={i} style={{ position: 'absolute', left: s.x * w + (s.w * w - size) / 2, top: s.y * h + (s.h * h - size) / 2, width: size, height: size }}>
            <ItemVisual itemRef={it.ref} owned={it.ref.kind === 'ownedGarment' ? owned.get(it.ref.garmentItemId) : null} size={size} />
          </View>
        );
      })}
      <View style={styles.badge}>
        <SourceBadge source={hasSample ? 'sample' : 'owned'} />
      </View>
      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { borderRadius: radius.tile, overflow: 'hidden' },
  badge: { position: 'absolute', top: spacing.xs, right: spacing.xs },
});
