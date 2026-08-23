/**
 * scripts/gen-airports.ts — MANUAL airport-dataset refresh. Run ON DEMAND only:
 *
 *   npm run gen:airports                       (fetches the live OurAirports CSV)
 *   tsx scripts/gen-airports.ts --csv <path>   (uses an already-downloaded CSV)
 *
 * This is DELIBERATELY NOT wired into the build. A live third-party fetch must
 * never gate CI, and the airport list must never change without a commit. The
 * committed output — lib/data/airports.generated.ts — is the single source of
 * truth; scripts/validate-airports.ts checks it offline in prebuild.
 *
 * Source:  OurAirports, released to the PUBLIC DOMAIN — https://ourairports.com/data/
 * Filter:  scheduled_service == 'yes'  AND  iata_code matches ^[A-Z]{3}$  AND
 *          type ∈ { large_airport, medium_airport }.
 * Merges lib/data/airport-aliases.json as a per-airport `aliases: string[]` field.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const CSV_URL = 'https://davidmegginson.github.io/ourairports-data/airports.csv';
const ROOT = join(__dirname, '..');
const ALIASES_PATH = join(ROOT, 'lib/data/airport-aliases.json');
const OUT_PATH = join(ROOT, 'lib/data/airports.generated.ts');

// Minimal RFC-4180-ish CSV parser (fields may be quoted and contain commas,
// newlines and escaped "" quotes). Good enough for the OurAirports export.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\r') { /* ignore */ }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

async function loadCsv(): Promise<{ text: string; source: string }> {
  const i = process.argv.indexOf('--csv');
  if (i >= 0 && process.argv[i + 1]) {
    const p = process.argv[i + 1];
    return { text: readFileSync(p, 'utf8'), source: `${CSV_URL} (via local ${p})` };
  }
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`fetch failed: HTTP ${res.status}`);
  return { text: await res.text(), source: CSV_URL };
}

async function main() {
  const { text, source } = await loadCsv();
  const rows = parseCsv(text);
  const header = rows[0];
  const col = (name: string) => header.indexOf(name);
  const cType = col('type'), cName = col('name'), cLat = col('latitude_deg'),
    cLon = col('longitude_deg'), cCountry = col('iso_country'),
    cCity = col('municipality'), cSched = col('scheduled_service'), cIata = col('iata_code');
  const rawCount = rows.length - 1;

  const aliasMap: Record<string, string> = JSON.parse(readFileSync(ALIASES_PATH, 'utf8'));
  const iataToAliases = new Map<string, string[]>();
  for (const [alias, iata] of Object.entries(aliasMap)) {
    if (alias.startsWith('_')) continue; // skip the _comment key
    if (!iataToAliases.has(iata)) iataToAliases.set(iata, []);
    iataToAliases.get(iata)!.push(alias);
  }

  const isIata = (s: string) => /^[A-Z]{3}$/.test(s);
  const seen = new Set<string>();
  const out: any[] = [];
  let dupes = 0;
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length < header.length) continue;
    if (row[cSched] !== 'yes') continue;
    const iata = (row[cIata] || '').trim();
    if (!isIata(iata)) continue;
    if (row[cType] !== 'large_airport' && row[cType] !== 'medium_airport') continue;
    if (seen.has(iata)) { dupes++; continue; }
    seen.add(iata);
    const name = (row[cName] || '').trim();
    const rec: any = {
      iata,
      city: (row[cCity] || '').trim() || name, // empty-municipality fallback -> airport name
      name,
      country: (row[cCountry] || '').trim(),
      lat: Number(Number(row[cLat]).toFixed(4)),
      lon: Number(Number(row[cLon]).toFixed(4)),
    };
    const al = iataToAliases.get(iata);
    if (al && al.length) rec.aliases = al;
    out.push(rec);
  }
  out.sort((a, b) => a.iata.localeCompare(b.iata));

  const today = new Date().toISOString().slice(0, 10);
  const body = out.map((r) => '  ' + JSON.stringify(r)).join(',\n');
  const file = `// GENERATED FILE — do not edit by hand. Refresh with: npm run gen:airports
// Source: OurAirports (Public Domain) — https://ourairports.com/data/
//   fetched from: ${source}
//   date fetched: ${today}
//   raw rows in source file: ${rawCount}
//   filter: scheduled_service=='yes' AND iata_code ~ /^[A-Z]{3}$/ AND type in {large_airport, medium_airport}
//   airports after filter: ${out.length}
//   aliases merged from: lib/data/airport-aliases.json
//
// Empty-municipality rows fall back to the airport name for \`city\`.

export interface RawAirport {
  iata: string;
  city: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  aliases?: string[];
}

export const AIRPORTS_RAW: RawAirport[] = [
${body}
];
`;
  writeFileSync(OUT_PATH, file, 'utf8');
  console.log(`✓ gen-airports: wrote ${out.length} airports to ${OUT_PATH} (raw ${rawCount}, dropped ${dupes} duplicate IATA row(s)).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
