import { StyleSheet, View } from 'react-native';

import { SourceBadge, radius, spacing, useColors } from '@/design-system';
import type { GarmentItem, ItemRef } from '@/domain/models';

import { ItemVisual } from './ItemVisual';

/**
 * Flat-lay outfit preview (showcase "오늘의 추천 코디"): items on a neutral backdrop, each with its
 * source badge so samples never pass as owned clothes.
 */
export function OutfitBoard({ refs, owned, height = 240 }: { refs: ItemRef[]; owned: Map<string, GarmentItem>; height?: number }) {
  const c = useColors();
  const cell = Math.floor((height - spacing.md * 2) / 2);
  return (
    <View style={[styles.board, { backgroundColor: c.photoBackdrop, minHeight: height }]}>
      {refs.map((r, i) => (
        <View key={i} style={{ alignItems: 'center', gap: 2 }}>
          <ItemVisual itemRef={r} owned={r.kind === 'ownedGarment' ? owned.get(r.garmentItemId) : null} size={cell} />
          <SourceBadge source={r.kind === 'ownedGarment' ? 'owned' : 'sample'} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { borderRadius: radius.tile, padding: spacing.md, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: spacing.xs },
});
