import { hasBatchim, josa } from '@/utils/korean';

describe('josa', () => {
  it('picks the particle from the final syllable', () => {
    expect(hasBatchim('신발')).toBe(true);
    expect(hasBatchim('상의')).toBe(false);
    expect(josa('상의·하의·신발', '을', '를')).toBe('상의·하의·신발을');
    expect(josa('하의', '이', '가')).toBe('하의가');
    expect(josa('ABC', '이', '가')).toBe('ABC가');
  });
});
