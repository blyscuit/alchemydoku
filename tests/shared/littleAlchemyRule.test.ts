import { describe, it, expect } from 'vitest';
import { mix } from '@shared/logic/mixer';
import { LITTLE_BOARD_ORDER, littleMix } from '@shared/logic/littleAlchemyRule';
import { ALCHEMICALS } from '@shared/data/alchemicals';
import type { AlchemicalId } from '@shared/types';

const IDS: AlchemicalId[] = [1, 2, 3, 4, 5, 6, 7, 8];
const pairs: [AlchemicalId, AlchemicalId][] = [];
for (const a of IDS) for (const b of IDS) if (a < b) pairs.push([a, b]);

describe('Little Alchemists mixing table', () => {
  it('board order is a permutation of the 8 alchemicals', () => {
    expect([...LITTLE_BOARD_ORDER].sort()).toEqual(IDS);
  });

  it('covers all 28 pairs and is symmetric', () => {
    expect(pairs).toHaveLength(28);
    for (const [a, b] of pairs) expect(littleMix(a, b)).toEqual(littleMix(b, a));
  });

  it.each(pairs)('pair %i + %i: neutral only for opposites, otherwise a shared aspect', (a, b) => {
    const r = littleMix(a, b);
    const opposite = (['R', 'G', 'B'] as const).every(c => ALCHEMICALS[a][c].sign !== ALCHEMICALS[b][c].sign);
    if (opposite) { expect(r.type).toBe('neutral'); return; }
    expect(r.type).toBe('potion');
    if (r.type === 'potion') {
      expect(ALCHEMICALS[a][r.color].sign).toBe(r.sign);
      expect(ALCHEMICALS[b][r.color].sign).toBe(r.sign);
    }
  });

  it('agrees with the standard rule on 24 of 28 pairs (the board picture differs on 4)', () => {
    const differing = pairs.filter(([a, b]) => JSON.stringify(littleMix(a, b)) !== JSON.stringify(mix(a, b)));
    expect(differing).toHaveLength(4);
  });
});
