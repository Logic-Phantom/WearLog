/**
 * Web development-preview implementation. expo-file-system has no web support, so small
 * thumbnails are kept as data URIs. The web target is for UI QA only, not a release platform.
 */
export type GarmentFileKind = 'original' | 'thumb' | 'cutout';

export async function persistGarmentFile(tempUri: string, _garmentId: string, kind: GarmentFileKind, base64?: string, format?: 'jpeg' | 'png'): Promise<string> {
  if (base64) return `data:image/${format ?? (kind === 'cutout' ? 'png' : 'jpeg')};base64,${base64}`;
  return tempUri;
}

export function deleteGarmentFiles(_garmentId: string): void {}

export function deleteAllAppFiles(): void {}

export function isFileReachable(_uri: string): boolean {
  return true;
}

export function derivedStorageBytes(): number {
  return 0;
}
