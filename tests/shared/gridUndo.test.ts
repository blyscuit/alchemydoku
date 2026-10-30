import { describe, it, expect } from 'vitest';
import { withGridUndoDebounce, GRID_UNDO_DEBOUNCE_MS } from '@shared/utils/gridUndo';

type S = { n: number; undoStack: number[]; redoStack: number[]; lastGridEditAt?: number };
type A = { type: 'EDIT'; t?: number } | { type: 'NOTE' } | { type: 'UNDO' };

function base(s: S, a: A): S {
  switch (a.type) {
    case 'EDIT': return { ...s, n: s.n + 1, undoStack: [s.n, ...s.undoStack], redoStack: [] };
    case 'NOTE': return { ...s, undoStack: [s.n, ...s.undoStack], redoStack: [] };
    case 'UNDO': {
      if (!s.undoStack.length) return s;
      const [prev, ...rest] = s.undoStack;
      return { ...s, n: prev, undoStack: rest, redoStack: [s.n, ...s.redoStack] };
    }
  }
}
const reducer = withGridUndoDebounce(base, ['EDIT']);
const fresh: S = { n: 0, undoStack: [], redoStack: [] };

describe('grid undo debounce', () => {
  it('uses a 1 second window', () => {
    expect(GRID_UNDO_DEBOUNCE_MS).toBe(1000);
  });

  it('merges edits made within 1 s into a single undo step', () => {
    let s = reducer(fresh, { type: 'EDIT', t: 10_000 });
    s = reducer(s, { type: 'EDIT', t: 10_400 });
    s = reducer(s, { type: 'EDIT', t: 10_900 });
    expect(s.n).toBe(3);
    expect(s.undoStack).toEqual([0]);          // one step, back to the state before the burst
    expect(reducer(s, { type: 'UNDO' }).n).toBe(0);
  });

  it('starts a new step after 1 s of quiet', () => {
    let s = reducer(fresh, { type: 'EDIT', t: 10_000 });
    s = reducer(s, { type: 'EDIT', t: 11_000 });
    expect(s.undoStack).toEqual([1, 0]);
  });

  it('restarts the window after every edit (true debounce)', () => {
    let s = reducer(fresh, { type: 'EDIT', t: 0 + 1 });
    for (const t of [900, 1800, 2700]) s = reducer(s, { type: 'EDIT', t });
    expect(s.undoStack).toEqual([0]);
  });

  it('ends the burst when another undoable action happens', () => {
    let s = reducer(fresh, { type: 'EDIT', t: 10_000 });
    s = reducer(s, { type: 'NOTE' });
    s = reducer(s, { type: 'EDIT', t: 10_100 });
    expect(s.undoStack.length).toBe(3);
  });

  it('ends the burst after an undo', () => {
    let s = reducer(fresh, { type: 'EDIT', t: 10_000 });
    s = reducer(s, { type: 'UNDO' });
    s = reducer(s, { type: 'EDIT', t: 10_100 });
    expect(s.undoStack).toEqual([0]);
    expect(s.n).toBe(1);
  });

  it('never merges edits that carry no timestamp', () => {
    let s = reducer(fresh, { type: 'EDIT' });
    s = reducer(s, { type: 'EDIT' });
    expect(s.undoStack.length).toBe(2);
  });
});
