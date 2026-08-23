/**
 * validate-airports.ts — OFFLINE prebuild gate for the airport dataset.
 *
 * Validates the COMMITTED lib/data/airports.generated.ts against
 * lib/data/airport-aliases.json. No network — the build must never depend on a
 * live third-party fetch (that is what the manual `npm run gen:airports` is for).
 *
 * Fails the build on:
 *   1. duplicate IATA code
 *   2. an alias pointing to an IATA that isn't in the dataset
 *   3. any airport with an empty city (the generator must fall back to the name)
 *   4. malformed record (bad IATA / non-finite lat|lon)
 *   5. an airport's `aliases` field out of sync with airport-aliases.json
 *   6. airport count outside a sane band (catches a truncated/broken regen)
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { AIRPORTS_RAW } from '../lib/data/airports.generated';

const ALIASES: Record<string, string> = JSON.parse(
  readFileSync(join(__dirname, '..', 'lib/data/airport-aliases.json'), 'utf8'),
);

const errors: string[] = [];
const codes = new Set(AIRPORTS_RAW.map((a) => a.iata));

// 1 + 3 + 4: per-record integrity.
const seen = new Set<string>();
for (const a of AIRPORTS_RAW) {
  if (!/^[A-Z]{3}$/.test(a.iata)) errors.push(`bad IATA: '${a.iata}'`);
  if (seen.has(a.iata)) errors.push(`duplicate IATA: '${a.iata}'`);
  seen.add(a.iata);
  if (!a.city || !a.city.trim()) errors.push(`empty city for ${a.iata} (name fallback missing)`);
  if (!Number.isFinite(a.lat) || !Number.isFinite(a.lon)) errors.push(`bad coords for ${a.iata}`);
}

// 2: every alias target must exist.
const expected = new Map<string, Set<string>>(); // iata -> aliases
for (const [alias, iata] of Object.entries(ALIASES)) {
  if (alias.startsWith('_')) continue; // _comment
  if (!codes.has(iata)) errors.push(`alias '${alias}' -> '${iata}' but no such airport in dataset`);
  if (!expected.has(iata)) expected.set(iata, new Set());
  expected.get(iata)!.add(alias);
}

// 5: generated `aliases` field must match the alias file exactly.
for (const a of AIRPORTS_RAW) {
  const want = expected.get(a.iata);
  const have = new Set(a.aliases ?? []);
  if (want) {
    for (const al of want) if (!have.has(al)) errors.push(`${a.iata} missing alias '${al}' (in JSON, not in generated file — re-run gen:airports)`);
    for (const al of have) if (!want.has(al)) errors.push(`${a.iata} has stale alias '${al}' (not in JSON — re-run gen:airports)`);
  } else if (have.size) {
    errors.push(`${a.iata} has aliases ${[...have].join(',')} but none in JSON — re-run gen:airports`);
  }
}

// 6: sane count band (the OurAirports scheduled + large/medium filter is ~3,242).
if (AIRPORTS_RAW.length < 2500 || AIRPORTS_RAW.length > 4500) {
  errors.push(`airport count ${AIRPORTS_RAW.length} outside expected band 2500–4500 (broken regeneration?)`);
}

if (errors.length) {
  console.error(`\n✗ validate-airports: ${errors.length} problem(s) in lib/data/airports.generated.ts:\n`);
  errors.slice(0, 40).forEach((e) => console.error('  - ' + e));
  if (errors.length > 40) console.error(`  … and ${errors.length - 40} more`);
  console.error('\nFix airport-aliases.json and re-run `npm run gen:airports`, or fix the generator.\n');
  process.exit(1);
}
console.log(`✓ validate-airports: ${AIRPORTS_RAW.length} airports OK (${Object.keys(ALIASES).length - 1} aliases resolve, no duplicates).`);
