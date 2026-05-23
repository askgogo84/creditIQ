// Run once: npx tsx lib/scripts/seed-supabase-cards.ts
// Seeds all cards from seed-cards.ts into Supabase cards table

import { createClient } from '@supabase/supabase-js';
import { SEED_CARDS } from '../data/seed-cards';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(url, key);
  console.log(`Seeding ${SEED_CARDS.length} cards to Supabase...`);

  const cards = SEED_CARDS.map((c: any) => ({
    id: c.id,
    name: c.name,
    bank: c.bank,
    network: c.network || 'Visa',
    tier: c.tier || 'standard',
    annual_fee_inr: c.annual_fee_inr ?? 0,
    joining_fee_inr: c.joining_fee_inr ?? 0,
    base_reward_rate: c.base_reward_rate ?? 1.0,
    min_income_inr_monthly: c.min_income_inr_monthly ?? 25000,
    min_cibil_score: c.min_cibil_score ?? 700,
    forex_markup_percent: c.forex_markup_percent ?? 3.5,
    fuel_surcharge_waiver: c.fuel_surcharge_waiver ?? false,
    category: Array.isArray(c.category) ? c.category : [c.category || 'rewards'],
    lounges: c.lounges || [],
    active: c.active !== false,
    description: c.description || null,
    best_for: c.best_for || null,
    iq_score: c.iq_score ?? 70,
    affiliate_url: c.affiliate_url || null,
    affiliate_type: c.affiliate_type || 'direct',
  }));

  const { data, error } = await supabase
    .from('cards')
    .upsert(cards, { onConflict: 'id' });

  if (error) {
    console.error('Error seeding:', error);
    process.exit(1);
  }

  console.log(`✅ Successfully seeded ${cards.length} cards to Supabase`);
  console.log('Cards are now live — no more hardcoded data!');
}

main();
