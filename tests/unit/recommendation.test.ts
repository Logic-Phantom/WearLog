import type { TasteProfile } from '@/domain/models';
import { recommend, type RecItem, type RecommendInput } from '@/features/recommendations/engine';
import { candidatePool, refsSignature, sampleToRecItem } from '@/features/recommendations/rec-items';
import { getTemplate } from '@/features/sample-wardrobe/catalog';
import type { WeatherSignal } from '@/features/weather/weather-signal';

const taste: TasteProfile = {
  selectedStyleCardIds: [],
  preferredStyles: ['minimal'],
  preferredFits: [],
  preferredColorIds: [],
  avoidedColorIds: [],
  occasionPreferences: [],
  personalizationEnabled: true,
  onboardingState: 'completed',
  updatedAt: null,
  schemaVersion: 1,
};

const noWeather: WeatherSignal = { band: null, rainLikely: false, windy: false, indoor: false, summary: null, source: 'none' };

function owned(id: string, category: RecItem['category'], extra: Partial<RecItem> = {}): RecItem {
  return { key: `owned:${id}`, ref: { kind: 'ownedGarment', garmentItemId: id }, name: id, category, colorIds: ['black'], styleTags: [], seasonTags: [], occasionTags: [], outerWeight: null, waterResistant: null, daysSinceWorn: null, ...extra };
}

const base = (items: RecItem[], over: Partial<RecommendInput> = {}): RecommendInput => ({ items, taste, occasion: null, weather: noWeather, weatherEnabled: true, excludedKeys: [], pinnedKeys: [], recentOutfitSignatures: [], ...over });

const wardrobe = [
  owned('tee', 'top', { styleTags: ['minimal'] }),
  owned('hoodie', 'top', { styleTags: ['street'] }),
  owned('jeans', 'bottom', { colorIds: ['denimBlue'] }),
  owned('sneakers', 'shoes', { colorIds: ['white'] }),
  owned('parka', 'outer', { outerWeight: 'heavy', seasonTags: ['winter'] }),
  owned('shirtjk', 'outer', { outerWeight: 'light', seasonTags: ['spring'] }),
];

describe('recommendation engine', () => {
  it('reports missing required categories instead of faking an outfit', () => {
    expect(recommend(base([owned('tee', 'top')]))).toEqual({ kind: 'notEnoughItems', missing: ['bottom', 'shoes'] });
  });

  it('builds outfits with exactly one top, bottom and shoes', () => {
    const r = recommend(base(wardrobe));
    if (r.kind !== 'ok') throw new Error('expected ok');
    for (const rec of r.results) {
      for (const cat of ['top', 'bottom', 'shoes'] as const) expect(rec.items.filter((i) => i.category === cat)).toHaveLength(1);
      expect(rec.items.filter((i) => i.category === 'outer').length).toBeLessThanOrEqual(1);
    }
  });

  it('ranks the taste-matching top first and says why', () => {
    const r = recommend(base(wardrobe));
    if (r.kind !== 'ok') throw new Error();
    expect(r.results[0].items.find((i) => i.category === 'top')!.key).toBe('owned:tee');
    expect(r.results[0].reasons.some((x) => x.code === 'taste')).toBe(true);
  });

  it('cold weather requires an outer and prefers the heavy one, quoting real values', () => {
    const weather: WeatherSignal = { band: 'freezing', rainLikely: false, windy: false, indoor: false, summary: '현재 2°C', source: 'snapshot' };
    const r = recommend(base(wardrobe, { weather }));
    if (r.kind !== 'ok') throw new Error();
    for (const rec of r.results) expect(rec.items.some((i) => i.category === 'outer')).toBe(true);
    expect(r.results[0].items.find((i) => i.category === 'outer')!.key).toBe('owned:parka');
    expect(r.results[0].reasons[0].text).toBe('현재 2°C');
  });

  it('hot weather drops outers; disabling weather removes weather reasons', () => {
    const hot: WeatherSignal = { band: 'hot', rainLikely: false, windy: false, indoor: false, summary: '현재 31°C', source: 'snapshot' };
    const r = recommend(base(wardrobe, { weather: hot }));
    if (r.kind !== 'ok') throw new Error();
    for (const rec of r.results) expect(rec.items.some((i) => i.category === 'outer')).toBe(false);
    const off = recommend(base(wardrobe, { weather: hot, weatherEnabled: false }));
    if (off.kind !== 'ok') throw new Error();
    expect(off.results.flatMap((x) => x.reasons).some((x) => x.code.startsWith('weather'))).toBe(false);
  });

  it('rain advice never claims waterproofing unless recorded', () => {
    const rain: WeatherSignal = { band: 'mild', rainLikely: true, windy: false, indoor: false, summary: '오후 강수확률 70%', source: 'snapshot' };
    const r = recommend(base(wardrobe, { weather: rain }));
    if (r.kind !== 'ok') throw new Error();
    const txt = r.results[0].reasons.find((x) => x.code === 'rain')!.text;
    expect(txt).toContain('우산');
    expect(txt).not.toContain('방수');
  });

  it('respects exclude and pin', () => {
    const r = recommend(base(wardrobe, { excludedKeys: ['owned:tee'], pinnedKeys: ['owned:jeans'] }));
    if (r.kind !== 'ok') throw new Error();
    for (const rec of r.results) {
      expect(rec.items.some((i) => i.key === 'owned:tee')).toBe(false);
      expect(rec.items.some((i) => i.key === 'owned:jeans')).toBe(true);
    }
  });

  it('penalizes items worn in the last 7 days', () => {
    const items = [owned('a', 'top', { daysSinceWorn: 1 }), owned('b', 'top', { daysSinceWorn: 40 }), owned('j', 'bottom'), owned('s', 'shoes')];
    const r = recommend(base(items, { taste: { ...taste, preferredStyles: [] } }));
    if (r.kind !== 'ok') throw new Error();
    expect(r.results[0].items.find((i) => i.category === 'top')!.key).toBe('owned:b');
    expect(r.results[0].reasons.some((x) => x.code === 'underused')).toBe(true);
  });
});

describe('candidate pool', () => {
  it('"내 옷만" never includes samples; "샘플 포함" keeps sample provenance', () => {
    const mine = [owned('tee', 'top')];
    expect(candidatePool('ownedOnly', mine)).toEqual(mine);
    const all = candidatePool('withSamples', mine);
    expect(all.some((i) => i.ref.kind === 'sampleTemplate')).toBe(true);
    expect(sampleToRecItem(getTemplate('jeans')!).ref.kind).toBe('sampleTemplate');
  });
});

describe('weather season fit', () => {
  const chilly: WeatherSignal = { band: 'chilly', rainLikely: false, windy: false, indoor: false, summary: '쌀쌀함', source: 'manual' };

  it('chilly weather does not pick a spring/summer-only tee when a warmer top exists', () => {
    const items = [
      owned('tee', 'top', { seasonTags: ['spring', 'summer'], styleTags: ['minimal'] }),
      owned('knit', 'top', { seasonTags: ['fall', 'winter'] }),
      owned('jeans', 'bottom'),
      owned('sneakers', 'shoes'),
    ];
    const r = recommend(base(items, { weather: chilly }));
    if (r.kind !== 'ok') throw new Error();
    expect(r.results[0].items.find((i) => i.category === 'top')!.key).toBe('owned:knit');
  });

  it('sample pool in chilly weather leads with a non-summer top', () => {
    const r = recommend(base(candidatePool('withSamples', []), { weather: chilly }));
    if (r.kind !== 'ok') throw new Error();
    const top = r.results[0].items.find((i) => i.category === 'top')!;
    expect(top.seasonTags.every((t) => t === 'spring' || t === 'summer')).toBe(false);
  });

  it('a recently saved/worn outfit signature is demoted', () => {
    const items = [owned('a', 'top'), owned('b', 'top'), owned('j', 'bottom'), owned('s', 'shoes')];
    const plain = recommend(base(items, { taste: { ...taste, preferredStyles: [] } }));
    if (plain.kind !== 'ok') throw new Error();
    const first = plain.results[0].signature;
    const r = recommend(base(items, { taste: { ...taste, preferredStyles: [] }, recentOutfitSignatures: [first] }));
    if (r.kind !== 'ok') throw new Error();
    expect(r.results[0].signature).not.toBe(first);
  });

  it('refsSignature matches the engine signature format', () => {
    expect(refsSignature([{ kind: 'sampleTemplate', templateId: 'jeans', customization: { colorId: 'denimBlue' } }, { kind: 'ownedGarment', garmentItemId: 'x' }])).toBe('owned:x|sample:jeans');
  });
});

describe('weather detail rules (일교차 · 바람 · 비 색상)', () => {
  const base3 = [owned('tee', 'top', { seasonTags: ['spring', 'fall'] }), owned('jeans', 'bottom'), owned('sneakers', 'shoes', { colorIds: ['black'] })];
  const mild = (extra: Partial<WeatherSignal>): WeatherSignal => ({ band: 'mild', rainLikely: false, windy: false, indoor: false, summary: '현재 20°C', source: 'snapshot', ...extra });

  it('a big daily range makes an outer required on a mild day and quotes the real low/high', () => {
    const items = [...base3, owned('jacket', 'outer', { outerWeight: 'light' })];
    const plain = recommend(base(items, { weather: mild({}) }));
    if (plain.kind !== 'ok') throw new Error();
    expect(plain.results.some((r) => !r.items.some((i) => i.category === 'outer'))).toBe(true);

    const r = recommend(base(items, { weather: mild({ layering: { minC: 9, maxC: 21 } }) }));
    if (r.kind !== 'ok') throw new Error();
    for (const rec of r.results) expect(rec.items.some((i) => i.category === 'outer')).toBe(true);
    expect(r.results[0].reasons.find((x) => x.code === 'weatherOuter')!.text).toContain('최저 9° / 최고 21°');
  });

  it('accepts the colder end’s outer weight when the swing is large', () => {
    const items = [...base3, owned('light', 'outer', { outerWeight: 'light' }), owned('medium', 'outer', { outerWeight: 'medium' })];
    // mild alone accepts only light; with a 5°C low (cold band) medium is acceptable too, so it isn't penalized.
    const r = recommend(base(items, { weather: mild({ layering: { minC: 5, maxC: 20 } }) }));
    if (r.kind !== 'ok') throw new Error();
    const outers = new Set(r.results.map((x) => x.items.find((i) => i.category === 'outer')?.key));
    expect(outers.has('owned:medium')).toBe(true);
  });

  it('strong wind raises the outer requirement and says why; missing outer becomes a gap', () => {
    const withOuter = recommend(base([...base3, owned('jk', 'outer', { outerWeight: 'light' })], { weather: mild({ windy: true, windSpeedMps: 9 }) }));
    if (withOuter.kind !== 'ok') throw new Error();
    expect(withOuter.results[0].reasons.find((x) => x.code === 'weatherOuter')!.text).toContain('초속 9m');
    const noOuter = recommend(base(base3, { weather: mild({ windy: true, windSpeedMps: 9 }) }));
    if (noOuter.kind !== 'ok') throw new Error();
    expect(noOuter.results[0].gaps[0]).toContain('바람');
  });

  it('rain prefers dark bottoms/shoes over light ones and explains it', () => {
    const items = [owned('top', 'top'), owned('cream-pants', 'bottom', { colorIds: ['cream'] }), owned('black-pants', 'bottom', { colorIds: ['black'] }), owned('shoes', 'shoes', { colorIds: ['black'] })];
    const r = recommend(base(items, { taste: { ...taste, preferredStyles: [] }, weather: mild({ rainLikely: true }) }));
    if (r.kind !== 'ok') throw new Error();
    expect(r.results[0].items.find((i) => i.category === 'bottom')!.key).toBe('owned:black-pants');
    expect(r.results[0].reasons.some((x) => x.code === 'rainColor')).toBe(true);
  });
});

describe('item notes (visual breakdown)', () => {
  const mild = (extra: Partial<WeatherSignal>): WeatherSignal => ({ band: 'mild', rainLikely: false, windy: false, indoor: false, summary: '현재 20°C', source: 'snapshot', ...extra });

  it('tags the outer, rain-safe bottoms and underused pieces with the rule that picked them', () => {
    const items = [
      owned('knit', 'top', { seasonTags: ['fall'], daysSinceWorn: 45 }),
      owned('cream', 'bottom', { colorIds: ['cream'] }),
      owned('black', 'bottom', { colorIds: ['black'] }),
      owned('shoes', 'shoes', { colorIds: ['black'] }),
      owned('jacket', 'outer', { outerWeight: 'light' }),
    ];
    const r = recommend(base(items, { taste: { ...taste, preferredStyles: [] }, weather: mild({ layering: { minC: 8, maxC: 20 }, rainLikely: true }) }));
    if (r.kind !== 'ok') throw new Error();
    const n = r.results[0].itemNotes;
    expect(n['owned:jacket']).toBe('일교차 대비 겉옷');
    expect(n['owned:black']).toBe('비 와도 티 덜 나는 색');
    expect(n['owned:knit']).toBe('30일 넘게 안 입은 옷');
  });

  it('says nothing about weather when weather is off', () => {
    const items = [owned('t', 'top'), owned('b', 'bottom'), owned('s', 'shoes'), owned('o', 'outer', { outerWeight: 'light' })];
    const r = recommend(base(items, { taste: { ...taste, preferredStyles: [] }, weather: mild({ layering: { minC: 8, maxC: 20 } }), weatherEnabled: false }));
    if (r.kind !== 'ok') throw new Error();
    for (const rec of r.results) expect(Object.values(rec.itemNotes).some((t) => t.includes('겉옷'))).toBe(false);
  });
});
