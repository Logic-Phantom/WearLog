import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useColors } from '../theme';
import { fonts, radius, spacing, touchTarget } from '../tokens';
import { AppText } from './AppText';

/** Labeled text input; label is always visible (not placeholder-only) for accessibility. */
export function TextField({ label, error, hint, ...rest }: TextInputProps & { label: string; error?: string | null; hint?: string }) {
  const c = useColors();
  return (
    <View style={{ gap: spacing.xxs }}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.textTertiary}
        style={[styles.input, { color: c.textPrimary, backgroundColor: c.surface, borderColor: error ? c.error : c.border }]}
        maxFontSizeMultiplier={2}
        {...rest}
      />
      {error ? <AppText variant="caption" tone="error">{error}</AppText> : hint ? <AppText variant="caption" tone="tertiary">{hint}</AppText> : null}
    </View>
  );
}

/** Compact search box (옷장 검색): icon + input + clear button. The accessibility label stays explicit. */
export function SearchField({ value, onChangeText, placeholder, accessibilityLabel }: { value: string; onChangeText: (v: string) => void; placeholder: string; accessibilityLabel: string }) {
  const c = useColors();
  return (
    <View style={[styles.search, { backgroundColor: c.surfaceSunken }]}>
      <Ionicons name="search" size={16} color={c.textTertiary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        accessibilityLabel={accessibilityLabel}
        placeholderTextColor={c.textTertiary}
        returnKeyType="search"
        autoCorrect={false}
        maxFontSizeMultiplier={2}
        style={[styles.searchInput, { color: c.textPrimary }]}
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="검색어 지우기">
          <Ionicons name="close-circle" size={18} color={c.textTertiary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: touchTarget, borderRadius: radius.field, paddingHorizontal: spacing.sm },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 15, paddingVertical: spacing.xs },
  input: { minHeight: touchTarget + 4, borderWidth: 1, borderRadius: radius.field, paddingHorizontal: spacing.sm, fontFamily: fonts.regular, fontSize: 15 },
});
