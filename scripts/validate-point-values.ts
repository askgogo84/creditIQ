/**
 * validate-point-values.ts — CI gate.
 *
 * Fails the build on a point-value integrity violation. Modelled on
 * scripts/validate-transfer-graph.ts — "a comment is not a gate."
 *
 * Fails the build on:
 *   1. duplicate card key.
 *   2. missing/invalid state, source, or as_of on ANY channel (a channel with no
 *      source is rejected).
 *   3. a float where integer paise belong — value_paise must be an integer >= 1 on a
 *      value-bearing channel; and MUST be null on a 'none'/'unknown' channel.
 *   4. state/source mismatch — an 'internal-estimate…' source presented as
 *      'issuer-published' (an estimate is never the issuer's own), and vice-versa.
 *   5. issuer-ceiling breach — a card whose DERIVED ceiling (max over its channels)
 *      exceeds the issuer's own published maximum we hold for it. We never claim a
 *      point is worth more than the issuer says it is.
 *   6. card-level currency integrity — points_currency null <=> currency_state
 *      'none' AND no channels; a card with a currency must not be 'none'.
 *   7. an 'issuer-published' claim (channel OR card currency) whose source is not a
 *      real DEEP LINK — a bare domain / portal root is not a citation.
 *   8. a `CardPointValue[]` array declared but never spread into CARD_POINT_VALUES
 *      (the dead-array bug class — mirrors the transfer-graph check).
 *
 * Run: `npm run check:point-values`.
 */
import { readFileSync } from 'fs';
import {
  CARD_POINT_VALUES,
  VALUE_BEARING_STATES,
  issuerCeilingPaise,
  pointValueCeilingPaise,
  type CardPointValue,
  type RedemptionChannel,
} from '../lib/data/point-values';

const FILE = 'lib/data/point-values.ts';
const STATES = new Set(['issuer-published', 'internal-estimate', 'disputed', 'none', 'unknown']);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const INTERNAL_PREFIX = 'internal-estimate';

const INTENTIONALLY_DEAD_ARRAYS = new Set<string>([]);

const failures: string[] = [];

function chLabel(c: CardPointValue, ch: RedemptionChannel): string {
  return `card '${c.card}' channel '${ch.kind}'`;
}

// A real deep link = a valid http(s) URL with a path segment beyond '/'. A bare
// domain ('https://issuer.in' / 'https://issuer.in/') is a portal root, not a
// citation. Internal-estimate pointers ('internal-estimate:…') are not URLs and are
// only ever checked here for issuer-published claims (which must NOT use them).
function isDeepLink(src: string): boolean {
  let u: URL;
  try {
    u = new URL(src);
  } catch {
    return false;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  return u.pathname.replace(/\/+$/, '').length > 0;
}

// 1: duplicate card key.
const keyCounts = new Map<string, number>();
CARD_POINT_VALUES.forEach((c) => keyCounts.set(c.card, (keyCounts.get(c.card) ?? 0) + 1));
for (const [key, n] of keyCounts) {
  if (n > 1) failures.push(`duplicate card key '${key}' x${n}`);
}

CARD_POINT_VALUES.forEach((c) => {
  // 6: card-level currency integrity.
  if (!STATES.has(c.currency_state)) failures.push(`card '${c.card}': currency_state missing/invalid ('${c.currency_state}')`);
  if (!c.currency_source || !c.currency_source.trim()) failures.push(`card '${c.card}': currency_source missing`);
  if (!c.currency_as_of || !ISO_DATE.test(c.currency_as_of)) failures.push(`card '${c.card}': currency_as_of missing/invalid ('${c.currency_as_of}')`);
  if (c.points_currency === null) {
    if (c.currency_state !== 'none') failures.push(`card '${c.card}': points_currency is null but currency_state is '${c.currency_state}' (must be 'none' — an explicit no-currency fact, not unknown)`);
    if (c.channels.length) failures.push(`card '${c.card}': points_currency is null but carries ${c.channels.length} channel(s) — a cashback card has no per-point channels`);
  } else if (c.currency_state === 'none') {
    failures.push(`card '${c.card}': has points_currency '${c.points_currency}' but currency_state 'none' — a card with a currency is not currency-'none'`);
  }
  // 7 (card currency): an issuer-published currency claim must cite a deep link.
  if (c.currency_state === 'issuer-published' && !isDeepLink(c.currency_source)) {
    failures.push(`card '${c.card}': currency_state 'issuer-published' but currency_source '${c.currency_source}' is not a deep link (a bare domain / portal root is not a citation)`);
  }

  // 2 + 3 + 4: per-channel integrity.
  const seenKinds = new Set<string>();
  c.channels.forEach((ch) => {
    if (seenKinds.has(ch.kind)) failures.push(`${chLabel(c, ch)}: duplicate channel kind`);
    seenKinds.add(ch.kind);

    if (!ch.state || !STATES.has(ch.state)) failures.push(`${chLabel(c, ch)}: state missing/invalid ('${ch.state}')`);
    if (!ch.source || !ch.source.trim()) failures.push(`${chLabel(c, ch)}: source missing`);
    if (!ch.as_of || !ISO_DATE.test(ch.as_of)) failures.push(`${chLabel(c, ch)}: as_of missing/invalid ('${ch.as_of}')`);

    const valueBearing = VALUE_BEARING_STATES.has(ch.state);
    if (valueBearing) {
      if (!Number.isInteger(ch.value_paise) || (ch.value_paise as number) < 1) {
        failures.push(`${chLabel(c, ch)}: value_paise must be an integer >= 1 paise (got ${ch.value_paise}) — money is integer paise, never a float rupee`);
      }
    } else if (ch.value_paise !== null) {
      failures.push(`${chLabel(c, ch)}: state '${ch.state}' must carry value_paise null (got ${ch.value_paise}) — 'none'/'unknown' hold no value`);
    }

    // 4: state must not contradict the source's own provenance.
    if (ch.source?.startsWith(INTERNAL_PREFIX) && ch.state === 'issuer-published') {
      failures.push(`${chLabel(c, ch)}: source '${ch.source}' is an internal estimate but state is 'issuer-published' — an estimate is never the issuer's own`);
    }
    if (ch.state === 'internal-estimate' && !ch.source?.startsWith(INTERNAL_PREFIX)) {
      failures.push(`${chLabel(c, ch)}: state 'internal-estimate' but source '${ch.source}' is not an 'internal-estimate:…' pointer`);
    }

    // 7 (channel): an issuer-published value must cite a real deep link.
    if (ch.state === 'issuer-published' && !isDeepLink(ch.source)) {
      failures.push(`${chLabel(c, ch)}: state 'issuer-published' but source '${ch.source}' is not a deep link (a bare domain / portal root is not a citation)`);
    }
  });

  // 5: derived ceiling must not exceed the issuer's own published maximum.
  const issuerMax = issuerCeilingPaise(c);
  const ceiling = pointValueCeilingPaise(c);
  if (issuerMax != null && ceiling != null && ceiling > issuerMax) {
    failures.push(`card '${c.card}': derived ceiling ${ceiling} paise exceeds the issuer-published maximum ${issuerMax} paise — we never value a point above what the issuer itself publishes`);
  }
});

// 8: any `const X: CardPointValue[]` declared but never spread into the export.
const src = readFileSync(FILE, 'utf8');
for (const m of src.matchAll(/const\s+([A-Za-z0-9_]+)\s*:\s*CardPointValue\[\]\s*=/g)) {
  const name = m[1];
  if (name === 'CARD_POINT_VALUES') continue;
  if (INTENTIONALLY_DEAD_ARRAYS.has(name)) continue;
  if (!new RegExp(`\\.\\.\\.${name}\\b`).test(src)) {
    failures.push(
      `array '${name}' is declared CardPointValue[] but never spread into CARD_POINT_VALUES — ` +
        `it ships to nobody. Spread it with \`...${name}\`, delete it, or add it to INTENTIONALLY_DEAD_ARRAYS.`,
    );
  }
}

if (failures.length) {
  console.error(`\n✗ validate-point-values: ${failures.length} integrity failure(s) in ${FILE}:\n`);
  failures.forEach((f) => console.error('  - ' + f));
  console.error('');
  process.exit(1);
}

console.log(
  `✓ validate-point-values: ${CARD_POINT_VALUES.length} cards OK (no dupe keys, provenance complete, integer paise, no issuer-ceiling breach, issuer-published sources are deep links).`,
);
