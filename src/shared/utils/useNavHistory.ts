import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * In-app navigation history that stays in sync with the browser history.
 *
 *  - navigate(v)  pushes a new entry (so Back returns to the page you came from)
 *  - replace(v)   swaps the current entry (e.g. "next puzzle" doesn't pile up entries)
 *  - back(fb)     goes to the previous page; uses `fb` when there is nothing to go back to
 *  - reset(v)     forgets everything and starts over at `v` (e.g. after a mode switch)
 *
 * Browser/phone Back and Forward move through the same entries, so the in-app
 * "← Back" buttons and the system back gesture always agree.  Each browser
 * entry carries only an index in history.state (`alchNav`); the views
 * themselves live in a ref, so nothing is serialised into the URL.
 *
 * `init` may list views that sit *below* the opened one (e.g. a shared puzzle
 * link seeds [home, collection]) so Back from a deep link walks up the app
 * instead of leaving the site.
 *
 * Pass `enabled = false` while a different component owns the browser history.
 */
export function useNavHistory<V>(
  init: () => { current: V; below?: V[] },
  enabled = true,
) {
  const first = useRef<{ current: V; below: V[] } | null>(null);
  if (first.current === null) {
    const i = init();
    first.current = { current: i.current, below: i.below ?? [] };
  }

  const entries = useRef<V[]>([...first.current.below, first.current.current]);
  const index = useRef(entries.current.length - 1);
  const seeded = useRef(false);
  const [view, setView] = useState<V>(first.current.current);

  useEffect(() => {
    if (!enabled) return;

    // One-time: make the browser history mirror the seeded entries.
    if (!seeded.current) {
      seeded.current = true;
      const url = window.location.pathname + window.location.search + window.location.hash;
      const cleanUrl = window.location.pathname + window.location.search;
      try {
        if (entries.current.length > 1) {
          history.replaceState({ alchNav: 0 }, '', cleanUrl);
          for (let i = 1; i < entries.current.length; i++) {
            history.pushState({ alchNav: i }, '', i === entries.current.length - 1 ? url : cleanUrl);
          }
        } else {
          history.replaceState({ alchNav: 0 }, '', url);
        }
      } catch { /* history API unavailable — in-app stack still works */ }
    }

    function onPop(e: PopStateEvent) {
      const i = (e.state as { alchNav?: number } | null)?.alchNav;
      if (typeof i === 'number' && entries.current[i] !== undefined) {
        index.current = i;
        setView(entries.current[i]);
      }
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [enabled]);

  const navigate = useCallback((v: V) => {
    entries.current = entries.current.slice(0, index.current + 1).concat([v]);
    index.current += 1;
    try { history.pushState({ alchNav: index.current }, ''); } catch { /* ignore */ }
    setView(v);
  }, []);

  const replace = useCallback((v: V) => {
    entries.current[index.current] = v;
    try { history.replaceState({ alchNav: index.current }, ''); } catch { /* ignore */ }
    setView(v);
  }, []);

  const back = useCallback((fallback: V) => {
    if (index.current > 0) {
      try { history.back(); return; } catch { /* fall through */ }
      index.current -= 1;
      setView(entries.current[index.current]);
      return;
    }
    replace(fallback);
  }, [replace]);

  const reset = useCallback((v: V) => {
    entries.current = [v];
    index.current = 0;
    try { history.replaceState({ alchNav: 0 }, ''); } catch { /* ignore */ }
    setView(v);
  }, []);

  return { view, navigate, replace, back, reset };
}
