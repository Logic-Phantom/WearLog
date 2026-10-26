import { HISTORY_LIMIT, autoLayout, canvasReducer, createCanvas, deserializeLayout, serializeLayout } from '@/features/outfit-builder/canvas-state';
import type { ItemRef } from '@/domain/models';

const tee: ItemRef = { kind: 'sampleTemplate', templateId: 'tee-short', customization: { colorId: 'white' } };
const mine: ItemRef = { kind: 'ownedGarment', garmentItemId: 'g1' };

describe('canvas reducer', () => {
  it('adds, moves, scales around center and clamps size', () => {
    let s = canvasReducer(createCanvas('o1'), { type: 'add', itemRef: tee, at: { x: 0.2, y: 0.2 }, size: 0.4 });
    const id = s.selectedId!;
    s = canvasReducer(s, { type: 'move', id, dx: 0.1, dy: 0 });
    expect(s.layout.elements[0].x).toBeCloseTo(0.3);
    s = canvasReducer(s, { type: 'scale', id, factor: 0.5 });
    const e = s.layout.elements[0];
    expect(e.width).toBeCloseTo(0.2);
    expect(e.x + e.width / 2).toBeCloseTo(0.5);
    for (let i = 0; i < 40; i++) s = canvasReducer(s, { type: 'scale', id, factor: 0.5 });
    expect(s.layout.elements[0].width).toBeGreaterThanOrEqual(0.08);
  });

  it('undo/redo restores exact states and new edits clear redo', () => {
    let s = canvasReducer(createCanvas('o1'), { type: 'add', itemRef: tee });
    const id = s.selectedId!;
    s = canvasReducer(s, { type: 'rotate', id, degrees: 15 });
    s = canvasReducer(s, { type: 'undo' });
    expect(s.layout.elements[0].rotation).toBe(0);
    s = canvasReducer(s, { type: 'redo' });
    expect(s.layout.elements[0].rotation).toBe(15);
    s = canvasReducer(s, { type: 'undo' });
    s = canvasReducer(s, { type: 'flip', id });
    expect(s.future).toHaveLength(0);
  });

  it('caps history', () => {
    let s = canvasReducer(createCanvas('o1'), { type: 'add', itemRef: tee });
    for (let i = 0; i < HISTORY_LIMIT + 20; i++) s = canvasReducer(s, { type: 'rotate', id: s.selectedId!, degrees: 1 });
    expect(s.past.length).toBe(HISTORY_LIMIT);
  });

  it('reorders layers and keeps z-indexes dense', () => {
    let s = canvasReducer(createCanvas('o1'), { type: 'add', itemRef: tee });
    const a = s.selectedId!;
    s = canvasReducer(s, { type: 'add', itemRef: mine });
    s = canvasReducer(s, { type: 'bringForward', id: a });
    const z = Object.fromEntries(s.layout.elements.map((e) => [e.id, e.zIndex]));
    expect(z[a]).toBe(1);
    expect(s.layout.elements.map((e) => e.zIndex).sort()).toEqual([0, 1]);
  });

  it('customizes sample color without touching owned items', () => {
    let s = canvasReducer(createCanvas('o1'), { type: 'add', itemRef: tee });
    s = canvasReducer(s, { type: 'customize', id: s.selectedId!, customization: { colorId: 'navy' } });
    expect((s.layout.elements[0].itemRef as Extract<ItemRef, { kind: 'sampleTemplate' }>).customization.colorId).toBe('navy');
    s = canvasReducer(s, { type: 'add', itemRef: mine });
    const before = s.layout.elements[1];
    s = canvasReducer(s, { type: 'customize', id: before.id, customization: { colorId: 'red' } });
    expect(s.layout.elements[1].itemRef).toEqual(mine);
  });

  it('round-trips JSON with provenance and rejects malformed layouts', () => {
    const s = autoLayout('o1', [
      { itemRef: tee, category: 'top' },
      { itemRef: mine, category: 'bottom' },
    ]);
    expect(s.past).toHaveLength(0);
    const back = deserializeLayout(serializeLayout(s.layout))!;
    expect(back.elements.map((e) => e.itemRef)).toEqual([tee, mine]);
    expect(deserializeLayout('{"canvasVersion":2,"elements":[]}')).toBeNull();
    expect(deserializeLayout('not json')).toBeNull();
  });

  it('load replaces content with a clean history', () => {
    let s = canvasReducer(createCanvas('o1'), { type: 'add', itemRef: tee });
    s = canvasReducer(s, { type: 'load', elements: [] });
    expect(s.layout.elements).toHaveLength(0);
    expect(s.past).toHaveLength(0);
  });
});
