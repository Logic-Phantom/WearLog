import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { tapFeedback } from '../haptics';
import { useColors } from '../theme';
import { spacing, touchTarget } from '../tokens';
import { AppText } from './AppText';

export interface SwatchOption {
  id: string;
  nameKo: string;
  hex: string;
  /** Light colors get a visible ring + dark check so white/cream stay distinguishable. */
  isLight: boolean;
}

/**
 * Garment color picker. Selection is shown by ring + check icon + accessible name, never by color
 * alone (prompt §3.2). The selected color name is printed under the row.
 */
export function ColorSwatchRow({ options, value, onChange }: { options: readonly SwatchOption[]; value: string; onChange: (id: string) => void }) {
  const c = useColors();
  const selected = options.find((o) => o.id === value);
  return (
    <View style={{ gap: spacing.xs }}>
      <View style={styles.row} accessibilityRole="radiogroup">
        {options.map((o) => {
          const isSel = o.id === value;
          return (
            <Pressable
              key={o.id}
              onPress={() => {
                tapFeedback();
                onChange(o.id);
              }}
              accessibilityRole="radio"
              accessibilityLabel={o.nameKo}
              accessibilityState={{ selected: isSel }}
              style={[styles.hit, isSel && { borderColor: c.textPrimary }]}>
              <View style={[styles.dot, { backgroundColor: o.hex, borderColor: o.isLight ? c.borderStrong : 'transparent' }]}>
                {isSel ? <Ionicons name="checkmark" size={16} color={o.isLight ? '#1A1A1A' : '#FFFFFF'} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
      {selected ? (
        <AppText variant="caption" tone="secondary">
          선택한 색상: {selected.nameKo}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  hit: { width: touchTarget, height: touchTarget, borderRadius: touchTarget / 2, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  dot: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
