import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AppText, ChipRow, EmptyState, ErrorState, ScreenScroll, SourceBadge, UnderlineTabs, contentMaxWidth, elevation, radius, spacing, touchTarget, useColors, wardrobeColumns } from '@/design-system';
import { GARMENT_CATEGORIES, type GarmentCategory } from '@/domain/categories';
import { ItemVisual } from '@/features/outfit-builder/components/ItemVisual';
import { SAMPLE_TEMPLATES } from '@/features/sample-wardrobe/catalog';
import { listGarments } from '@/features/wardrobe/garment-repository';
import { useAppState } from '@/hooks/app-state';
import { useAsync } from '@/hooks/use-async';

type Tab = 'owned' | 'sample';
type Cat = GarmentCategory | 'all';
/** Showcase 옷장 grid order; other photo samples follow. */
const SHOWCASE_ORDER = ['ph-coat-beige', 'ph-zip-jacket-black', 'ph-puffer-black', 'ph-jeans-light', 'ph-jeans-mid', 'ph-sneakers-white', 'ph-loafers-black', 'ph-knit-cream', 'ph-runner-gray', 'ph-knit-black', 'ph-hoodie-gray', 'ph-shirt-navy'];
const rank = (id: string) => (SHOWCASE_ORDER.includes(id) ? SHOWCASE_ORDER.indexOf(id) : SHOWCASE_ORDER.length);
const CATS: { id: Cat; label: string }[] = [{ id: 'all', label: '전체' }, ...GARMENT_CATEGORIES.filter((c) => c.id !== 'other' && c.id !== 'onepiece')];

/**
 * 옷장 (showcase): 내 옷장 | 샘플 옷장 underline tabs, category chips, 3-up photo grid, + FAB.
 * An empty 내 옷장 opens on 샘플 옷장 once; every sample tile keeps its "샘플" badge (prompt §3.4).
 */
export default function WardrobeScreen() {
  const router = useRouter();
  const c = useColors();
  const { width } = useWindowDimensions();
  const { dataVersion } = useAppState();
  const [tab, setTab] = useState<Tab | null>(null);
  const [cat, setCat] = useState<Cat>('all');
  const owned = useAsync(() => listGarments(cat === 'all' ? null : cat), [cat, dataVersion]);
  const all = useAsync(() => listGarments(), [dataVersion]);
  // Until the user picks a tab, start where there is something to see.
  const shown: Tab = tab ?? (all.data && all.data.length === 0 ? 'sample' : 'owned');

  const tile = Math.floor((Math.min(width, contentMaxWidth) - spacing.md * 2 - spacing.sm * (wardrobeColumns - 1)) / wardrobeColumns);
  const samples = SAMPLE_TEMPLATES.filter((t) => (cat === 'all' || t.category === cat) && t.photo).sort((a, b) => rank(a.id) - rank(b.id));

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenScroll topInset>
        <UnderlineTabs
          options={[
            { id: 'owned', label: '내 옷장' },
            { id: 'sample', label: '샘플 옷장' },
          ]}
          value={shown}
          onChange={setTab}
        />
        <ChipRow options={CATS} value={cat} onChange={setCat} />

        {shown === 'owned' ? (
          owned.error ? (
            <ErrorState message={owned.error} onRetry={owned.reload} />
          ) : owned.data && owned.data.length === 0 ? (
            <EmptyState
              icon="shirt-outline"
              title={cat === 'all' ? '아직 등록한 옷이 없어요' : '이 카테고리에 옷이 없어요'}
              message="사진이나 직접 입력으로 옷을 등록하거나, 샘플 옷장에서 먼저 코디해 볼 수 있어요."
              actionLabel="내 옷 등록하기"
              onAction={() => router.push('/wardrobe/add')}
              secondaryLabel="샘플 옷장 보기"
              onSecondary={() => setTab('sample')}
            />
          ) : (
            <View style={styles.grid}>
              {(owned.data ?? []).map((g) => (
                <Pressable key={g.id} onPress={() => router.push({ pathname: '/wardrobe/[itemId]', params: { itemId: g.id } })} accessibilityRole="button" accessibilityLabel={`${g.name}, 내 옷`} style={[styles.tile, { width: tile, backgroundColor: c.photoBackdrop }]}>
                  <ItemVisual itemRef={{ kind: 'ownedGarment', garmentItemId: g.id }} owned={g} size={tile} />
                </Pressable>
              ))}
            </View>
          )
        ) : (
          <View style={styles.grid}>
            {samples.map((t) => (
              <Pressable key={t.id} onPress={() => router.push({ pathname: '/sample-wardrobe', params: { templateId: t.id } })} accessibilityRole="button" accessibilityLabel={`${t.nameKo}, 샘플`} style={[styles.tile, { width: tile, backgroundColor: c.photoBackdrop }]}>
                <ItemVisual itemRef={{ kind: 'sampleTemplate', templateId: t.id, customization: { colorId: t.defaultColorId } }} size={tile} variant="tile" />
                <View style={styles.badge}>
                  <SourceBadge source="sample" />
                </View>
              </Pressable>
            ))}
            {samples.length === 0 ? (
              <AppText variant="secondary" tone="tertiary">
                이 카테고리에는 샘플 사진이 없어요
              </AppText>
            ) : null}
          </View>
        )}
      </ScreenScroll>
      <Pressable onPress={() => router.push('/wardrobe/add')} accessibilityRole="button" accessibilityLabel="옷 등록하기" style={[styles.fab, elevation.raised, { backgroundColor: c.accent }]}>
        <Ionicons name="add" size={30} color={c.textOnAccent} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: { aspectRatio: 0.86, borderRadius: radius.photo, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  badge: { position: 'absolute', top: 6, left: 6, opacity: 0.92 },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, width: touchTarget + 12, height: touchTarget + 12, borderRadius: (touchTarget + 12) / 2, alignItems: 'center', justifyContent: 'center' },
});
