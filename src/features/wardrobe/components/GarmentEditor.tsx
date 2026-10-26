import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, BottomBar, ChipRow, ColorSwatchRow, InlineMessage, MultiChips, PrimaryButton, Row, ScreenScroll, SecondaryButton, TextField, radius, spacing, useColors } from '@/design-system';
import { GARMENT_CATEGORIES, OCCASIONS, OUTER_WEIGHTS, PATTERNS, SEASONS, STYLE_TAGS, type GarmentCategory, type OuterWeight, type Pattern } from '@/domain/categories';
import { toUserMessage } from '@/domain/errors';
import type { GarmentItem } from '@/domain/models';
import { GARMENT_COLORS, type ColorId } from '@/domain/palette';
import { newId } from '@/utils/id';

import { pickGarmentPhoto, storeGarmentPhoto, type PickedPhoto } from '../garment-import';
import { saveGarment } from '../garment-repository';

export function emptyGarment(): GarmentItem {
  const now = new Date().toISOString();
  return {
    id: newId('g_'),
    name: '',
    category: 'top',
    subcategory: null,
    sourceType: 'manual',
    originalUri: null,
    thumbnailUri: null,
    cutoutUri: null,
    colorIds: ['black'],
    pattern: 'solid',
    fit: null,
    seasonTags: [],
    styleTags: [],
    occasionTags: [],
    outerWeight: null,
    waterResistant: null,
    brand: null,
    sizeLabel: null,
    purchasePriceMinor: null,
    currency: 'KRW',
    purchasedAt: null,
    note: null,
    status: 'active',
    userVerifiedFields: [],
    fromTemplateId: null,
    createdAt: now,
    updatedAt: now,
  };
}

const CATS = GARMENT_CATEGORIES.map((c) => ({ id: c.id, label: c.label }));

/**
 * Add/edit form (prompt §3.3 A/C). Every attribute is chosen by the user — no analyzer is wired
 * yet, so nothing is auto-filled and nothing is labeled "AI". Price is optional (CPW needs it).
 */
export function GarmentEditor({ initial, onSaved }: { initial: GarmentItem; onSaved: (g: GarmentItem) => void }) {
  const c = useColors();
  const [g, setG] = useState<GarmentItem>(initial);
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [price, setPrice] = useState(initial.purchasePriceMinor != null ? String(initial.purchasePriceMinor) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const swatches = useMemo(() => GARMENT_COLORS.map((x) => ({ ...x, isLight: x.luminanceGroup === 2 })), []);
  const set = (patch: Partial<GarmentItem>) => setG((cur) => ({ ...cur, ...patch }));

  const pick = async (src: 'library' | 'camera') => {
    try {
      const p = await pickGarmentPhoto(src);
      if (p) setPhoto(p);
    } catch (e) {
      setError(toUserMessage(e));
    }
  };

  const save = async () => {
    const priceNum = price.trim() ? Number(price.replace(/[^0-9]/g, '')) : null;
    if (!g.name.trim()) return setError('이름을 입력해 주세요. 예: 그레이 니트');
    if (priceNum != null && (!Number.isFinite(priceNum) || priceNum < 0)) return setError('가격은 0 이상의 숫자로 입력해 주세요.');
    setSaving(true);
    setError(null);
    try {
      const files = photo ? await storeGarmentPhoto(photo, g.id) : {};
      const next: GarmentItem = {
        ...g,
        ...files,
        name: g.name.trim(),
        sourceType: photo || g.originalUri ? 'singleItemPhoto' : g.sourceType,
        outerWeight: g.category === 'outer' ? g.outerWeight : null,
        purchasePriceMinor: priceNum,
        userVerifiedFields: ['category', 'colorIds', 'pattern', 'seasonTags', 'styleTags'],
        updatedAt: new Date().toISOString(),
      };
      await saveGarment(next);
      onSaved(next);
    } catch (e) {
      setError(toUserMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const previewUri = photo?.uri ?? g.thumbnailUri;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenScroll withBottomBar>
        <View style={[styles.photo, { backgroundColor: c.photoBackdrop }]}>
          {previewUri ? <Image source={{ uri: previewUri }} style={StyleSheet.absoluteFill} contentFit="contain" accessibilityLabel="옷 사진 미리보기" /> : <AppText variant="secondary" tone="tertiary">사진 없이도 등록할 수 있어요</AppText>}
        </View>
        <Row gap={spacing.xs}>
          <SecondaryButton compact icon="images-outline" label="사진 선택" onPress={() => pick('library')} style={{ flex: 1 }} />
          <SecondaryButton compact icon="camera-outline" label="촬영" onPress={() => pick('camera')} style={{ flex: 1 }} />
        </Row>
        <InlineMessage message="배경 제거·자동 분류는 아직 지원하지 않아요. 아래 항목을 직접 골라 주세요." />

        <TextField label="이름" value={g.name} onChangeText={(name) => set({ name })} placeholder="예: 그레이 니트" maxLength={40} />
        <Section title="카테고리">
          <ChipRow options={CATS} value={g.category} onChange={(category: GarmentCategory) => set({ category })} />
        </Section>
        <Section title="대표 색상">
          <ColorSwatchRow options={swatches} value={g.colorIds[0] ?? 'black'} onChange={(id) => set({ colorIds: [id as ColorId] })} />
        </Section>
        <Section title="패턴">
          <ChipRow options={PATTERNS} value={g.pattern} onChange={(pattern: Pattern) => set({ pattern })} />
        </Section>
        {g.category === 'outer' ? (
          <Section title="두께 (날씨 추천에 사용)">
            <ChipRow options={[{ id: 'unknown', label: '모름' }, ...OUTER_WEIGHTS]} value={g.outerWeight ?? 'unknown'} onChange={(v: OuterWeight | 'unknown') => set({ outerWeight: v === 'unknown' ? null : v })} />
          </Section>
        ) : null}
        <Section title="계절">
          <MultiChips options={SEASONS} values={g.seasonTags} onChange={(seasonTags) => set({ seasonTags })} />
        </Section>
        <Section title="스타일 (최대 3개)">
          <MultiChips options={STYLE_TAGS} values={g.styleTags} onChange={(styleTags) => set({ styleTags })} max={3} />
        </Section>
        <Section title="상황">
          <MultiChips options={OCCASIONS} values={g.occasionTags} onChange={(occasionTags) => set({ occasionTags })} />
        </Section>
        <TextField label="브랜드 (선택)" value={g.brand ?? ''} onChangeText={(brand) => set({ brand: brand || null })} maxLength={40} />
        <TextField label="구매 가격 (선택, 원)" value={price} onChangeText={setPrice} keyboardType="number-pad" hint="입력하면 착용 횟수로 CPW(1회 착용당 비용)를 계산해요" />
        {error ? <InlineMessage tone="error" message={error} /> : null}
      </ScreenScroll>
      <BottomBar>
        <PrimaryButton label="등록하기" loading={saving} onPress={save} style={{ flex: 1 }} />
      </BottomBar>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="label">{title}</AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { aspectRatio: 4 / 3, borderRadius: radius.tile, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
