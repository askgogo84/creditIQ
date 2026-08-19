/**
 * validate-transfer-graph.ts — CI gate (Phase 2).
 *
 * Fails the build on a transfer-graph integrity violation. Modelled on
 * scripts/validate-card-links.ts — the durable answer to "a comment is not a
 * gate". This repo has already shipped a dead data array nobody noticed
 * (NEW_CARDS in seed-cards.ts); check #4 catches that class here.
 *
 * Fails the build on:
 *   1. duplicate edge — same (from_currency, to_programme) pair
 *      (mirrors the transfer_partners_pair unique index in 05-BACKEND-SCHEMA).
 *   2. missing/invalid state, source, or as_of on any edge.
 *   3. float / non-positive ratio — ratio_from or ratio_to not an integer ≥ 1.
 *   4. a `TransferEdge[]` array declared in transfer-graph.ts but never exported
 *      (never spread into TRANSFER_EDGES) — the exact NEW_CARDS bug class.
 *   5. an 'internal-estimate…' source carrying state 'verified' — an internal
 *      guess can never be our verified data. Enforced, not remembered.
 *
 * Run: `npm run check:transfer-graph` (wire into the CI gate next to
 * check:card-links). See docs/TRANSFER-GRAPH-INTEGRITY.md.
 */
import { readFileSync } from 'fs';
import { TRANSFER_EDGES } from '../lib/data/transfer-graph';
import type { TransferEdge } from '../lib/transfer-ladder';

const GRAPH_FILE = 'lib/data/transfer-graph.ts';
const STATES = new Set(['verified', 'unverified', 'disputed']);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Escape hatch for a deliberately-dead array (empty by design). To leave this
// list, DELETE the array or spread it into TRANSFER_EDGES. Do NOT add a
// genuinely-forgotten array here to silence the gate — that is the very mistake
// this check exists to catch.
const INTENTIONALLY_DEAD_ARRAYS = new Set<string>([]);

const failures: string[] = [];

function label(e: TransferEdge, i: number): string {
  return `edge[${i}] ${e.from_currency || '?'} → ${e.to_programme || '?'}`;
}

// 1: duplicate (from_currency, to_programme).
const pairCounts = new Map<string, number>();
TRANSFER_EDGES.forEach((e) => {
  const key = `${e.from_currency}::${e.to_programme}`;
  pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
});
for (const [key, n] of pairCounts) {
  if (n > 1) failures.push(`duplicate edge (from_currency, to_programme) '${key.replace('::', ' → ')}' ×${n}`);
}

// 2 + 3: per-edge provenance + ratio integrity.
TRANSFER_EDGES.forEach((e, i) => {
  if (!e.state || !STATES.has(e.state)) failures.push(`${label(e, i)}: state missing/invalid ('${e.state}')`);
  if (!e.source || !e.source.trim()) failures.push(`${label(e, i)}: source missing`);
  if (!e.as_of || !ISO_DATE.test(e.as_of)) failures.push(`${label(e, i)}: as_of missing/invalid ('${e.as_of}')`);

  for (const [field, v] of [['ratio_from', e.ratio_from], ['ratio_to', e.ratio_to]] as const) {
    if (!Number.isInteger(v) || v < 1) {
      failures.push(`${label(e, i)}: ${field} must be an integer ≥ 1 (got ${v}) — ratios are two ints, never a float`);
    }
  }

  // 5: an internal estimate can never be presented as CreditIQ's verified data.
  if (e.source?.startsWith('internal-estimate') && e.state === 'verified') {
    failures.push(`${label(e, i)}: source '${e.source}' is an internal estimate but state is 'verified' — an estimate is never verified`);
  }
});

// 4: any `const X: TransferEdge[]` declared but never spread into the export.
const src = readFileSync(GRAPH_FILE, 'utf8');
for (const m of src.matchAll(/const\s+([A-Za-z0-9_]+)\s*:\s*TransferEdge\[\]\s*=/g)) {
  const name = m[1];
  if (name === 'TRANSFER_EDGES') continue; // the base export itself
  if (INTENTIONALLY_DEAD_ARRAYS.has(name)) continue;
  const spread = new RegExp(`\\.\\.\\.${name}\\b`).test(src);
  if (!spread) {
    failures.push(
      `array '${name}' is declared TransferEdge[] but never spread into TRANSFER_EDGES — ` +
        `it ships to nobody. Spread it with \`...${name}\`, delete it, or (if deliberately dead) ` +
        `add it to INTENTIONALLY_DEAD_ARRAYS.`,
    );
  }
}

if (failures.length) {
  console.error(`\n✗ validate-transfer-graph: ${failures.length} integrity failure(s) in ${GRAPH_FILE}:\n`);
  failures.forEach((f) => console.error('  - ' + f));
  console.error('');
  process.exit(1);
}

console.log(`✓ validate-transfer-graph: ${TRANSFER_EDGES.length} edges OK (no dupes, provenance complete, integer ratios).`);
