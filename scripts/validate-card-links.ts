/**
 * validate-card-links.ts — CI gate (Phase 0).
 *
 * Fails the build if any HARDCODED card slug can't resolve to a card-detail page.
 * Detail pages are generated only from SEED_CARDS (both /card/<slug> and
 * /cards/<slug> key off id, and id === slug), so a hardcoded slug that isn't a
 * SEED_CARDS id/slug renders a 404 (this is the class that produced the
 * /cards/axis-reserve bug in card-ladder).
 *
 * SCOPE: catches STATIC/hardcoded slugs only —
 *   1. `slug: '...'` inside inline card-list pages (CARD_LIST_FILES), and
 *   2. string-literal `/card/<slug>` and `/cards/<slug>` hrefs anywhere in app/+components.
 * It canNOT catch DB- or AI-generated slugs (trip-planner, RewardsHeroWidget,
 * blog related_card_slug) — those don't exist until runtime and are handled by
 * the cardPageExists() runtime guards instead.
 *
 * Run: `npm run check:card-links` (wire into the CI gate).
 */
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { SEED_CARDS } from '../lib/data/seed-cards';

const valid = new Set<string>(SEED_CARDS.flatMap((c) => [c.id, c.slug]));

// Inline card-list pages whose `slug: '...'` fields must all be real cards.
const CARD_LIST_FILES = ['app/card-ladder/page.tsx'];

const SCAN_DIRS = ['app', 'components'];
const offenders: string[] = [];

function scanDir(dir: string): string[] {
  let out: string[] = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === 'node_modules' || name.name === '.next') continue;
      out = out.concat(scanDir(p));
    } else if (/\.(tsx|ts)$/.test(name.name)) {
      out.push(p);
    }
  }
  return out;
}

// 1) Hardcoded card-list data: every `slug: '...'` must be a real card.
for (const f of CARD_LIST_FILES) {
  const txt = readFileSync(f, 'utf8');
  for (const m of txt.matchAll(/slug:\s*'([a-z0-9-]+)'/g)) {
    if (!valid.has(m[1])) offenders.push(`${f}: card-list slug '${m[1]}' is not in SEED_CARDS`);
  }
}

// 2) String-literal /card(s)/<slug> hrefs (template literals with ${} are skipped
//    by the char class — those are dynamic and covered by runtime guards).
const files = SCAN_DIRS.flatMap((d) => scanDir(d));
for (const f of files) {
  const txt = readFileSync(f, 'utf8');
  for (const m of txt.matchAll(/["'`]\/cards?\/([a-z0-9-]+)["'`]/g)) {
    if (!valid.has(m[1])) offenders.push(`${f}: literal link /card(s)/${m[1]} → no such card in SEED_CARDS`);
  }
}

if (offenders.length) {
  console.error(`\n✗ validate-card-links: ${offenders.length} broken hardcoded card link(s):\n`);
  offenders.forEach((o) => console.error('  - ' + o));
  console.error('\nFix the slug to a real SEED_CARDS id, remove the entry, or add the card to SEED_CARDS.\n');
  process.exit(1);
}
console.log(`✓ validate-card-links: all hardcoded card links resolve (${valid.size} valid ids/slugs).`);
