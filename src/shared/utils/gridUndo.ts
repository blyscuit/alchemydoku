/**
 * Debounced undo history for the Ingredient Grid.
 *
 * Cycling a cell through its states or sweeping several cells in a row would
 * otherwise create one undo step per tap.  With this wrapper every grid edit
 * made within GRID_UNDO_DEBOUNCE_MS of the previous one joins the same undo
 * step (the window restarts after each edit, i.e. a real debounce), so one
 * ↩ undoes the whole burst.  Any other action that touches the undo/redo
 * stacks (notes, drawing, reset, undo, redo, …) ends the burst.
 */

export const GRID_UNDO_DEBOUNCE_MS = 1000;

type WithHistory = {
  lastGridEditAt?: number;
  undoStack: unknown[];
  redoStack: unknown[];
};

/** Wraps a reducer so edits of the given action types are merged into one undo step. */
export function withGridUndoDebounce<S extends WithHistory, A extends { type: string; t?: number }>(
  base: (state: S, action: A) => S,
  gridTypes: readonly string[],
): (state: S, action: A) => S {
  return (state, action) => {
    let next = base(state, action);
    if (next === state) return next;

    if (gridTypes.includes(action.type)) {
      const t = action.t;
      const last = state.lastGridEditAt ?? 0;
      const merge = t !== undefined && last > 0 && t - last < GRID_UNDO_DEBOUNCE_MS && state.undoStack.length > 0;
      // Drop the snapshot the base reducer just pushed: the burst keeps its original one.
      if (merge) next = { ...next, undoStack: state.undoStack };
      return { ...next, lastGridEditAt: t ?? 0 };
    }

    if (next.undoStack !== state.undoStack || next.redoStack !== state.redoStack) {
      return { ...next, lastGridEditAt: 0 };
    }
    return next;
  };
}

/** Wraps dispatch so grid edits carry a timestamp (keeps the reducers themselves pure). */
export function stampGridEdits<A extends { type: string }>(
  dispatch: (action: A) => void,
  gridTypes: readonly string[],
): (action: A) => void {
  return action => dispatch(gridTypes.includes(action.type) ? ({ ...action, t: Date.now() } as A) : action);
}
