/**
 * validate-transfer-graph.ts — CI gate (Phase 2).
 *
 * Fails the build on:
 *   1. duplicate edge — same (from_currency, to_programme) pair
 *   2. missing/invalid state, source, or as_of
 *   3. float / non-positive ratio
 *   4. a TransferEdge[] array declared but never exported
 *   5. an internal estimate marked verified
 *   6. regression of issuer-verified Axis Atlas 2026 transfer ratios
 */
import { readFileSync } from 'fs';
import { TRANSFER_EDGES } from '../lib/data/transfer-graph';
import type { TransferEdge } from '../lib/transfer-ladder';

const GRAPH_FILE = 'lib/data/transfer-graph.ts';
const STATES = new Set(['verified', 'unverified', 'disputed']);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const INTENTIONALLY_DEAD_ARRAYS = new Set<string>([]);
const failures: string[] = [];

function label(e: TransferEdge, i: number): string {
  return `edge[${i}] ${e.from_currency || '?'} → ${e.to_programme || '?'}`;
}

const pairCounts = new Map<string, number>();
TRANSFER_EDGES.forEach((e) => {
  const key = `${e.from_currency}::${e.to_programme}`;
  pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
});
for (const [key, n] of pairCounts) {
  if (n > 1) failures.push(`duplicate edge (from_currency, to_programme) '${key.replace('::', ' → ')}' ×${n}`);
}

TRANSFER_EDGES.forEach((e, i) => {
  if (!e.state || !STATES.has(e.state)) failures.push(`${label(e, i)}: state missing/invalid ('${e.state}')`);
  if (!e.source || !e.source.trim()) failures.push(`${label(e, i)}: source missing`);
  if (!e.as_of || !ISO_DATE.test(e.as_of)) failures.push(`${label(e, i)}: as_of missing/invalid ('${e.as_of}')`);

  for (const [field, v] of [['ratio_from', e.ratio_from], ['ratio_to', e.ratio_to]] as const) {
    if (!Number.isInteger(v) || v < 1) {
      failures.push(`${label(e, i)}: ${field} must be an integer ≥ 1 (got ${v}) — ratios are two ints, never a float`);
    }
  }

  if (e.source?.startsWith('internal-estimate') && e.state === 'verified') {
    failures.push(`${label(e, i)}: source '${e.source}' is an internal estimate but state is 'verified'`);
  }
});

const src = readFileSync(GRAPH_FILE, 'utf8');
for (const m of src.matchAll(/const\s+([A-Za-z0-9_]+)\s*:\s*TransferEdge\[\]\s*=/g)) {
  const name = m[1];
  if (name === 'TRANSFER_EDGES') continue;
  if (INTENTIONALLY_DEAD_ARRAYS.has(name)) continue;
  const spread = new RegExp(`\\.\\.\\.${name}\\b`).test(src);
  if (!spread) {
    failures.push(
      `array '${name}' is declared TransferEdge[] but never spread into TRANSFER_EDGES — ` +
      `spread it with \`...${name}\`, delete it, or mark deliberately dead.`,
    );
  }
}

// Axis Atlas current issuer-published grid, effective 2 Apr 2026. Atlas has its
// own graph node because other Axis EDGE-Miles cards have different ratios.
const atlasExpected: Record<string, [number, number]> = {
  aeroplan: [1, 2],
  ba: [2, 1],
  ethiopian: [1, 2],
  etihad: [1, 2],
  finnair: [2, 1],
  qatar: [2, 1],
  singapore: [1, 2],
  turkish: [1, 2],
  united: [1, 2],
  flyingblue: [1, 2],
  'air-india': [1, 2],
  qantas: [1, 2],
};

for (const [programme, ratio] of Object.entries(atlasExpected)) {
  const edge = TRANSFER_EDGES.find((e) =>
    e.from_currency === 'axis_atlas_miles' &&
    e.to_programme === programme &&
    e.card_name_allowlist?.some((name) => name.toLowerCase() === 'axis atlas'),
  );
  if (!edge) {
    failures.push(`Axis Atlas verified edge missing: axis_atlas_miles → ${programme}`);
    continue;
  }
  if (edge.ratio_from !== ratio[0] || edge.ratio_to !== ratio[1]) {
    failures.push(`Axis Atlas ${programme} ratio regression: expected ${ratio[0]}:${ratio[1]}, got ${edge.ratio_from}:${edge.ratio_to}`);
  }
  if (edge.state !== 'verified') failures.push(`Axis Atlas ${programme} must remain issuer-verified`);
  if (edge.min_transfer !== 500) failures.push(`Axis Atlas ${programme} minimum transfer must remain 500 EDGE Miles`);
}

if (failures.length) {
  console.error(`\n✗ validate-transfer-graph: ${failures.length} integrity failure(s) in ${GRAPH_FILE}:\n`);
  failures.forEach((f) => console.error('  - ' + f));
  console.error('');
  process.exit(1);
}

console.log(`✓ validate-transfer-graph: ${TRANSFER_EDGES.length} edges OK (including ${Object.keys(atlasExpected).length} verified Axis Atlas routes).`);
