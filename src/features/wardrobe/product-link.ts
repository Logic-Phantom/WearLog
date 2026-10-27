/**
 * Shopping-mall link import (pure helpers, no network). Reads the metadata a product page already
 * publishes for link previews — Open Graph tags and schema.org Product JSON-LD — and nothing else.
 * Every value is a suggestion the user confirms in the editor (prompt §3.3: never silently trusted).
 */
import type { GarmentCategory } from '@/domain/categories';

export interface ProductMeta {
  title: string | null;
  imageUrl: string | null;
  priceMinor: number | null;
  brand: string | null;
  siteName: string | null;
  url: string;
}

/** Accepts a pasted link (optionally surrounded by share text) and returns a clean http(s) URL. */
export function normalizeProductUrl(input: string): string | null {
  const m = input.match(/https?:\/\/[^\s<>"']+/i);
  if (!m) return null;
  try {
    const u = new URL(m[0]);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.toString();
  } catch {
    return null;
  }
}

const decode = (s: string) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();

function metaContent(html: string, key: string): string | null {
  // <meta property|name="key" content="…"> in either attribute order.
  const k = key.replace(/[.*+?^${}()|[\]\\:]/g, '\\$&');
  const a = new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${k}["'][^>]*content=["']([^"']*)["']`, 'i').exec(html);
  const b = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name|itemprop)=["']${k}["']`, 'i').exec(html);
  const v = (a ?? b)?.[1];
  return v ? decode(v) : null;
}

function absolute(url: string | null, base: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith('//') ? `https:${url}` : url, base);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    // Release builds block cleartext HTTP; image CDNs nearly always serve the same path over TLS.
    u.protocol = 'https:';
    return u.toString();
  } catch {
    return null;
  }
}

/** "39,000원" / "39000.00" / 39000 → 39000 (KRW minor units = 원). */
export function parsePrice(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) && v > 0 ? Math.round(v) : null;
  if (typeof v !== 'string') return null;
  const n = Number(v.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

type Json = Record<string, unknown>;

function findProduct(node: unknown): Json | null {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const n of node) {
      const hit = findProduct(n);
      if (hit) return hit;
    }
    return null;
  }
  const o = node as Json;
  const type = o['@type'];
  if (type === 'Product' || (Array.isArray(type) && type.includes('Product'))) return o;
  return findProduct(o['@graph']);
}

function jsonLdProduct(html: string): Json | null {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    try {
      const hit = findProduct(JSON.parse(m[1].trim()));
      if (hit) return hit;
    } catch {
      // malformed block — ignore, keep looking
    }
  }
  return null;
}

const first = (v: unknown): unknown => (Array.isArray(v) ? v[0] : v);

export function parseProductMeta(html: string, pageUrl: string): ProductMeta {
  const p = jsonLdProduct(html);
  const ldImage = first(p?.image);
  const ldImageUrl = typeof ldImage === 'string' ? ldImage : typeof (ldImage as Json | undefined)?.url === 'string' ? ((ldImage as Json).url as string) : null;
  const offers = first(p?.offers) as Json | undefined;
  const ldBrand = first(p?.brand);
  const brand = typeof ldBrand === 'string' ? ldBrand : typeof (ldBrand as Json | undefined)?.name === 'string' ? ((ldBrand as Json).name as string) : null;
  const title = (typeof p?.name === 'string' ? decode(p.name) : null) ?? metaContent(html, 'og:title') ?? (/<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1] ? decode(/<title[^>]*>([^<]*)<\/title>/i.exec(html)![1]) : null);
  return {
    title: title || null,
    imageUrl: absolute(ldImageUrl ?? metaContent(html, 'og:image:secure_url') ?? metaContent(html, 'og:image') ?? metaContent(html, 'twitter:image'), pageUrl),
    priceMinor: parsePrice(offers?.price ?? offers?.lowPrice) ?? parsePrice(metaContent(html, 'product:price:amount') ?? metaContent(html, 'og:price:amount')),
    brand: brand ? decode(brand) : (metaContent(html, 'product:brand') ?? null),
    siteName: metaContent(html, 'og:site_name'),
    url: pageUrl,
  };
}

/** Keyword → category hint from the product title. A hint only; the editor shows it for confirmation. */
const HINTS: [RegExp, GarmentCategory][] = [
  [/원피스|점프\s?수트|dress|jumpsuit/i, 'onepiece'],
  [/코트|패딩|자켓|재킷|점퍼|블루종|가디건|야상|베스트|coat|jacket|parka|cardigan|blazer/i, 'outer'],
  [/청바지|데님\s?팬츠|팬츠|바지|슬랙스|스커트|치마|쇼츠|반바지|jeans|pants|trousers|skirt|shorts/i, 'bottom'],
  [/스니커즈|운동화|로퍼|부츠|샌들|슬리퍼|구두|러닝화|sneaker|shoes|loafer|boots|sandal/i, 'shoes'],
  [/가방|백팩|토트|숄더|크로스백|에코백|bag|backpack|tote/i, 'bag'],
  [/모자|캡|비니|버킷햇|cap|beanie|hat/i, 'hat'],
  [/니트|스웨터|맨투맨|후드|티셔츠|셔츠|블라우스|폴로|탑|knit|sweater|hoodie|shirt|tee|top/i, 'top'],
  [/목도리|머플러|스카프|벨트|시계|선글라스|양말|scarf|belt|watch|sunglasses|socks/i, 'accessory'],
];

export function guessCategory(title: string | null): GarmentCategory | null {
  if (!title) return null;
  return HINTS.find(([re]) => re.test(title))?.[1] ?? null;
}

/** Strips "| 쇼핑몰명" and "- 사이즈 & 후기" style suffixes so the name field gets just the product. */
export function cleanTitle(title: string | null, siteName: string | null): string | null {
  if (!title) return null;
  let t = title.replace(/\s*\|[^|]*$/, '');
  t = t.replace(/\s*[-–—]\s*[^-–—]*(사이즈|후기|리뷰|구매|최저가|공식)[^-–—]*$/, '');
  if (siteName && t.endsWith(siteName)) t = t.slice(0, -siteName.length).replace(/[\s|\-–—:]+$/, '');
  t = t.trim();
  return (t.length > 60 ? `${t.slice(0, 59)}…` : t) || null;
}
