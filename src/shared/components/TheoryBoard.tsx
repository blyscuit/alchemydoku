import { useEffect, useRef, useState } from 'react';
import { mix } from '@shared/logic/mixer';
import { LITTLE_BOARD_ORDER, littleMix } from '@shared/logic/littleAlchemyRule';
import { useLittleAlchemy } from '@shared/utils/useLittleAlchemy';
import { AlchemicalImage, IngredientIcon, PotionImage } from '@shared/components/GameSprites';
import type { GridState, DisplayMap } from '@shared/utils/solverStorage';
import type { AlchemicalId, CellState } from '@shared/types';

const STORAGE_KEY = 'alchemydoku:theory-board-open';
// Same left-to-right order the Ingredient Grid uses (by display-ingredient id).
const DISPLAY_ORDER = [3, 1, 7, 2, 4, 5, 6, 8];
const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8];

type Props = {
  gridState: GridState;
  displayMap: DisplayMap;
  onSetCell: (slot: number, alch: AlchemicalId, state: CellState) => void;
};

function iconIndex(displayMap: DisplayMap, slot: number) {
  return ((displayMap[slot] ?? slot) - 1) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

/**
 * Pyramid of potions: bottom strip = the 8 alchemicals, next row = the ingredient
 * confirmed (✔) for each alchemical in the Ingredient Grid, rows above = the potion made
 * by mixing the two alchemicals underneath (all 28 pairs).
 *
 * Standard mode uses the game rule (mixer.ts); Little Alchemy mode uses the table read
 * from the board picture (littleAlchemyRule.ts).
 */
export function TheoryBoard({ gridState, displayMap, onSetCell }: Props) {
  const little = useLittleAlchemy();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  const [picking, setPicking] = useState<AlchemicalId | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth || 320);
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const order = LITTLE_BOARD_ORDER;
  const rule = little ? littleMix : mix;
  const pitch = width / 8;

  /** Ingredient slot currently ✔-confirmed for an alchemical (null if none). */
  const confirmedSlot = (alch: AlchemicalId): number | null =>
    SLOTS.find(s => gridState[s]?.[alch] === 'confirmed') ?? null;

  function assign(alch: AlchemicalId, slot: number | null) {
    // an alchemical has one ingredient and an ingredient has one alchemical
    for (const s of SLOTS) {
      if (s !== slot && gridState[s]?.[alch] === 'confirmed') onSetCell(s, alch, 'unknown');
    }
    if (slot !== null) {
      for (const a of order) {
        if (a !== alch && gridState[slot]?.[a] === 'confirmed') onSetCell(slot, a, 'unknown');
      }
      if (gridState[slot]?.[alch] !== 'confirmed') onSetCell(slot, alch, 'confirmed');
    }
    setPicking(null);
  }

  const slotToDisplayOrder = [...SLOTS].sort(
    (a, b) => DISPLAY_ORDER.indexOf(displayMap[a] ?? a) - DISPLAY_ORDER.indexOf(displayMap[b] ?? b),
  );

  return (
    <div className="select-none">
      <div
        ref={wrapRef}
        className="w-full max-w-xl mx-auto rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(180deg,#fbe9dc 0%,#f4d3bd 100%)', paddingTop: 6 }}
      >
        {/* potion rows: apex (1 cell) … 7 cells */}
        {[7, 6, 5, 4, 3, 2, 1].map(k => (
          <div key={k} className="flex justify-center" style={{ height: pitch * 0.9 }}>
            {Array.from({ length: 8 - k }, (_, j) => {
              const a = order[j], b = order[j + k];
              return (
                <div key={j} className="flex items-center justify-center" style={{ width: pitch }}>
                  <PotionImage result={rule(a, b)} width={pitch * 0.82} title={`${a} + ${b}`} />
                </div>
              );
            })}
          </div>
        ))}

        {/* ingredient row */}
        <div className="flex" style={{ marginTop: 4 }}>
          {order.map(a => {
            const slot = confirmedSlot(a);
            return (
              <div key={a} className="flex items-center justify-center" style={{ width: pitch, height: pitch }}>
                <button
                  onClick={() => setPicking(picking === a ? null : a)}
                  aria-label={slot ? `Ingredient for alchemical ${a} (change)` : `Pick ingredient for alchemical ${a}`}
                  className={`flex items-center justify-center rounded-xl border-2 transition-colors
                    ${picking === a ? 'border-indigo-400 bg-indigo-50' : 'border-[#e3b9a0] bg-[#fff6ef] hover:border-indigo-300'}`}
                  style={{ width: pitch * 0.88, height: pitch * 0.88 }}
                >
                  {slot !== null
                    ? <IngredientIcon index={iconIndex(displayMap, slot)} width={pitch * 0.78} />
                    : <span className="text-[#d3a98f]" style={{ fontSize: pitch * 0.4 }}>+</span>}
                </button>
              </div>
            );
          })}
        </div>

        {/* alchemical strip: R+ alchemicals on pink, R− on teal */}
        <div
          className="flex"
          style={{
            marginTop: 2, padding: '4px 0',
            background: 'linear-gradient(90deg,#c9669f 0%,#9c3f86 50%,#2fa7a5 50%,#1f8c93 100%)',
          }}
        >
          {order.map(a => (
            <div key={a} className="flex items-center justify-center" style={{ width: pitch }}>
              <AlchemicalImage id={a} width={pitch * 0.92} title={`Alchemical ${a}`} />
            </div>
          ))}
        </div>
      </div>

      {picking !== null && (
        <div className="max-w-xl mx-auto mt-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm animate-fadein">
          <div className="flex items-center gap-2 mb-1.5 text-xs text-gray-500">
            <AlchemicalImage id={picking} width={22} />
            <span className="flex-1">Which ingredient is this alchemical? (sets ✔ in the grid)</span>
            <button onClick={() => assign(picking, null)} className="px-2 py-0.5 rounded border border-gray-200 hover:border-red-300 hover:text-red-500">Clear</button>
            <button onClick={() => setPicking(null)} className="px-2 py-0.5 rounded border border-gray-200 hover:border-gray-400">Close</button>
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {slotToDisplayOrder.map(s => (
              <button
                key={s}
                onClick={() => assign(picking, s)}
                className={`rounded-lg border p-0.5 transition-colors ${confirmedSlot(picking) === s ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-indigo-300'}`}
                aria-label={`Ingredient ${displayMap[s] ?? s}`}
              >
                <IngredientIcon index={iconIndex(displayMap, s)} width={40} />
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-[10px] text-gray-400 mt-1.5">
        {little ? 'Little Alchemists table (from the board picture)' : 'Standard mixing rules'} · ✔ in the grid fills the ingredient row
      </p>
    </div>
  );
}

/** Collapsible "Theory Board" section shown below the Ingredient Grid. */
export function TheoryBoardSection(props: Props) {
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
  });
  function toggle() {
    setOpen(v => {
      try { localStorage.setItem(STORAGE_KEY, v ? '0' : '1'); } catch { /* ignore */ }
      return !v;
    });
  }
  return (
    <div className="border-t">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between py-2.5 text-xs font-semibold
                   uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors
                   focus-visible:outline-none"
        aria-expanded={open}
      >
        <span>Theory Board</span>
        <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && <div className="pb-3 animate-fadein"><TheoryBoard {...props} /></div>}
    </div>
  );
}
