import { addMonths, monthGrid, monthRange } from '@/features/wear-log/calendar';

describe('wear calendar', () => {
  it('lays out October 2026 starting on Thursday with 31 days', () => {
    const g = monthGrid(2026, 9);
    expect(g[0].slice(0, 4)).toEqual([null, null, null, null]);
    expect(g[0][4]).toBe('2026-10-01');
    expect(g.flat().filter(Boolean)).toHaveLength(31);
    for (const w of g) expect(w).toHaveLength(7);
  });

  it('handles leap February and month arithmetic across years', () => {
    expect(monthGrid(2028, 1).flat().filter(Boolean)).toHaveLength(29);
    expect(addMonths({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 });
    expect(addMonths({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 });
    expect(monthRange({ year: 2026, month: 1 })).toEqual({ from: '2026-02-01', to: '2026-02-28' });
  });
});
