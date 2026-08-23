/**
 * audit-affiliate-coverage-db.ts — LIVE affiliate-coverage audit.
 *
 * Production serves the Supabase `cards` table (lib/supabase.ts getAllCards),
 * NOT SEED_CARDS. Many rows have UUID ids that match no AFFILIATE_LINKS key, so
 * before the default was removed they silently routed users to a competitor.
 *
 * This reports every ACTIVE Supabase row that resolves to NO tracked/direct link
 * and would therefore render no apply button. It calls the SAME resolveAffiliate()
 * the app uses, so audit and runtime cannot disagree.
 *
 * It ALSO prints before/after coverage: how many rows resolved to a link under
 * the OLD first-non-null(id ?? slug ?? name) behaviour vs the NEW first-that-
 * matches behaviour — i.e. how many of the gaps were slug-alias recoveries and
 * how many are genuine missing links.
 *
 * Needs DB creds (SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL), so it
 * canNOT be a prebuild gate. Run on demand:  `npm run audit:affiliate-db`
 * (locally with .env.local, or in a scheduled job with the key from secrets).
 * Exits non-zero if any active row has no link, so a scheduled job can flag it.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { resolveAffiliate, AFFILIATE_LINKS } from '../lib/affiliate';

// Mirrors the OLD getApplyUrl resolution (first non-null candidate, then match)
// purely to compute the before/after delta. NOT used for the pass/fail decision.
function legacyResolves(row: { id?: unknown; slug?: unknown; name?: unknown }): boolean {
  const first = [row.id, row.slug, row.name].find((v) => v != null && v !== '');
  if (typeof first !== 'string') return false;
  return !!AFFILIATE_LINKS[first.toLowerCase().replace(/\s+/g, '-')];
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error('✗ audit-affiliate-db: missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env.');
    process.exitCode = 2;
    return;
  }
  const sb = createClient(url, key);
  const { data, error } = await sb
    .from('cards')
    .select('id,slug,name,bank,apply_url')
    .eq('active', true);
  if (error) {
    console.error('✗ audit-affiliate-db: query failed —', error.message);
    process.exitCode = 2;
    return;
  }
  const rows = data ?? [];

  const beforeCovered = rows.filter(legacyResolves);
  const afterCovered = rows.filter((r) => resolveAffiliate(r) !== null);
  const leakers = rows.filter((r) => resolveAffiliate(r) === null);
  // Rows the alias fix recovered: no link under old order, link under new order.
  const recovered = rows.filter((r) => !legacyResolves(r) && resolveAffiliate(r) !== null);

  console.log(`\nLive Supabase cards (active): ${rows.length}`);
  console.log(`  Resolve to a link BEFORE (old id-first order):  ${beforeCovered.length}`);
  console.log(`  Resolve to a link AFTER  (first-that-matches):  ${afterCovered.length}`);
  console.log(`  Recovered purely by the resolution-order fix:   ${recovered.length}`);
  console.log(`  Genuine gaps (no link even after fix):          ${leakers.length}`);

  if (recovered.length) {
    console.log(`\nRecovered by slug/name alias (id was a non-matching UUID):`);
    recovered.forEach((r) => console.log(`  - ${r.slug ?? r.id} (${r.bank}) ← id=${r.id}`));
  }

  if (leakers.length) {
    console.error(`\n✗ ${leakers.length} active row(s) resolve to NO link (render no apply button):\n`);
    leakers.forEach((r) => console.error(`  - id=${r.id} slug=${r.slug ?? '∅'} bank=${r.bank ?? '?'} name="${r.name ?? '?'}" apply_url=${r.apply_url ?? '∅'}`));
    console.error('\nAdd a tracked/direct link in lib/affiliate.ts keyed by the id OR slug above.\n');
    process.exitCode = 1;
    return;
  }
  console.log(`\n✓ every active Supabase card resolves to a link.\n`);
}

// Set exitCode and let the loop drain rather than process.exit(), which trips a
// libuv teardown assertion on Windows while the supabase client handle closes.
main().catch((e) => { console.error(e); process.exitCode = 2; });
