import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, BottomBar, BottomSheet, InlineMessage, MultiChips, PrimaryButton, Row, ScreenScroll, SecondaryButton, TextField, ValueRow, bottomBarMaxHeight, elevation, radius, spacing, useColors } from '@/design-system';
import { GARMENT_CATEGORIES, OCCASIONS, OUTER_WEIGHTS, PATTERNS, SEASONS, STYLE_TAGS, labelOf, type GarmentCategory, type OuterWeight, type Pattern } from '@/domain/categories';
import { toUserMessage } from '@/domain/errors';
import type { GarmentItem } from '@/domain/models';
import { GARMENT_COLORS, type ColorId } from '@/domain/palette';

import { importFromProductLink, pickGarmentPhoto, storeGarmentPhoto, type PickedPhoto } from '../garment-import';
import { saveGarment } from '../garment-repository';

export { emptyGarment } from '../garment-draft';

const CATS = GARMENT_CATEGORIES.map((c) => ({ id: c.id, label: c.label }));

/**
 * Add/edit form (showcase 옷 등록: photo box, 카테고리 › / 색상 ●●● / 패턴 › / 계절 › rows, 등록하기; prompt §3.3 A/C). Every attribute is chosen by the user — no analyzer is wired
 * yet, so nothing is auto-filled and nothing is labeled "AI". Price is optional (CPW needs it).
 */
export function GarmentEditor({ initial, onSaved, initialPhoto = null, initialLink = null, header = null, initialPhotoNote = '공유한 사진을 불러왔어요. 이름·카테고리를 골라 등록해 주세요.' }: {
  initial: GarmentItem;
  onSaved: (g: GarmentItem) => void;
  initialPhoto?: PickedPhoto | null;
  initialLink?: string | null;
  /** Shown above the photo box (옷 등록: "여러 장 한 번에" entry / batch progress). */
  header?: ReactNode;
  /** Message shown when `initialPhoto` is pre-filled (share vs. batch import). */
  initialPhotoNote?: string;
}) {
  const c = useColors();
  const [g, setG] = useState<GarmentItem>(initial);
  const [photo, setPhoto] = useState<PickedPhoto | null>(initialPhoto);
  const [price, setPrice] = useState(initial.purchasePriceMinor != null ? String(initial.purchasePriceMinor) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState(initialLink ?? '');
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkNote, setLinkNote] = useState<{ tone: 'success' | 'error'; text: string } | null>(
    initialPhoto
      ? { tone: 'success', text: initialPhotoNote }
      : initial.sourceType === 'fromSample'
        ? { tone: 'success', text: '샘플 정보를 채웠어요. 샘플 사진은 옮기지 않으니 내 옷 사진을 추가하고 가격·브랜드를 확인해 주세요.' }
        : null,
  );
  const [sheet, setSheet] = useState<'category' | 'pattern' | 'season' | 'weight' | 'occasion' | null>(null);
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

  // Shopping-mall link → photo + suggested name/brand/price/category, all editable below.
  const fromLink = async (input: string = link) => {
    setLinkBusy(true);
    setLinkNote(null);
    try {
      const r = await importFromProductLink(input);
      setPhoto(r.photo);
      setG((cur) => ({
        ...cur,
        name: cur.name.trim() ? cur.name : (r.name ?? ''),
        brand: cur.brand ?? r.meta.brand,
        category: r.categoryHint ?? cur.category,
        note: cur.note ?? `구매 링크: ${r.meta.url}`,
      }));
      if (r.meta.priceMinor != null && !price.trim()) setPrice(String(r.meta.priceMinor));
      setLinkNote({ tone: 'success', text: `${r.meta.siteName ?? '링크'}에서 사진${r.name ? '·이름' : ''}${r.meta.priceMinor != null ? '·가격' : ''}을 가져왔어요. 카테고리·색상이 맞는지 확인해 주세요.` });
    } catch (e) {
      setLinkNote({ tone: 'error', text: toUserMessage(e) });
    } finally {
      setLinkBusy(false);
    }
  };

  // A link shared from another app is imported once, right away.
  const autoLinkDone = useRef(false);
  useEffect(() => {
    if (!initialLink || autoLinkDone.current) return;
    autoLinkDone.current = true;
    void fromLink(initialLink);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once for the shared link
  }, [initialLink]);

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
  const label = (list: readonly { id: string; label: string }[], ids: string[]) => (ids.length ? ids.map((id) => list.find((x) => x.id === id)?.label ?? id).join('/') : '선택 안 함');

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenScroll withBottomBar contentContainerStyle={{ padding: spacing.md, gap: 0, paddingBottom: bottomBarMaxHeight + spacing.xxl }}>
        {header}
        <Pressable
          onPress={() => Alert.alert('옷 사진', undefined, [{ text: '사진 선택', onPress: () => pick('library') }, { text: '촬영', onPress: () => pick('camera') }, { text: '취소', style: 'cancel' }])}
          accessibilityRole="button"
          accessibilityLabel={previewUri ? '옷 사진 바꾸기' : '옷 사진 추가'}
          style={[styles.photo, elevation.card, { backgroundColor: c.photoBackdrop, borderColor: c.surface }]}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={StyleSheet.absoluteFill} contentFit="contain" accessibilityLabel="옷 사진 미리보기" />
          ) : (
            <View style={{ alignItems: 'center', gap: spacing.xs }}>
              <Ionicons name="camera-outline" size={30} color={c.textTertiary} />
              <AppText variant="secondary" tone="tertiary">사진 추가 (선택)</AppText>
            </View>
          )}
        </Pressable>
        <AppText variant="caption" tone="tertiary" style={{ marginTop: spacing.xs, marginBottom: spacing.sm }}>
          배경 제거·자동 분류는 아직 지원하지 않아요. 아래 항목을 직접 골라 주세요.
        </AppText>

        <View style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
          <TextField label="쇼핑몰 링크로 가져오기 (선택)" value={link} onChangeText={setLink} placeholder="상품 페이지 링크 붙여넣기" autoCapitalize="none" autoCorrect={false} keyboardType="url" />
          <Row gap={spacing.xs}>
            <SecondaryButton compact label="링크에서 가져오기" icon="link-outline" loading={linkBusy} disabled={!link.trim()} onPress={() => fromLink()} style={{ flex: 1 }} />
          </Row>
          {linkNote ? <InlineMessage tone={linkNote.tone} message={linkNote.text} /> : null}
        </View>

        <TextField label="이름" value={g.name} onChangeText={(name) => set({ name })} placeholder="예: 그레이 니트" maxLength={60} />
        <ValueRow label="카테고리" value={labelOf(CATS, g.category)} onPress={() => setSheet('category')} />
        <ValueRow label="색상">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxWidth: '68%' }} contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
            {swatches.map((sw) => {
              const on = g.colorIds[0] === sw.id;
              return (
                <Pressable key={sw.id} onPress={() => set({ colorIds: [sw.id as ColorId] })} accessibilityRole="radio" accessibilityLabel={sw.nameKo} accessibilityState={{ checked: on }} hitSlop={4} style={[styles.swatch, { backgroundColor: sw.hex, borderColor: on ? c.textPrimary : c.border, borderWidth: on ? 2 : 1 }]} />
              );
            })}
          </ScrollView>
        </ValueRow>
        <ValueRow label="패턴" value={labelOf(PATTERNS, g.pattern)} onPress={() => setSheet('pattern')} />
        <ValueRow label="계절" value={label(SEASONS, g.seasonTags)} onPress={() => setSheet('season')} />
        {g.category === 'outer' ? <ValueRow label="두께" value={g.outerWeight ? labelOf(OUTER_WEIGHTS, g.outerWeight) : '모름'} onPress={() => setSheet('weight')} /> : null}
        <ValueRow label="상황" value={label(OCCASIONS, g.occasionTags)} onPress={() => setSheet('occasion')} />
        <View style={{ gap: spacing.xs, paddingVertical: spacing.sm }}>
          <AppText variant="bodyStrong">스타일 태그</AppText>
          <MultiChips options={STYLE_TAGS.map((t) => ({ id: t.id, label: `#${t.label}` }))} values={g.styleTags} onChange={(styleTags) => set({ styleTags })} max={3} />
        </View>
        <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          <TextField label="브랜드 (선택)" value={g.brand ?? ''} onChangeText={(brand) => set({ brand: brand || null })} maxLength={40} />
          <TextField label="구매 가격 (선택, 원)" value={price} onChangeText={setPrice} keyboardType="number-pad" hint="입력하면 착용 횟수로 CPW(1회 착용당 비용)를 계산해요" />
          {error ? <InlineMessage tone="error" message={error} /> : null}
        </View>
      </ScreenScroll>
      <BottomBar>
        <PrimaryButton label="등록하기" loading={saving} onPress={save} style={{ flex: 1 }} />
      </BottomBar>

      <BottomSheet visible={sheet != null} title={sheet === 'category' ? '카테고리' : sheet === 'pattern' ? '패턴' : sheet === 'season' ? '계절' : sheet === 'weight' ? '두께 (날씨 추천에 사용)' : '상황'} onClose={() => setSheet(null)}>
        {sheet === 'category' ? <MultiChips options={CATS} values={[g.category]} onChange={(v) => v.length && (set({ category: v[v.length - 1] as GarmentCategory }), setSheet(null))} /> : null}
        {sheet === 'pattern' ? <MultiChips options={PATTERNS} values={[g.pattern]} onChange={(v) => v.length && (set({ pattern: v[v.length - 1] as Pattern }), setSheet(null))} /> : null}
        {sheet === 'season' ? <MultiChips options={SEASONS} values={g.seasonTags} onChange={(seasonTags) => set({ seasonTags })} /> : null}
        {sheet === 'occasion' ? <MultiChips options={OCCASIONS} values={g.occasionTags} onChange={(occasionTags) => set({ occasionTags })} /> : null}
        {sheet === 'weight' ? <MultiChips options={OUTER_WEIGHTS} values={g.outerWeight ? [g.outerWeight] : []} onChange={(v) => (set({ outerWeight: (v[v.length - 1] as OuterWeight | undefined) ?? null }), setSheet(null))} /> : null}
        {sheet === 'season' || sheet === 'occasion' ? <PrimaryButton label="완료" onPress={() => setSheet(null)} /> : null}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { aspectRatio: 1.55, borderRadius: radius.tile, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 4 },
  swatch: { width: 22, height: 22, borderRadius: 11 },
});
