import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { View } from 'react-native';

import { useColors } from '@/design-system';
import type { GarmentItem, ItemRef } from '@/domain/models';
import { GarmentVector } from '@/features/sample-wardrobe/components/GarmentVector';
import { getTemplate } from '@/features/sample-wardrobe/catalog';
import { isFileReachable } from '@/infrastructure/file-storage/app-files';

/**
 * Draws one outfit item from its ref: sample → vector (re-renders on customization),
 * owned → its cutout/thumbnail, or a neutral placeholder (never a fake image) when there is none.
 */
export function ItemVisual({ itemRef, owned, size }: { itemRef: ItemRef; owned?: GarmentItem | null; size: number }) {
  const c = useColors();
  if (itemRef.kind === 'sampleTemplate') {
    const t = getTemplate(itemRef.templateId);
    if (!t) return <Placeholder size={size} />;
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
