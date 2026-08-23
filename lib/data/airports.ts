// Airport data ACCESS layer — the single source of truth for the app. All airport
// data comes from lib/data/airports.generated.ts (produced by scripts/gen-airports.ts
// from OurAirports + airport-aliases.json). Nothing else in the app should hold its
// own airport/city list. Consumers: AirportSelect (combobox) and Board (deep-link
// resolve). This module owns the types, labels, ranked search and city resolution.
import { AIRPORTS_RAW, type RawAirport } from './airports.generated';

export type Airport = RawAirport;
export const AIRPORTS: Airport[] = AIRPORTS_RAW;

// Normalise for matching: lowercase + strip diacritics (so "Bengaluru"/"Malé"
// match "bengaluru"/"male"), collapse whitespace.
function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

interface Indexed {
  a: Airport;
  code: string;   // upper IATA
  lcode: string;  // lower IATA
  ncity: string;
  nname: string;
  naliases: string[];
}

const INDEX: Indexed[] = AIRPORTS.map((a) => ({
  a,
  code: a.iata,
  lcode: a.iata.toLowerCase(),
  ncity: norm(a.city),
  nname: norm(a.name),
  naliases: (a.aliases ?? []).map(norm),
}));

const BY_CODE = new Map<string, Airport>();
for (const a of AIRPORTS) BY_CODE.set(a.iata, a);

export function getAirport(code: string): Airport | undefined {
  return BY_CODE.get((code || '').toUpperCase());
}

export function labelFor(code: string): string {
  const a = BY_CODE.get((code || '').toUpperCase());
  return a ? `${a.city} (${a.iata})` : code;
}

// Primary hubs. Two jobs: (1) the list shown when the field is focused with an
// empty query (an alphabetical dump of 3,242 rows would be useless), and (2) a
// within-tier tiebreak so a city with several airports resolves to its MAIN one
// (e.g. "Dubai" -> DXB not DWC, "London" -> LHR not LCY). India metros first.
const POPULAR = [
  'DEL', 'BOM', 'BLR', 'MAA', 'HYD', 'CCU', 'COK', 'GOI', 'PNQ', 'AMD', 'JAI', 'LKO', 'IXC',
  'DXB', 'AUH', 'DOH', 'SIN', 'BKK', 'KUL', 'HKG', 'CMB', 'KTM', 'DPS',
  'HND', 'NRT', 'ICN', 'SYD', 'MEL',
  'LHR', 'CDG', 'AMS', 'FRA', 'FCO', 'IST', 'MAD',
  'JFK', 'LAX', 'SFO', 'YYZ', 'NBO',
];
const POP_RANK = new Map<string, number>(POPULAR.map((c, i) => [c, i]));
const popOf = (code: string) => POP_RANK.get(code) ?? Number.MAX_SAFE_INTEGER;

/**
 * Ranked airport search. Tiers (best first):
 *   0. exact ALIAS   (curated intent — "goa"->GOI beats the GOA/Genoa code collision)
 *   1. exact IATA code
 *   2. exact city
 *   3. city / alias / code PREFIX
 *   4. city / alias / code SUBSTRING
 *   5. airport NAME substring
 * Within a tier, primary hubs (POPULAR) win, then alphabetical by code — so a
 * multi-airport city resolves to its main airport. Empty query returns POPULAR.
 * Capped (default 8). No fuzzy-match library — a normalised prefix/substring scan
 * over 3,242 rows is instant and avoids noisy near-matches on structured data.
 */
export function searchAirports(
  query: string,
  opts?: { exclude?: string; limit?: number },
): Airport[] {
  const exclude = opts?.exclude?.toUpperCase();
  const limit = opts?.limit ?? 8;
  const q = norm(query);

  if (!q) {
    const out: Airport[] = [];
    for (const code of POPULAR) {
      if (code === exclude) continue;
      const a = BY_CODE.get(code);
      if (a) out.push(a);
      if (out.length >= limit) break;
    }
    return out;
  }

  const scored: { a: Airport; tier: number; pop: number }[] = [];
  for (const x of INDEX) {
    if (x.code === exclude) continue;
    let tier = -1;
    if (x.naliases.includes(q)) tier = 0;
    else if (q.length === 3 && x.lcode === q) tier = 1;
    else if (x.ncity === q) tier = 2;
    else if (x.ncity.startsWith(q) || x.lcode.startsWith(q) || x.naliases.some((al) => al.startsWith(q))) tier = 3;
    else if (x.ncity.includes(q) || x.lcode.includes(q) || x.naliases.some((al) => al.includes(q))) tier = 4;
    else if (x.nname.includes(q)) tier = 5;
    if (tier >= 0) scored.push({ a: x.a, tier, pop: popOf(x.code) });
  }
  scored.sort((m, n) => m.tier - n.tier || m.pop - n.pop || m.a.iata.localeCompare(n.a.iata));
  return scored.slice(0, limit).map((s) => s.a);
}

/**
 * Resolve a free-text string (e.g. a "?q=Trip to Mumbai" deep-link) to an IATA
 * code, or null if nothing recognisable. Prefers an explicit 3-letter code token,
 * then the LONGEST city/alias that appears in the text (longest-wins avoids short
 * false positives). Replaces the old CITY_TO_IATA map.
 */
export function resolveCity(text: string): string | null {
  if (!text) return null;
  const codeTok = text.toUpperCase().match(/\b[A-Z]{3}\b/g);
  if (codeTok) for (const c of codeTok) if (BY_CODE.has(c)) return c;
  const t = norm(text);
  if (!t) return null;
  let best: string | null = null;
  let bestLen = 0;
  for (const x of INDEX) {
    const keys = [x.ncity, ...x.naliases];
    for (const k of keys) {
      if (k.length >= 3 && k.length > bestLen && t.includes(k)) {
        best = x.code;
        bestLen = k.length;
      }
    }
  }
  return best;
}
