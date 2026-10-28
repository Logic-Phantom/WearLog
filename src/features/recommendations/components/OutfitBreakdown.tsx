import { StyleSheet, View } from 'react-native';

import { AppText, SourceBadge, radius, spacing, useColors } from '@/design-system';
import { GARMENT_CATEGORIES, labelOf, type GarmentCategory } from '@/domain/categories';
import type { GarmentItem } from '@/domain/models';
import { ItemVisual } from '@/features/outfit-builder/components/ItemVisual';

import type { Recommendation } from '../engine';

/** Head-to-toe order, so the list reads like getting dressed. */
const ORDER: GarmentCategory[] = ['outer', 'top', 'onepiece', 'bottom', 'shoes', 'bag', 'hat', 'accessory', 'other'];

/**
 * "이 코디 구성": each recommended piece with its photo, slot, owned/sample badge and the rule that
 * picked it (Recommendation.itemNotes). Pieces without a note simply show no tag.
 */
export function OutfitBreakdown({ rec, owned }: { rec: Recommendation; owned: Map<string, GarmentItem> }) {
  const c = useColors();
  const items = [...rec.items].sort((a, b) => ORDER.indexOf(a.category) - ORDER.indexOf(b.category));
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="bodyStrong">이 코디 구성</AppText>
      {items.map((it) => {
        const g = it.ref.kind === 'ownedGarment' ? owned.get(it.ref.garmentItemId) : undefined;
        const note = rec.itemNotes[it.key];
        return (
          <View key={it.key} style={[styles.row, { borderBottomColor: c.border }]} accessible accessibilityLabel={`${labelOf(GARMENT_CATEGORIES, it.category)}, ${it.name}${it.ref.kind === 'sampleTemplate' ? ', 샘플' : ''}${note ? `, ${note}` : ''}`}>
            <View style={[styles.thumb, { backgroundColor: c.photoBackdrop }]}>
              <ItemVisual itemRef={it.ref} owned={g} size={48} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="caption" tone="tertiary">
                {labelOf(GARMENT_CATEGORIES, it.category)}
              </AppText>
              <AppText variant="bodyStrong" numberOfLines={1}>
                {it.name}
              </AppText>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4, maxWidth: '45%' }}>
              {it.ref.kind === 'sampleTemplate' ? <SourceBadge source="sample" /> : null}
              {note ? (
                <View style={[styles.note, { backgroundColor: c.surfaceSunken }]}>
                  <AppText variant="caption" numberOfLines={1}>
                    {note}
                  </AppText>
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs, borderBottomWidth: StyleSheet.hairlineWidth },
  thumb: { width: 56, height: 56, borderRadius: radius.photo, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  note: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
});
