/**
 * Outfit canvas state with undo/redo (prompt §3.6). Pure reducer — rendering (SVG views today,
 * Skia later if POC justifies it) only reads this. Coordinates are normalized 0..1.
 */
import type { CanvasElement, CanvasLayout, ItemRef, SampleCustomization } from '@/domain/models';
import { newId } from '@/utils/id';

export const HISTORY_LIMIT = 50;
const MIN_SIZE = 0.08;
const MAX_SIZE = 1.2;

export interface CanvasState {
  layout: CanvasLayout;
  selectedId: string | null;
  past: CanvasElement[][];
  future: CanvasElement[][];
}

export type CanvasAction =
  | { type: 'load'; elements: CanvasElement[] }
  | { type: 'add'; itemRef: ItemRef; at?: { x: number; y: number }; size?: number }
  | { type: 'select'; id: string | null }
  | { type: 'move'; id: string; dx: number; dy: number }
  | { type: 'scale'; id: string; factor: number }
  | { type: 'rotate'; id: string; degrees: number }
  | { type: 'flip'; id: string }
  | { type: 'bringForward'; id: string }
  | { type: 'sendBackward'; id: string }
  | { type: 'duplicate'; id: string }
  | { type: 'remove'; id: string }
  | { type: 'customize'; id: string; customization: Partial<SampleCustomization> }
  | { type: 'undo' }
  | { type: 'redo' };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function createCanvas(outfitId: string, elements: CanvasElement[] = [], aspect = 3 / 4): CanvasState {
  return {
    layout: { id: newId('cv_'), outfitId, aspect, background: 'neutral', elements, canvasVersion: 1, updatedAt: new Date().toISOString() },
    selectedId: null,
    past: [],
    future: [],
  };
}

function normalizeZ(elements: CanvasElement[]): CanvasElement[] {
  return [...elements].sort((a, b) => a.zIndex - b.zIndex).map((e, i) => ({ ...e, zIndex: i }));
}

function commit(state: CanvasState, elements: CanvasElement[], selectedId = state.selectedId): CanvasState {
  return {
    layout: { ...state.layout, elements: normalizeZ(elements), updatedAt: new Date().toISOString() },
    selectedId,
    past: [...state.past, state.layout.elements].slice(-HISTORY_LIMIT),
    future: [],
  };
}

function update(state: CanvasState, id: string, fn: (e: CanvasElement) => CanvasElement): CanvasState {
  if (!state.layout.elements.some((e) => e.id === id)) return state;
  return commit(state, state.layout.elements.map((e) => (e.id === id ? fn(e) : e)));
}

export function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  const els = state.layout.elements;
  switch (action.type) {
    case 'load':
      // Replaces content with a clean history (opening a saved outfit / preset is not an edit).
      return { layout: { ...state.layout, elements: normalizeZ(action.elements) }, selectedId: null, past: [], future: [] };
    case 'add': {
      const size = action.size ?? 0.36;
      const el: CanvasElement = {
        id: newId('el_'),
        itemRef: action.itemRef,
        x: clamp(action.at?.x ?? 0.5 - size / 2, 0, 1 - size),
        y: clamp(action.at?.y ?? 0.5 - size / 2, 0, 1 - size),
        width: size,
        height: size,
        rotation: 0,
        zIndex: els.length,
        opacity: 1,
        flipX: false,
      };
      return commit(state, [...els, el], el.id);
    }
    case 'select':
      return { ...state, selectedId: action.id };
    case 'move':
      return update(state, action.id, (e) => ({ ...e, x: clamp(e.x + action.dx, -e.width / 2, 1 - e.width / 2), y: clamp(e.y + action.dy, -e.height / 2, 1 - e.height / 2) }));
    case 'scale':
      return update(state, action.id, (e) => {
        const w = clamp(e.width * action.factor, MIN_SIZE, MAX_SIZE);
        const h = clamp(e.height * action.factor, MIN_SIZE, MAX_SIZE);
        // Scale around the center so the item doesn't jump.
        return { ...e, x: e.x + (e.width - w) / 2, y: e.y + (e.height - h) / 2, width: w, height: h };
      });
    case 'rotate':
      return update(state, action.id, (e) => ({ ...e, rotation: (((e.rotation + action.degrees) % 360) + 360) % 360 }));
    case 'flip':
      return update(state, action.id, (e) => ({ ...e, flipX: !e.flipX }));
    case 'bringForward':
    case 'sendBackward': {
      const sorted = normalizeZ(els);
      const i = sorted.findIndex((e) => e.id === action.id);
      const j = action.type === 'bringForward' ? i + 1 : i - 1;
      if (i < 0 || j < 0 || j >= sorted.length) return state;
      const swapped = sorted.map((e, k) => (k === i ? { ...e, zIndex: sorted[j].zIndex } : k === j ? { ...e, zIndex: sorted[i].zIndex } : e));
      return commit(state, swapped);
    }
    case 'duplicate': {
      const src = els.find((e) => e.id === action.id);
      if (!src) return state;
      const copy = { ...src, id: newId('el_'), x: clamp(src.x + 0.04, 0, 1), y: clamp(src.y + 0.04, 0, 1), zIndex: els.length };
      return commit(state, [...els, copy], copy.id);
    }
    case 'remove':
      if (!els.some((e) => e.id === action.id)) return state;
      return commit(
        state,
        els.filter((e) => e.id !== action.id),
        state.selectedId === action.id ? null : state.selectedId,
      );
    case 'customize':
      return update(state, action.id, (e) =>
        e.itemRef.kind === 'sampleTemplate' ? { ...e, itemRef: { ...e.itemRef, customization: { ...e.itemRef.customization, ...action.customization } } } : e,
      );
    case 'undo': {
      const prev = state.past[state.past.length - 1];
      if (!prev) return state;
      return { layout: { ...state.layout, elements: prev }, selectedId: prev.some((e) => e.id === state.selectedId) ? state.selectedId : null, past: state.past.slice(0, -1), future: [els, ...state.future] };
    }
    case 'redo': {
      const next = state.future[0];
      if (!next) return state;
      return { layout: { ...state.layout, elements: next }, selectedId: next.some((e) => e.id === state.selectedId) ? state.selectedId : null, past: [...state.past, els], future: state.future.slice(1) };
    }
  }
}

/** JSON persisted in SQLite (no image bytes). */
export function serializeLayout(layout: CanvasLayout): string {
  return JSON.stringify(layout);
}

export function deserializeLayout(json: string): CanvasLayout | null {
  try {
    const v = JSON.parse(json) as CanvasLayout;
    if (v?.canvasVersion !== 1 || !Array.isArray(v.elements)) return null;
    const ok = v.elements.every((e) => typeof e.x === 'number' && typeof e.y === 'number' && (e.itemRef?.kind === 'ownedGarment' || e.itemRef?.kind === 'sampleTemplate'));
    return ok ? v : null;
  } catch {
    return null;
  }
}

/** Starting layout for a sample preset or a recommendation: stacks items top→bottom by category. */
const ROW: Record<string, { x: number; y: number; size: number }> = {
  hat: { x: 0.66, y: 0.02, size: 0.24 },
  outer: { x: 0.02, y: 0.06, size: 0.5 },
  top: { x: 0.36, y: 0.08, size: 0.42 },
  onepiece: { x: 0.3, y: 0.1, size: 0.55 },
  bottom: { x: 0.3, y: 0.44, size: 0.44 },
  shoes: { x: 0.56, y: 0.78, size: 0.26 },
  bag: { x: 0.72, y: 0.42, size: 0.26 },
  accessory: { x: 0.06, y: 0.7, size: 0.22 },
  other: { x: 0.06, y: 0.7, size: 0.22 },
};

export function autoLayout(outfitId: string, refs: { itemRef: ItemRef; category: string }[]): CanvasState {
  let state = createCanvas(outfitId);
  for (const r of refs) {
    const slot = ROW[r.category] ?? ROW.other;
    state = canvasReducer(state, { type: 'add', itemRef: r.itemRef, at: { x: slot.x, y: slot.y }, size: slot.size });
  }
  // A fresh layout starts with a clean history.
  return { ...state, selectedId: null, past: [], future: [] };
}
