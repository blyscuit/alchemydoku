import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  POTION_SPRITES, ELEM_SPRITES, SIGN_SPRITES, ALCHEMICAL_SPRITES,
} from '@shared/data/sprites';
import { themedSprite } from '@shared/components/AtlasSprite';
import { DEFAULT_SETTINGS } from '@shared/utils/settings';

const LITTLE_DIR = join(process.cwd(), 'public', 'images', 'little');

describe('Little Alchemy artwork', () => {
  it('is off by default', () => {
    expect(DEFAULT_SETTINGS.littleAlchemy).toBe(false);
  });

  it('leaves sprite paths untouched when disabled', () => {
    expect(themedSprite('/images/alch_1.svg', false)).toBe('/images/alch_1.svg');
  });

  const themed = [
    ...Object.values(ALCHEMICAL_SPRITES),
    ...Object.values(ELEM_SPRITES),
    ...Object.values(SIGN_SPRITES),
    ...Object.entries(POTION_SPRITES)
      .filter(([k]) => !['correct', 'sign_ok', 'sign_wrong'].includes(k))
      .map(([, v]) => v),
  ];

  it.each(themed)('%s has a Little Alchemy replacement', (sprite) => {
    const swapped = themedSprite(sprite, true);
    expect(swapped).toContain('/images/little/');
    expect(existsSync(join(LITTLE_DIR, swapped.split('/').pop()!))).toBe(true);
  });

  it('does not theme result badges', () => {
    for (const k of ['correct', 'sign_ok', 'sign_wrong'] as const) {
      expect(themedSprite(POTION_SPRITES[k], true)).toBe(POTION_SPRITES[k]);
    }
  });
});
