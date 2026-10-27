import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { View } from 'react-native';

import { useColors } from '@/design-system';
import type { GarmentItem, ItemRef } from '@/domain/models';
import { GarmentVector } from '@/features/sample-wardrobe/components/GarmentVector';
import { getTemplate } from '@/features/sample-wardrobe/catalog';
import { showcaseImage } from '@/features/sample-wardrobe/showcase-assets';
import { isFileReachable } from '@/infrastructure/file-storage/app-files';

/**
 * Draws one outfit item from its ref: photo sample → showcase image (cutout on canvases, `tile` in
 * grids), vector sample → vector (re-renders on customization), owned → its cutout/thumbnail, or a
 * neutral placeholder (never a fake image) when there is none.
 */
export function ItemVisual({ itemRef, owned, size, variant = 'cutout' }: { itemRef: ItemRef; owned?: GarmentItem | null; size: number; variant?: 'cutout' | 'tile' }) {
  const c = useColors();
  if (itemRef.kind === 'sampleTemplate') {
    const t = getTemplate(itemRef.templateId);
    if (!t) return <Placeholder size={size} />;
    const src = t.photo ? showcaseImage((variant === 'cutout' && t.photo.cutout) || t.photo.tile) : undefined;
    if (src) {
      return <Image source={src} style={variant === 'tile' ? { width: '100%', height: '100%' } : { width: size, height: size, borderRadius: t.photo?.cutout ? 0 : 8 }} contentFit={variant === 'tile' ? 'cover' : 'contain'} accessibilityLabel={`샘플 ${t.nameKo}`} />;
    }
    return <GarmentVector shapeId={t.shapeId} colorId={itemRef.customization.colorId} fit={itemRef.customization.fit} pattern={itemRef.customization.pattern} size={size} accessibilityLabel={`샘플 ${t.nameKo}`} />;
  }
  const uri = owned?.cutoutUri ?? owned?.thumbnailUri;
  if (uri && isFileReachable(uri)) {
    return <Image source={{ uri }} style={{ width: size, height: size }} contentFit="contain" accessibilityLabel={owned?.name} />;
  }
  return <Placeholder size={size} missing={!!uri} label={owned?.name} color={c.textTertiary} />;
}

function Placeholder({ size, missing, label, color }: { size: number; missing?: boolean; label?: string; color?: string }) {
  const c = useColors();
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={missing ? `${label ?? '옷'} 사진 누락` : label}>
      <Ionicons name={missing ? 'image-outline' : 'shirt-outline'} size={size * 0.4} color={color ?? c.textTertiary} />
    </View>
  );
}
