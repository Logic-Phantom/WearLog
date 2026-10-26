/**
 * Self-made vector garment silhouettes (100×100 viewBox), drawn for WearLog (docs/SAMPLE_CATALOG.md).
 * `fills` are painted in the garment color (+ pattern overlay); `details` are outline-only strokes
 * (collar, placket, seams). Fit variants exist only where the silhouette really changes.
 */
import type { Fit } from '@/domain/categories';

export interface GarmentShape {
  fills: string[];
  details: string[];
}

type ShapeDef = { default: GarmentShape } & Partial<Record<Fit, GarmentShape>>;

const LONG_SLEEVE = 'M30 14 L42 10 Q50 16 58 10 L70 14 L84 28 L92 78 L82 80 L72 42 L70 90 L30 90 L28 42 L18 80 L8 78 L16 28 Z';
const LONG_SLEEVE_WIDE = 'M27 14 L41 9 Q50 16 59 9 L73 14 L88 28 L95 80 L84 82 L75 42 L74 92 L26 92 L25 42 L16 82 L5 80 L12 28 Z';
const TEE = 'M30 14 L42 10 Q50 16 58 10 L70 14 L88 30 L78 42 L70 36 L70 90 L30 90 L30 36 L22 42 L12 30 Z';
const TEE_WIDE = 'M27 14 L41 9 Q50 16 59 9 L73 14 L93 34 L82 47 L74 40 L74 92 L26 92 L26 40 L18 47 L7 34 Z';
const JACKET = 'M30 12 L42 8 L50 14 L58 8 L70 12 L86 28 L92 76 L82 78 L72 42 L72 84 L28 84 L28 42 L18 78 L8 76 L14 28 Z';
const JACKET_WIDE = 'M27 12 L41 7 L50 14 L59 7 L73 12 L89 28 L95 78 L84 80 L75 42 L75 86 L25 86 L25 42 L16 80 L5 78 L11 28 Z';
const COAT = 'M30 10 L42 6 L50 16 L58 6 L70 10 L86 28 L92 74 L82 76 L74 40 L76 98 L24 98 L26 40 L18 76 L8 74 L14 28 Z';
const COAT_WIDE = 'M27 10 L41 5 L50 16 L59 5 L73 10 L89 28 L95 76 L84 78 L77 40 L80 98 L20 98 L23 40 L16 78 L5 76 L11 28 Z';

const SHAPES: Record<string, ShapeDef> = {
  tee: { default: { fills: [TEE], details: ['M42 10 Q50 18 58 10'] }, oversized: { fills: [TEE_WIDE], details: ['M41 9 Q50 18 59 9'] } },
  longTee: { default: { fills: [LONG_SLEEVE], details: ['M42 10 Q50 18 58 10'] }, oversized: { fills: [LONG_SLEEVE_WIDE], details: ['M41 9 Q50 18 59 9'] } },
  sleeveless: { default: { fills: ['M34 10 L42 10 Q50 22 58 10 L66 10 Q66 26 72 32 L72 90 L28 90 L28 32 Q34 26 34 10 Z'], details: [] } },
  shirt: {
    default: { fills: [LONG_SLEEVE], details: ['M42 10 L50 20 L58 10', 'M50 20 L50 90', 'M30 86 L70 86'] },
    oversized: { fills: [LONG_SLEEVE_WIDE], details: ['M41 9 L50 20 L59 9', 'M50 20 L50 92'] },
  },
  knit: {
    default: { fills: [LONG_SLEEVE], details: ['M42 10 Q50 18 58 10', 'M30 84 L70 84', 'M84 74 L92 74', 'M8 74 L16 74'] },
    oversized: { fills: [LONG_SLEEVE_WIDE], details: ['M41 9 Q50 18 59 9', 'M26 86 L74 86'] },
  },
  hoodie: {
    default: { fills: [LONG_SLEEVE, 'M38 13 Q50 -2 62 13 Q50 22 38 13 Z'], details: ['M38 62 L62 62 L66 76 L34 76 Z', 'M47 18 L46 30', 'M53 18 L54 30'] },
    oversized: { fills: [LONG_SLEEVE_WIDE, 'M37 12 Q50 -3 63 12 Q50 22 37 12 Z'], details: ['M36 62 L64 62 L68 78 L32 78 Z'] },
  },
  pants: {
    default: { fills: ['M28 6 L72 6 L74 94 L56 94 L50 34 L44 94 L26 94 Z'], details: ['M28 12 L72 12', 'M50 12 L50 34'] },
    straight: { fills: ['M28 6 L72 6 L74 94 L56 94 L50 34 L44 94 L26 94 Z'], details: ['M28 12 L72 12', 'M50 12 L50 34'] },
    wide: { fills: ['M27 6 L73 6 L84 94 L56 94 L50 36 L44 94 L16 94 Z'], details: ['M27 12 L73 12', 'M50 12 L50 36'] },
    slim: { fills: ['M30 6 L70 6 L65 94 L54 94 L50 34 L46 94 L35 94 Z'], details: ['M30 12 L70 12', 'M50 12 L50 34'] },
  },
  cargo: {
    default: { fills: ['M28 6 L72 6 L74 94 L56 94 L50 34 L44 94 L26 94 Z'], details: ['M28 12 L72 12', 'M27 50 L37 50 L37 64 L27 64', 'M73 50 L63 50 L63 64 L73 64'] },
    straight: { fills: ['M28 6 L72 6 L74 94 L56 94 L50 34 L44 94 L26 94 Z'], details: ['M28 12 L72 12', 'M27 50 L37 50 L37 64 L27 64', 'M73 50 L63 50 L63 64 L73 64'] },
    wide: { fills: ['M27 6 L73 6 L84 94 L56 94 L50 36 L44 94 L16 94 Z'], details: ['M27 12 L73 12', 'M24 50 L35 50 L35 64 L22 64', 'M76 50 L65 50 L65 64 L78 64'] },
  },
  shorts: { default: { fills: ['M26 20 L74 20 L80 66 L56 70 L50 40 L44 70 L20 66 Z'], details: ['M26 26 L74 26'] } },
  skirt: {
    default: { fills: ['M32 16 L68 16 L80 74 L20 74 Z'], details: ['M32 22 L68 22'] },
    long: { fills: ['M32 8 L68 8 L82 96 L18 96 Z'], details: ['M32 14 L68 14'] },
  },
  jacket: {
    default: { fills: [JACKET], details: ['M50 14 L50 84', 'M28 78 L72 78'] },
    oversized: { fills: [JACKET_WIDE], details: ['M50 14 L50 86', 'M25 80 L75 80'] },
  },
  cardigan: {
    default: { fills: [JACKET], details: ['M42 8 L50 40 L58 8', 'M50 40 L50 84', 'M52 50 L52 50.5', 'M52 62 L52 62.5', 'M52 74 L52 74.5'] },
    oversized: { fills: [JACKET_WIDE], details: ['M41 7 L50 42 L59 7', 'M50 42 L50 86'] },
  },
  blazer: {
    default: { fills: [JACKET], details: ['M42 8 L46 36 L50 14 L54 36 L58 8', 'M50 36 L50 84', 'M34 60 L42 60'] },
    oversized: { fills: [JACKET_WIDE], details: ['M41 7 L46 38 L50 14 L54 38 L59 7', 'M50 38 L50 86'] },
  },
  coat: {
    default: { fills: [COAT], details: ['M42 6 L46 34 L50 16 L54 34 L58 6', 'M50 34 L50 98'] },
    oversized: { fills: [COAT_WIDE], details: ['M41 5 L46 36 L50 16 L54 36 L59 5', 'M50 36 L50 98'] },
  },
  puffer: {
    default: { fills: [JACKET], details: ['M50 14 L50 84', 'M28 34 L72 34', 'M28 50 L72 50', 'M28 66 L72 66'] },
    oversized: { fills: [JACKET_WIDE], details: ['M50 14 L50 86', 'M25 34 L75 34', 'M25 52 L75 52', 'M25 70 L75 70'] },
  },
  sneaker: { default: { fills: ['M10 58 L14 40 Q28 40 36 48 L58 50 Q80 52 90 62 L90 72 L10 72 Z'], details: ['M10 66 L90 66', 'M30 46 L40 54', 'M36 44 L46 52'] } },
  loafer: { default: { fills: ['M10 62 Q12 46 30 46 L66 48 Q86 52 90 64 L90 70 L10 70 Z'], details: ['M44 50 L66 52', 'M10 66 L90 66'] } },
  boot: { default: { fills: ['M24 16 L50 16 L52 56 Q78 56 86 66 L86 78 L22 78 Z'], details: ['M22 72 L86 72', 'M34 24 L44 24', 'M34 34 L44 34', 'M34 44 L44 44'] } },
  sandal: { default: { fills: ['M12 64 Q50 56 88 64 L88 72 L12 72 Z', 'M30 64 L40 48 L46 48 L38 62 Z', 'M70 64 L60 48 L54 48 L62 62 Z'], details: [] } },
  cap: { default: { fills: ['M18 62 Q20 28 50 26 Q80 28 82 62 Z', 'M50 58 L94 60 Q92 70 86 70 L50 68 Z'], details: ['M50 26 L50 60', 'M50 24 L50 24.5'] } },
  beanie: { default: { fills: ['M22 64 Q22 20 50 18 Q78 20 78 64 Z', 'M18 58 L82 58 L82 76 L18 76 Z'], details: ['M30 58 L30 76', 'M42 58 L42 76', 'M58 58 L58 76', 'M70 58 L70 76'] } },
  tote: { default: { fills: ['M20 40 L80 40 L84 92 L16 92 Z'], details: ['M34 40 Q34 12 50 12 Q66 12 66 40'] } },
  crossbody: { default: { fills: ['M28 56 L72 56 Q76 56 76 62 L76 84 Q76 90 70 90 L30 90 Q24 90 24 84 L24 62 Q24 56 28 56 Z'], details: ['M30 56 L64 8', 'M24 68 L76 68'] } },
  belt: { default: { fills: ['M6 44 L94 44 L94 56 L6 56 Z'], details: ['M20 40 L32 40 L32 60 L20 60 Z', 'M26 50 L40 50'] } },
  scarf: { default: { fills: ['M28 10 L72 10 L72 30 L62 30 L64 92 L46 92 L46 30 L28 30 Z'], details: ['M46 86 L64 86', 'M48 92 L48 96', 'M54 92 L54 96', 'M60 92 L60 96'] } },
};

export function shapeIds(): string[] {
  return Object.keys(SHAPES);
}

export function hasShape(id: string): boolean {
  return id in SHAPES;
}

/** Fits a shape can draw distinctly (used to validate the catalog). `undefined` → default only. */
export function drawableFits(shapeId: string): Fit[] {
  const def = SHAPES[shapeId];
  return def ? (Object.keys(def).filter((k) => k !== 'default') as Fit[]) : [];
}

export function resolveShape(shapeId: string, fit?: Fit | null): GarmentShape {
  const def = SHAPES[shapeId];
  if (!def) return { fills: ['M20 20 L80 20 L80 80 L20 80 Z'], details: [] };
  return (fit && def[fit]) || def.default;
}
