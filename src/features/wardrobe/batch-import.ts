import type { PickedPhoto } from './garment-import';

/** Max photos per batch — each still goes through the editor, so keep the queue short. */
export const BATCH_LIMIT = 20;

/**
 * "여러 장 한 번에 등록" queue (e.g. photos saved from Instagram or a shopping app). Every photo
 * still opens the normal editor so the user confirms name/category/color — nothing is
 * auto-classified or saved without a tap.
 */
export interface BatchState {
  photos: PickedPhoto[];
  index: number;
  saved: number;
  skipped: number;
}

export function startBatch(photos: PickedPhoto[]): BatchState | null {
  const list = photos.slice(0, BATCH_LIMIT);
  return list.length ? { photos: list, index: 0, saved: 0, skipped: 0 } : null;
}

/** Advance after the current photo was saved or skipped; null when the queue is finished. */
export function advanceBatch(s: BatchState, outcome: 'saved' | 'skipped'): BatchState | null {
  const next = { ...s, index: s.index + 1, saved: s.saved + (outcome === 'saved' ? 1 : 0), skipped: s.skipped + (outcome === 'skipped' ? 1 : 0) };
  return next.index < next.photos.length ? next : null;
}

export function batchLabel(s: BatchState): string {
  return `${s.index + 1}/${s.photos.length}`;
}

export function batchSummary(saved: number, skipped: number): string {
  return skipped ? `${saved}벌 등록, ${skipped}장 건너뛰었어요.` : `${saved}벌을 등록했어요.`;
}
