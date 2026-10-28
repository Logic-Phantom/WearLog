import { BATCH_LIMIT, advanceBatch, batchLabel, batchSummary, startBatch } from '@/features/wardrobe/batch-import';
import { mayHaveAlpha } from '@/features/wardrobe/garment-import';

const photo = (i: number) => ({ uri: `file:///p${i}.jpg`, width: 100, height: 100 });

describe('batch import queue', () => {
  it('starts only with photos and caps the queue', () => {
    expect(startBatch([])).toBeNull();
    const s = startBatch(Array.from({ length: BATCH_LIMIT + 5 }, (_, i) => photo(i)))!;
    expect(s.photos).toHaveLength(BATCH_LIMIT);
    expect(batchLabel(s)).toBe(`1/${BATCH_LIMIT}`);
  });

  it('counts saved and skipped, and ends after the last photo', () => {
    let s = startBatch([photo(1), photo(2), photo(3)])!;
    s = advanceBatch(s, 'saved')!;
    expect(batchLabel(s)).toBe('2/3');
    s = advanceBatch(s, 'skipped')!;
    expect(s).toMatchObject({ index: 2, saved: 1, skipped: 1 });
    expect(advanceBatch(s, 'saved')).toBeNull();
  });

  it('summarizes the result', () => {
    expect(batchSummary(3, 0)).toBe('3벌을 등록했어요.');
    expect(batchSummary(2, 1)).toBe('2벌 등록, 1장 건너뛰었어요.');
  });
});

describe('mayHaveAlpha', () => {
  it('keeps transparency only for PNG/WebP sources', () => {
    expect(mayHaveAlpha({ uri: 'file:///x/import-1.png' })).toBe(true);
    expect(mayHaveAlpha({ uri: 'blob:http://localhost/abc', mimeType: 'image/webp' })).toBe(true);
    expect(mayHaveAlpha({ uri: 'data:image/png;base64,AAAA' })).toBe(true);
    expect(mayHaveAlpha({ uri: 'file:///x/photo.jpg', mimeType: 'image/jpeg' })).toBe(false);
    expect(mayHaveAlpha({ uri: 'ph://ABC', mimeType: null })).toBe(false);
  });
});
