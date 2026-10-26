import { GARMENT_COLORS, getColor, isColorId } from '@/domain/palette';
import { OUTFIT_SLOTS } from '@/domain/recommendation-policy';
import { SAMPLE_TEMPLATES, getTemplate } from '@/features/sample-wardrobe/catalog';
import { drawableFits, hasShape, resolveShape } from '@/features/sample-wardrobe/garment-shapes';
import { SAMPLE_PRESETS } from '@/features/sample-wardrobe/presets';

describe('palette', () => {
  it('has unique ids, valid hex and Korean names', () => {
    const ids = GARMENT_COLORS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of GARMENT_COLORS) {
      expect(c.hex).toMatch(/^#[0-9A-F]{6}$/i);
      expect(c.nameKo.length).toBeGreaterThan(0);
    }
  });

  it('keeps white and cream distinguishable by name (not color alone)', () => {
    expect(getColor('white')!.nameKo).not.toBe(getColor('cream')!.nameKo);
    expect(getColor('white')!.luminanceGroup).toBe(2);
  });
});

describe('sample catalog', () => {
  it('covers the required MVP garment kinds', () => {
    const subs = new Set(SAMPLE_TEMPLATES.map((t) => t.subcategory));
    for (const s of ['tshirt', 'longsleeve', 'shirt', 'knit', 'hoodie', 'jeans', 'slacks', 'shorts', 'jacket', 'coat', 'sneakers']) expect(subs).toContain(s);
  });

  it('every template references a drawable shape, valid colors, and only fits the shape can draw', () => {
    for (const t of SAMPLE_TEMPLATES) {
      expect(hasShape(t.shapeId)).toBe(true);
      expect(t.supportedColorIds).toContain(t.defaultColorId);
      for (const c of t.supportedColorIds) expect(isColorId(c)).toBe(true);
      const drawable = drawableFits(t.shapeId);
      if (t.supportedFits.length > 1) for (const f of t.supportedFits) expect(drawable.includes(f) || f === 'regular' || f === 'straight').toBe(true);
    }
  });

  it('fit variants really change the silhouette', () => {
    expect(resolveShape('pants', 'wide').fills[0]).not.toBe(resolveShape('pants', 'straight').fills[0]);
    expect(resolveShape('tee', 'oversized').fills[0]).not.toBe(resolveShape('tee', 'regular').fills[0]);
  });
});

describe('sample presets', () => {
  it('has at least 8 presets', () => {
    expect(SAMPLE_PRESETS.length).toBeGreaterThanOrEqual(8);
  });

  it.each(SAMPLE_PRESETS.map((p) => [p.id, p] as const))('%s: valid refs, supported colors, one of each required slot', (_id, p) => {
    const cats = p.items.map((i) => {
      const t = getTemplate(i.templateId);
      expect(t).toBeDefined();
      expect(t!.supportedColorIds).toContain(i.customization.colorId);
      if (i.customization.fit) expect(t!.supportedFits).toContain(i.customization.fit);
      if (i.customization.pattern) expect(t!.supportedPatterns).toContain(i.customization.pattern);
      return t!.category;
    });
    for (const slot of OUTFIT_SLOTS.filter((s) => s.required)) {
      expect(cats.filter((c) => slot.categories.includes(c)).length).toBe(1);
    }
  });
});
