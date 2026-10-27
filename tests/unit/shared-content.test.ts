import { toAddParams, toSharedGarmentInput } from '@/features/share-import/shared-content';

describe('공유 → WearLog payload', () => {
  it('prefers a shared image and keeps its size', () => {
    const r = toSharedGarmentInput({ files: [{ path: '/data/cache/a.jpg', mimeType: 'image/jpeg', width: 800, height: 1000 }], text: 'ignored' });
    expect(r).toEqual({ kind: 'image', uri: 'file:///data/cache/a.jpg', width: 800, height: 1000 });
    expect(toAddParams(r as never)).toEqual({ sharedImage: 'file:///data/cache/a.jpg', sharedWidth: '800', sharedHeight: '1000' });
  });

  it('turns shared links (shopping app, Instagram) into a link import', () => {
    expect(toSharedGarmentInput({ webUrl: null, text: '이 바지 어때? https://www.musinsa.com/products/1' })).toEqual({ kind: 'link', text: '이 바지 어때? https://www.musinsa.com/products/1' });
  });

  it('rejects video and plain text with a reason, ignores empty payloads', () => {
    expect(toSharedGarmentInput({ files: [{ path: 'file:///v.mp4', mimeType: 'video/mp4', width: null, height: null }] })?.kind).toBe('unsupported');
    expect(toSharedGarmentInput({ text: '안녕' })?.kind).toBe('unsupported');
    expect(toSharedGarmentInput({})).toBeNull();
  });
});
