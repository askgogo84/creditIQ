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

// ---------------------------------------------------------------------------
// SEED_CARDS structural integrity (added commit (b), 2026-08-02).
// The durable fix for the NEW_CARDS landmine: 82 entries an author believed were
// live but that were never pushed into SEED_CARDS, so a "richer" rewrite silently
// rotted in dead code and a live card carried a wrong value for months. A comment
// saying "DEAD CODE" is not a gate — this is. See docs/SEED-CARDS-INTEGRITY.md.
//
// Fails the build on:
//   1. duplicate id in the assembled runtime SEED_CARDS
//   2. id !== slug for any runtime card
//   3. any `const X: CreditCard[]` declared in seed-cards.ts that is never
//      `SEED_CARDS.push(...X)` (the exact NEW_CARDS bug class)
// Messages name the array and the offending ids so the next person doesn't have
// to reconstruct it.
// ---------------------------------------------------------------------------
const SEED_FILE = 'lib/data/seed-cards.ts';

// Intentionally-dead card arrays, grandfathered pending a per-card triage
// (docs/SEED-CARDS-INTEGRITY.md §6). To leave this list, DELETE the array or wire
// it with `SEED_CARDS.push(...)`. Do NOT add a genuinely-forgotten array here to
// silence the gate — that is the very mistake this check exists to catch.
const INTENTIONALLY_DEAD_ARRAYS = new Set<string>(['NEW_CARDS']);

function idsOfArray(src: string, name: string): string[] {
  const decl = new RegExp(`const\\s+${name}\\s*:\\s*CreditCard\\[\\]\\s*=\\s*\\[`).exec(src);
  if (!decl) return [];
  let depth = 0;
  let end = decl.index;
  for (let i = src.indexOf('[', decl.index); i < src.length; i++) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']' && --depth === 0) { end = i; break; }
  }
  return [...src.slice(decl.index, end + 1).matchAll(/\bid:\s*'([^']+)'/g)].map((m) => m[1]);
}

const integrity: string[] = [];

// 1 + 2: duplicate ids and id !== slug on the assembled runtime array.
const idCounts = new Map<string, number>();
for (const c of SEED_CARDS) {
  idCounts.set(c.id, (idCounts.get(c.id) ?? 0) + 1);
  if (c.id !== c.slug) integrity.push(`id !== slug: id='${c.id}' slug='${c.slug}'`);
}
const dupes = [...idCounts].filter(([, n]) => n > 1).map(([id, n]) => `'${id}' (×${n})`);
if (dupes.length) integrity.push(`duplicate id(s) in runtime SEED_CARDS: ${dupes.join(', ')}`);

// 3: card arrays declared but never pushed (anchored match ignores the commented
// `SEED_CARDS.push(...NEW_CARDS)` example inside seed-cards.ts).
const seedSrc = readFileSync(SEED_FILE, 'utf8');
for (const m of seedSrc.matchAll(/const\s+([A-Za-z0-9_]+)\s*:\s*CreditCard\[\]\s*=/g)) {
  const name = m[1];
  if (name === 'SEED_CARDS') continue; // the base export itself
  const pushed = new RegExp(`^\\s*SEED_CARDS\\.push\\(\\s*\\.\\.\\.${name}\\b`, 'm').test(seedSrc);
  if (pushed || INTENTIONALLY_DEAD_ARRAYS.has(name)) continue;
  const ids = idsOfArray(seedSrc, name);
  const sample = ids.slice(0, 5).join(', ') + (ids.length > 5 ? `, …+${ids.length - 5} more` : '');
  integrity.push(
    `array '${name}' (${ids.length} cards) is declared CreditCard[] but never pushed to SEED_CARDS — ` +
    `it ships to nobody. Wire it with \`SEED_CARDS.push(...${name})\`, delete it, or (if deliberately dead) ` +
    `add it to INTENTIONALLY_DEAD_ARRAYS. ids: ${sample}`,
  );
}

if (integrity.length) {
  console.error(`\n✗ validate-card-links: ${integrity.length} SEED_CARDS integrity failure(s) in ${SEED_FILE}:\n`);
  integrity.forEach((o) => console.error('  - ' + o));
  console.error('');
  process.exit(1);
}

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
