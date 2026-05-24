import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { SEED_CARDS } from '../data/seed-cards';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !key) {
    console.error('Missing env vars. URL:', !!url, 'KEY:', !!key);
    process.exit(1);
  }

  const supabase = createClient(url, key);
  console.log(`Seeding ${SEED_CARDS.length} cards...`);

  const cards = (SEED_CARDS as any[]).map((c: any) => ({
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
  }));

  const { error } = await supabase.from('cards').upsert(cards, { onConflict: 'id' });

  if (error) { console.error('Error:', error); process.exit(1); }
  console.log(`✅ Seeded ${cards.length} cards!`);
}

main();
