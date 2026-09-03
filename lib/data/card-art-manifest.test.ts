import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CARD_ART_SLUGS, cardArtSrc, hasCardArt } from './card-art-manifest';
import { SEED_CARDS } from './seed-cards';

describe('card art manifest', () => {
  it('only exposes self-hosted WebP files for live catalog cards', () => {
    const files = readdirSync(join(process.cwd(), 'public', 'card-art'))
      .filter((file) => file.endsWith('.webp'))
      .map((file) => file.replace(/\.webp$/, ''))
      .sort();
    const liveSlugs = new Set(SEED_CARDS.map((card) => card.slug));

    expect([...CARD_ART_SLUGS].sort()).toEqual(files);
    expect(files.every((slug) => liveSlugs.has(slug))).toBe(true);
  });

  it('returns local paths and leaves unknown cards on the fallback', () => {
    expect(hasCardArt('hdfc-infinia')).toBe(true);
    expect(cardArtSrc('hdfc-infinia')).toBe('/card-art/hdfc-infinia.webp');
    expect(hasCardArt('not-a-real-card')).toBe(false);
  });
});
