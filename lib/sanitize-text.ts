// lib/sanitize-text.ts
// Encoding repair for intelligence_kb text.
//
// Root cause note: the scraper fetch/write paths are actually UTF-8-correct -- every
// writer reads text via res.json() (spec UTF-8) and inserts via supabase-js (UTF-8
// JSON), so our code does not itself double-encode. Mojibake in the table comes from
// UPSTREAM source data (an Apify/Reddit caption that was already mis-decoded) or from
// legacy rows. So we defend at two points:
//   - cleanForStorage(): run at INGESTION so any mis-encoded input is repaired before
//     it is written -- new rows land clean.
//   - sanitizeText(): DISPLAY-only rescue for legacy rows already in the table.
// Neither migrates existing data.
//
// Repair strategy: if a string looks mojibaked AND every character maps back to a
// single source byte, rebuild the original bytes and decode them as UTF-8. If any
// character is not part of a single-byte mis-decode (i.e. real Unicode is present), we
// leave it untouched -- so this can never corrupt already-clean text.
// Written with \u escapes / char-code constructors so the source file stays pure ASCII
// (it must never carry the very bytes it is trying to repair).

const U_REPLACEMENT = String.fromCharCode(0xfffd); // U+FFFD replacement char
const CONTROL_CHARS = new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]', 'g'); // keep \t \n \r
const MOJIBAKE_LEAD = new RegExp('[\\u00C2\\u00C3\\u00E2\\u00F0]'); // Latin-1 lead bytes A-circumflex / a-circumflex / eth

// Windows-1252 high range (0x80-0x9F) -> original byte. Everything else <= 0xFF maps 1:1.
const CP1252_TO_BYTE: Record<number, number> = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86,
  0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c,
  0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95,
  0x2013: 0x96, 0x2014: 0x97, 0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b,
  0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f,
};

function toByte(cp: number): number | null {
  if (cp <= 0xff) return cp;
  if (cp in CP1252_TO_BYTE) return CP1252_TO_BYTE[cp];
  return null;
}

// Reverse a double-encoding (UTF-8 bytes re-decoded as Windows-1252/Latin-1). Safe:
// returns the input unchanged unless the whole string is a repairable byte stream.
export function repairDoubleEncoded(s: string): string {
  if (!MOJIBAKE_LEAD.test(s)) return s; // no classic mojibake lead byte -> nothing to do
  const bytes: number[] = [];
  for (const ch of s) {
    const b = toByte(ch.codePointAt(0)!);
    if (b === null) return s; // real Unicode present -> don't touch
    bytes.push(b);
  }
  if (!bytes.length) return s;
  try {
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
    return decoded.includes(U_REPLACEMENT) ? s : decoded; // bad decode -> keep original
  } catch {
    return s;
  }
}

// INGESTION guard -- normalise text before it is written to the DB. Preserves newlines.
export function cleanForStorage(input?: string | null): string {
  if (!input) return '';
  let s = repairDoubleEncoded(input).normalize('NFC');
  s = s.split(U_REPLACEMENT).join('').replace(CONTROL_CHARS, '');
  return s.trim();
}

// DISPLAY rescue for legacy rows -- repair, drop replacement chars, collapse spaces.
export function sanitizeText(input?: string | null): string {
  if (!input) return '';
  const s = repairDoubleEncoded(input).split(U_REPLACEMENT).join('');
  return s.replace(/[ \t]{2,}/g, ' ').trim();
}
