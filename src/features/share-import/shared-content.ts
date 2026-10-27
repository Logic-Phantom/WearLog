/**
 * What another app shared to WearLog ("공유 → WearLog"), reduced to what the 옷 등록 screen can use.
 * Pure: the native share-intent payload goes in, route params come out (tests/unit/shared-content).
 */
export interface SharedFileLike {
  path: string;
  mimeType: string;
  width: number | null;
  height: number | null;
}

export type SharedGarmentInput =
  | { kind: 'image'; uri: string; width: number; height: number }
  | { kind: 'link'; text: string }
  | { kind: 'unsupported'; reason: string };

export function toSharedGarmentInput(share: { files?: SharedFileLike[] | null; webUrl?: string | null; text?: string | null }): SharedGarmentInput | null {
  const image = share.files?.find((f) => f.mimeType.startsWith('image/'));
  if (image) {
    const uri = /^[a-z]+:\/\//i.test(image.path) ? image.path : `file://${image.path}`;
    return { kind: 'image', uri, width: image.width ?? 0, height: image.height ?? 0 };
  }
  if (share.files?.length) return { kind: 'unsupported', reason: '사진만 옷으로 등록할 수 있어요. 동영상·파일은 지원하지 않아요.' };
  const text = share.webUrl ?? share.text;
  if (text && /https?:\/\//i.test(text)) return { kind: 'link', text };
  if (text) return { kind: 'unsupported', reason: '링크나 사진을 공유해 주세요. 글만으로는 옷을 등록할 수 없어요.' };
  return null;
}

/** Route params for /wardrobe/add (strings only — Expo Router params are serialized). */
export function toAddParams(input: Exclude<SharedGarmentInput, { kind: 'unsupported' }>): Record<string, string> {
  return input.kind === 'image' ? { sharedImage: input.uri, sharedWidth: String(input.width), sharedHeight: String(input.height) } : { sharedLink: input.text };
}
