import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, BottomBar, Card, ChipRow, ColorSwatchRow, GhostButton, PrimaryButton, ScreenScroll, SecondaryButton, SegmentedControl, SourceBadge, radius, spacing, useColors } from '@/design-system';
import { FITS, GARMENT_CATEGORIES, PATTERNS, labelOf, type Fit, type GarmentCategory, type Pattern } from '@/domain/categories';
import type { ItemRef, SampleCustomization } from '@/domain/models';
import { GARMENT_COLORS, type ColorId } from '@/domain/palette';
import { OutfitBoard } from '@/features/outfit-builder/components/OutfitBoard';
import { SAMPLE_TEMPLATES, getTemplate } from '@/features/sample-wardrobe/catalog';
import { ItemVisual } from '@/features/outfit-builder/components/ItemVisual';
import { SAMPLE_PRESETS } from '@/features/sample-wardrobe/presets';

/** Photo samples only — the legacy vector templates stay in the catalog as image fallbacks. */
const PHOTO_SAMPLES = SAMPLE_TEMPLATES.filter((t) => t.photo);
const CATS = GARMENT_CATEGORIES.filter((c) => PHOTO_SAMPLES.some((t) => t.category === c.id));
const EMPTY_OWNED = new Map();

/**
 * 샘플 옷장 (prompt §3.2): 카테고리 → 템플릿 → 색상/핏/패턴 → 캔버스에 추가. Color changes redraw the
 * vector immediately. Nothing here touches the owned wardrobe or wear stats.
 */
export default function SampleWardrobeScreen() {
  const router = useRouter();
  const c = useColors();
  const params = useLocalSearchParams<{ templateId?: string }>();
  const initial = (params.templateId && getTemplate(params.templateId)) || PHOTO_SAMPLES[0];
  const [tab, setTab] = useState<'items' | 'presets'>('items');
  const [cat, setCat] = useState<GarmentCategory>(initial.category);
  const [templateId, setTemplateId] = useState(initial.id);
  const t = getTemplate(templateId)!;
  const [custom, setCustom] = useState<SampleCustomization>({ colorId: t.defaultColorId, fit: t.supportedFits[0], pattern: t.supportedPatterns[0] });
  const [picked, setPicked] = useState<{ itemRef: ItemRef; category: string }[]>([]);

  const templates = PHOTO_SAMPLES.filter((x) => x.category === cat);
  const swatches = useMemo(() => GARMENT_COLORS.filter((g) => t.supportedColorIds.includes(g.id)).map((g) => ({ ...g, isLight: g.luminanceGroup === 2 })), [t]);

  const selectTemplate = (id: string) => {
    const nt = getTemplate(id)!;
    setTemplateId(id);
    setCustom({ colorId: nt.supportedColorIds.includes(custom.colorId) ? custom.colorId : nt.defaultColorId, fit: nt.supportedFits[0], pattern: nt.supportedPatterns[0] });
  };

  const openBuilder = (refs: { itemRef: ItemRef; category: string }[]) => router.push({ pathname: '/builder/[outfitId]', params: { outfitId: 'new', refs: JSON.stringify(refs) } });

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenScroll withBottomBar={tab === 'items' ? 'summary' : false}>
        <SegmentedControl
          options={[
            { id: 'items', label: '샘플 아이템' },
            { id: 'presets', label: '샘플 코디' },
          ]}
          value={tab}
          onChange={setTab}
        />
        {tab === 'items' ? (
          <>
            <ChipRow options={CATS} value={cat} onChange={(id) => (setCat(id), selectTemplate(PHOTO_SAMPLES.find((x) => x.category === id)!.id))} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
              {templates.map((x) => (
                <Pressable key={x.id} onPress={() => selectTemplate(x.id)} accessibilityRole="button" accessibilityState={{ selected: x.id === templateId }} accessibilityLabel={x.nameKo} style={[styles.thumb, { backgroundColor: c.photoBackdrop, borderColor: x.id === templateId ? c.textPrimary : 'transparent' }]}>
                  <ItemVisual itemRef={{ kind: 'sampleTemplate', templateId: x.id, customization: { colorId: x.defaultColorId, fit: x.supportedFits[0], pattern: x.supportedPatterns[0] } }} size={56} />
                  <AppText variant="caption" numberOfLines={1}>{x.nameKo}</AppText>
                </Pressable>
              ))}
            </ScrollView>

            <Card>
              <View style={{ gap: spacing.md }}>
                <View style={[styles.preview, { backgroundColor: c.photoBackdrop }]}>
                  <ItemVisual itemRef={{ kind: 'sampleTemplate', templateId: t.id, customization: custom }} size={200} />
                  <View style={{ position: 'absolute', top: spacing.xs, left: spacing.xs }}>
                    <SourceBadge source="sample" />
                  </View>
                </View>
                <AppText variant="sectionTitle">{t.nameKo}</AppText>
                {swatches.length > 1 ? <ColorSwatchRow options={swatches} value={custom.colorId} onChange={(id) => setCustom({ ...custom, colorId: id as ColorId })} /> : <AppText variant="caption" tone="tertiary">사진 샘플은 촬영된 색상 그대로예요</AppText>}
                {t.supportedFits.length > 1 ? (
                  <ChipRow options={t.supportedFits.map((f) => ({ id: f, label: labelOf(FITS, f) }))} value={custom.fit ?? t.supportedFits[0]} onChange={(f: Fit) => setCustom({ ...custom, fit: f })} />
                ) : null}
                {t.supportedPatterns.length > 1 ? (
                  <ChipRow options={t.supportedPatterns.map((p) => ({ id: p, label: labelOf(PATTERNS, p) }))} value={custom.pattern ?? 'solid'} onChange={(p: Pattern) => setCustom({ ...custom, pattern: p })} />
                ) : null}
                <SecondaryButton label="캔버스에 담기" icon="add" onPress={() => setPicked([...picked, { itemRef: { kind: 'sampleTemplate', templateId: t.id, customization: custom }, category: t.category }])} />
                <GhostButton label="비슷한 옷이 있어요 · 내 옷으로 등록" icon="shirt-outline" onPress={() => router.push({ pathname: '/wardrobe/add', params: { fromTemplate: t.id } })} />
              </View>
            </Card>
          </>
        ) : (
          SAMPLE_PRESETS.map((p) => (
            <Card key={p.id}>
              <View style={{ gap: spacing.sm }}>
                <OutfitBoard items={p.items.map((i) => ({ ref: { kind: 'sampleTemplate', templateId: i.templateId, customization: i.customization }, category: getTemplate(i.templateId)?.category ?? 'other' }))} owned={EMPTY_OWNED} height={200} />
                <AppText variant="sectionTitle">{p.title}</AppText>
                <AppText variant="secondary" tone="secondary">{p.description} · 샘플 코디</AppText>
                <SecondaryButton
                  label="이 코디로 편집하기"
                  onPress={() => openBuilder(p.items.map((i) => ({ itemRef: { kind: 'sampleTemplate', templateId: i.templateId, customization: i.customization }, category: getTemplate(i.templateId)!.category })))}
                />
              </View>
            </Card>
          ))
        )}
      </ScreenScroll>
      {tab === 'items' ? (
        <BottomBar summary={<AppText variant="caption" tone="secondary">담은 샘플 {picked.length}개{picked.length ? ` · 마지막: ${getTemplate((picked[picked.length - 1].itemRef as { templateId: string }).templateId)?.nameKo}` : ''}</AppText>}>
          <SecondaryButton compact label="비우기" disabled={!picked.length} onPress={() => setPicked([])} />
          <PrimaryButton label="코디 빌더 열기" disabled={!picked.length} onPress={() => openBuilder(picked)} style={{ flex: 1 }} />
        </BottomBar>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: { width: 84, alignItems: 'center', gap: 2, padding: spacing.xs, borderRadius: radius.photo, borderWidth: 2 },
  preview: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.tile, paddingVertical: spacing.md },
});
