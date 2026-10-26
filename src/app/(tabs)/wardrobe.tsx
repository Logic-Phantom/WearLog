import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AppText, ChipRow, EmptyState, ErrorState, ScreenScroll, SegmentedControl, SourceBadge, contentMaxWidth, elevation, radius, spacing, touchTarget, useColors, wardrobeColumns } from '@/design-system';
import { GARMENT_CATEGORIES, type GarmentCategory } from '@/domain/categories';
import { ItemVisual } from '@/features/outfit-builder/components/ItemVisual';
import { SAMPLE_TEMPLATES } from '@/features/sample-wardrobe/catalog';
import { GarmentVector } from '@/features/sample-wardrobe/components/GarmentVector';
import { listGarments } from '@/features/wardrobe/garment-repository';
import { useAppState } from '@/hooks/app-state';
import { useAsync } from '@/hooks/use-async';

type Tab = 'owned' | 'sample';
type Cat = GarmentCategory | 'all';
const CATS: { id: Cat; label: string }[] = [{ id: 'all', label: '전체' }, ...GARMENT_CATEGORIES.filter((c) => c.id !== 'other')];

/** 옷장: 내 옷장 | 샘플 옷장 are separate tabs; every tile carries its source badge (prompt §3.4). */
export default function WardrobeScreen() {
  const router = useRouter();
  const c = useColors();
  const { width } = useWindowDimensions();
  const { dataVersion } = useAppState();
  const [tab, setTab] = useState<Tab>('owned');
  const [cat, setCat] = useState<Cat>('all');
  const owned = useAsync(() => listGarments(cat === 'all' ? null : cat), [cat, dataVersion]);

  const tile = Math.floor((Math.min(width, contentMaxWidth) - spacing.md * 2 - spacing.xs * (wardrobeColumns - 1)) / wardrobeColumns);
  const samples = SAMPLE_TEMPLATES.filter((t) => cat === 'all' || t.category === cat);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenScroll topInset>
        <SegmentedControl
          options={[
            { id: 'owned', label: '내 옷장' },
            { id: 'sample', label: '샘플 옷장' },
          ]}
          value={tab}
          onChange={setTab}
        />
        <ChipRow options={CATS} value={cat} onChange={setCat} />

        {tab === 'owned' ? (
          owned.error ? (
            <ErrorState message={owned.error} onRetry={owned.reload} />
          ) : owned.data && owned.data.length === 0 ? (
            <EmptyState
              icon="shirt-outline"
              title={cat === 'all' ? '아직 등록한 옷이 없어요' : '이 카테고리에 옷이 없어요'}
              message="사진이나 직접 입력으로 옷을 등록하거나, 샘플 옷으로 먼저 코디해 볼 수 있어요."
              actionLabel="내 옷 등록하기"
              onAction={() => router.push('/wardrobe/add')}
              secondaryLabel="샘플 코디 시작"
              onSecondary={() => router.push('/sample-wardrobe')}
            />
          ) : (
            <View style={styles.grid}>
              {(owned.data ?? []).map((g) => (
                <Pressable key={g.id} onPress={() => router.push({ pathname: '/wardrobe/[itemId]', params: { itemId: g.id } })} accessibilityRole="button" accessibilityLabel={`${g.name}, 내 옷`} style={[styles.tile, { width: tile, backgroundColor: c.photoBackdrop }]}>
                  <ItemVisual itemRef={{ kind: 'ownedGarment', garmentItemId: g.id }} owned={g} size={tile - spacing.xs * 2} />
                  <View style={styles.badge}>
                    <SourceBadge source="owned" />
                  </View>
                </Pressable>
              ))}
            </View>
          )
        ) : (
          <View style={styles.grid}>
            {samples.map((t) => (
              <Pressable key={t.id} onPress={() => router.push({ pathname: '/sample-wardrobe', params: { templateId: t.id } })} accessibilityRole="button" accessibilityLabel={`${t.nameKo}, 샘플`} style={[styles.tile, { width: tile, backgroundColor: c.photoBackdrop }]}>
                <GarmentVector shapeId={t.shapeId} colorId={t.defaultColorId} fit={t.supportedFits[0]} pattern={t.supportedPatterns[0]} size={tile - spacing.lg * 2} />
                <AppText variant="caption" tone="secondary" numberOfLines={1}>
                  {t.nameKo}
                </AppText>
                <View style={styles.badge}>
                  <SourceBadge source="sample" />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScreenScroll>
      {tab === 'owned' ? (
        <Pressable onPress={() => router.push('/wardrobe/add')} accessibilityRole="button" accessibilityLabel="옷 등록하기" style={[styles.fab, elevation.raised, { backgroundColor: c.accent }]}>
          <Ionicons name="add" size={28} color={c.textOnAccent} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tile: { aspectRatio: 0.82, borderRadius: radius.photo, alignItems: 'center', justifyContent: 'center', padding: spacing.xs, gap: 2 },
  badge: { position: 'absolute', top: 6, left: 6 },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.xl, width: touchTarget + 12, height: touchTarget + 12, borderRadius: (touchTarget + 12) / 2, alignItems: 'center', justifyContent: 'center' },
});
