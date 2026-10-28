import type { ISODate } from '@/domain/models';
import { localDay } from '@/domain/wear';

/** Weeks (Sun→Sat) of a month; days outside the month are null. `month` is 0-based like Date. */
export function monthGrid(year: number, month: number): (ISODate | null)[][] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (ISODate | null)[] = Array.from({ length: first.getDay() }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(localDay(new Date(year, month, d)));
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
}

/** Shift a {year, month} pair by n months. */
export function addMonths(ym: { year: number; month: number }, n: number): { year: number; month: number } {
  const d = new Date(ym.year, ym.month + n, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function monthRange(ym: { year: number; month: number }): { from: ISODate; to: ISODate } {
  return { from: localDay(new Date(ym.year, ym.month, 1)), to: localDay(new Date(ym.year, ym.month + 1, 0)) };
}
