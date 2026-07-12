import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
export const runtime = 'edge';
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req); if (denied) return denied;
  const { slug } = await req.json();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'No DB' }, { status: 500 });
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(url, key);
  const { data: pending } = await supabase.from('pending_cards').select('*').eq('slug', slug).single();
  if (pending) {
    await supabase.from('cards').upsert({ id: slug, slug, name: pending.name, bank: pending.bank, tier: pending.tier, joining_fee_inr: pending.joining_fee_inr, annual_fee_inr: pending.annual_fee_inr, base_reward_rate: pending.base_reward_rate, best_for: pending.best_for, color: '#333333', category: pending.category, reward_currency: 'reward-points', active: true, last_verified: new Date().toISOString().split('T')[0], highlights: [], redemption_options: [], category_rewards: [], lounges: [], devaluations: [] }, { onConflict: 'id' });
    await supabase.from('pending_cards').update({ status: 'approved' }).eq('slug', slug);
  }
  return NextResponse.json({ ok: true });
}
