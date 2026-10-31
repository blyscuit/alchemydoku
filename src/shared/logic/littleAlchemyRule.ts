import type { AlchemicalId, PotionResult } from '@shared/types';

/**
 * "Little Alchemists" mixing table — read from the printed theory-board pyramid.
 *
 * While Little Alchemy mode is on this table replaces the standard rule everywhere:
 * mixer.ts mix() and the solver's MIX_TABLE (worldPack.ts setMixRule) both read it.
 *
 * Icon ↔ aspect mapping used to read the board:
 *   🩷 R+  👻 R−  |  🍀 G+  🔥 G−  |  ⭐ B+  🪽 B−  |  🫙 neutral
 *
 * The board's bottom strip, left → right, is alchemicals 3 2 8 6 5 7 1 4.
 * Row k below lists the potion for mixing strip positions (j, j+k).
 * 24 of its 28 cells agree with the standard rule; 4 do not (see tests).
 */
export const LITTLE_BOARD_ORDER: readonly AlchemicalId[] = [3, 2, 8, 6, 5, 7, 1, 4];

type Code = 'R+' | 'R-' | 'G+' | 'G-' | 'B+' | 'B-' | 'N';

/** ROWS[k-1][j] = potion for strip positions j and j+k (k = 1 … 7). */
const ROWS: readonly (readonly Code[])[] = [
  ['G-', 'R+', 'G+', 'N', 'G-', 'B-', 'G+'],
  ['R+', 'R+', 'B+', 'B-', 'R-', 'R-'],
  ['B-', 'G-', 'N', 'G+', 'R-'],
  ['G-', 'G-', 'G+', 'G+'],
  ['B-', 'N', 'B+'],
  ['B-', 'B+'],
  ['N'],
];

function toResult(c: Code): PotionResult {
  if (c === 'N') return { type: 'neutral' };
  return { type: 'potion', color: c[0] as 'R' | 'G' | 'B', sign: c[1] as '+' | '-' };
}

const pairKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

const TABLE = new Map<string, PotionResult>();
ROWS.forEach((row, ki) => {
  const k = ki + 1;
  row.forEach((code, j) => TABLE.set(pairKey(LITTLE_BOARD_ORDER[j], LITTLE_BOARD_ORDER[j + k]), toResult(code)));
});

/** Potion produced by mixing two alchemicals under the Little Alchemists table. */
export function littleMix(a: AlchemicalId, b: AlchemicalId): PotionResult {
  const r = TABLE.get(pairKey(a, b));
  if (!r) throw new Error(`No Little Alchemists result for alchemicals ${a} and ${b}`);
  return r;
}
