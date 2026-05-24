// Seed the Supabase `cards` table with hand-curated seed data.
// Run: npm run seed (or: npx tsx scripts/seed.ts)
//
// Requires:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY (NOT the anon key  --  service role for writes)

import { createClient } from '@supabase/supabase-js';
import { SEED_CARDS } from '../lib/data/seed-cards';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(url, key);

  console.log(`Seeding ${SEED_CARDS.length} cards...`);

  for (const card of SEED_CARDS) {
    const { error } = await supabase.from('cards').upsert(card, { onConflict: 'slug' });
    if (error) {
      console.error(`   ${card.name}: ${error.message}`);
    } else {
      console.log(`  (ok) ${card.name}`);
    }
  }

  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
