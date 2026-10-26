import { computeCpw, localDay, wearCountFor, wearIdempotencyKey } from '@/domain/wear';
import { ownedIdsOf } from '@/features/wear-log/wear-repository';

jest.mock('@/infrastructure/database/database', () => ({}));

describe('CPW', () => {
  it('needs a positive price and at least one wear', () => {
    expect(computeCpw(null, 3)).toEqual({ kind: 'noPrice', wearCount: 3 });
    expect(computeCpw(0, 3)).toEqual({ kind: 'noPrice', wearCount: 3 });
    expect(computeCpw(-100, 3).kind).toBe('noPrice');
    expect(computeCpw(45000, 0)).toEqual({ kind: 'noWears', priceMinor: 45000 });
  });

  it('divides integer KRW and rounds', () => {
    expect(computeCpw(45000, 5)).toEqual({ kind: 'value', cpwMinor: 9000, priceMinor: 45000, wearCount: 5 });
    expect(computeCpw(10000, 3)).toMatchObject({ cpwMinor: 3333 });
  });
});

describe('wear idempotency', () => {
  it('same day + same outfit → same key', () => {
    expect(wearIdempotencyKey('2026-10-26', 'of_1', ['a'])).toBe(wearIdempotencyKey('2026-10-26', 'of_1', ['b']));
  });

  it('item-set key is order-insensitive and de-duplicated', () => {
    expect(wearIdempotencyKey('2026-10-26', null, ['b', 'a', 'a'])).toBe(wearIdempotencyKey('2026-10-26', null, ['a', 'b']));
  });

  it('counts distinct events only', () => {
    const k = wearIdempotencyKey('2026-10-26', 'of_1', ['g1']);
    const events = [
      { garmentItemIds: ['g1'], idempotencyKey: k },
      { garmentItemIds: ['g1'], idempotencyKey: k },
      { garmentItemIds: ['g1', 'g2'], idempotencyKey: '2026-10-27:of_2' },
    ];
    expect(wearCountFor('g1', events)).toBe(2);
    expect(wearCountFor('g2', events)).toBe(1);
  });

  it('samples never count as worn', () => {
    expect(ownedIdsOf([{ kind: 'sampleTemplate', templateId: 'tee-short', customization: { colorId: 'white' } }, { kind: 'ownedGarment', garmentItemId: 'g1' }, { kind: 'ownedGarment', garmentItemId: 'g1' }])).toEqual(['g1']);
  });

  it('localDay uses the local calendar day', () => {
    expect(localDay(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});
