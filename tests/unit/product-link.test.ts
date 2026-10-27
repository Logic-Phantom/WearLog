import { cleanTitle, guessCategory, normalizeProductUrl, parsePrice, parseProductMeta } from '@/features/wardrobe/product-link';

describe('product link import', () => {
  it('extracts the URL from pasted share text', () => {
    expect(normalizeProductUrl('이 니트 어때? https://shop.example.com/goods/123?ref=app 공유')).toBe('https://shop.example.com/goods/123?ref=app');
    expect(normalizeProductUrl('그냥 텍스트')).toBeNull();
    expect(normalizeProductUrl('javascript:alert(1)')).toBeNull();
  });

  it('prefers schema.org Product JSON-LD and resolves relative images', () => {
    const html = `<html><head><title>무시</title>
      <meta property="og:title" content="OG 제목">
      <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"BreadcrumbList"},{"@type":"Product","name":"울 크루넥 니트","image":["/img/knit.jpg"],"brand":{"@type":"Brand","name":"BRAND"},"offers":{"@type":"Offer","price":"59000","priceCurrency":"KRW"}}]}</script>
    </head></html>`;
    const m = parseProductMeta(html, 'https://shop.example.com/goods/1');
    expect(m).toMatchObject({ title: '울 크루넥 니트', imageUrl: 'https://shop.example.com/img/knit.jpg', priceMinor: 59000, brand: 'BRAND' });
  });

  it('falls back to Open Graph tags in either attribute order', () => {
    const html = `<meta content="https://cdn.example.com/a.jpg?w=800&amp;h=800" property="og:image"><meta property="og:title" content="와이드 데님 팬츠 | 예시몰"><meta property="og:site_name" content="예시몰"><meta property="product:price:amount" content="79,000">`;
    const m = parseProductMeta(html, 'https://m.example.com/p/9');
    expect(m.imageUrl).toBe('https://cdn.example.com/a.jpg?w=800&h=800');
    expect(m.priceMinor).toBe(79000);
    expect(cleanTitle(m.title, m.siteName)).toBe('와이드 데님 팬츠');
  });

  it('cleans real-world mall titles and upgrades http images', () => {
    expect(cleanTitle('노매뉴얼(NOMANUAL) WASHED DENIM PANTS - BLACK - 사이즈 & 후기 | 무신사', null)).toBe('노매뉴얼(NOMANUAL) WASHED DENIM PANTS - BLACK');
    expect(parseProductMeta('<meta property="og:image" content="http://img.example.com/a.jpg">', 'https://example.com').imageUrl).toBe('https://img.example.com/a.jpg');
  });

  it('returns no image when the page exposes none (caller shows a clear message)', () => {
    expect(parseProductMeta('<html><body>login required</body></html>', 'https://x.example').imageUrl).toBeNull();
  });

  it('parses prices and guesses categories as hints only', () => {
    expect(parsePrice('39,000원')).toBe(39000);
    expect(parsePrice('0')).toBeNull();
    expect(guessCategory('오버핏 셔츠 자켓')).toBe('outer');
    expect(guessCategory('와이드 데님 팬츠')).toBe('bottom');
    expect(guessCategory('캐시미어 니트')).toBe('top');
    expect(guessCategory('페니 로퍼')).toBe('shoes');
    expect(guessCategory('무언가')).toBeNull();
  });
});
