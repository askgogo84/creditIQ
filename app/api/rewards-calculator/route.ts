// app/api/rewards-calculator/route.ts
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

function calcRewards(card: any, spends: Record<string, number>): number {
  let total = 0;
  const catRewards = Array.isArray(card.category_rewards) ? card.category_rewards
    : (() => { try { return JSON.parse(card.category_rewards || '[]'); } catch { return []; } })();
  for (const [cat, amount] of Object.entries(spends)) {
    const cr = catRewards.find((c: any) => c.category?.toLowerCase() === cat.toLowerCase());
    const rate = cr ? cr.rate : (card.base_reward_rate || 1);
    const unit = cr?.unit || 'percent';
    const cap = cr?.cap_inr_monthly;
    let earned = unit === 'percent' ? (amount * rate / 100) : (amount * rate / 100);
    if (cap) earned = Math.min(earned, cap);
    total += earned;
  }
  return Math.round(total);
}

export async function POST(req: NextRequest) {
  try {
    const { card_id, spends } = await req.json();
    if (!card_id || !spends) return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: 'Missing env' }, { status: 500 });
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(supabaseUrl, supabaseKey);

    // Get current card
    const { data: card } = await sb.from('cards').select('*').eq('id', card_id).single();
    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

    // Get all cards for comparison
    const { data: allCards } = await sb.from('cards').select('*').eq('active', true);
    const cards = allCards || [];

    const totalMonthly = Object.values(spends as Record<string, number>).reduce((a, b) => a + b, 0);
    const currentRewards = calcRewards(card, spends);

    // Find best alternative
    let bestCard = card;
    let bestRewards = currentRewards;
    for (const c of cards) {
      if (c.id === card_id) continue;
      const r = calcRewards(c, spends);
      if (r > bestRewards) { bestRewards = r; bestCard = c; }
    }

    const monthlyGap = bestRewards - currentRewards;
    const annualGap = monthlyGap * 12;

    // Get AI explanation if there's a meaningful gap
    let aiExplanation = '';
    if (monthlyGap > 100 && process.env.ANTHROPIC_API_KEY) {
      const prompt = 'User has ' + card.name + ' earning Rs.' + currentRewards + '/month rewards on Rs.' + totalMonthly + '/month spend. '
        + bestCard.name + ' would earn Rs.' + bestRewards + '/month. In 2 sentences max, explain why ' + bestCard.name + ' is better for their spend pattern. Be specific about rates.';
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 150, messages: [{ role: 'user', content: prompt }] }),
      });
      if (res.ok) {
        const d = await res.json();
        aiExplanation = d.content?.[0]?.text || '';
      }
    }

    return NextResponse.json({
      current_card: { id: card.id, name: card.name, bank: card.bank, rewards_monthly: currentRewards },
      best_card: { id: bestCard.id, name: bestCard.name, bank: bestCard.bank, rewards_monthly: bestRewards, apply_url: bestCard.apply_url_affiliate || bestCard.apply_url },
      monthly_gap: monthlyGap,
      annual_gap: annualGap,
      total_monthly_spend: totalMonthly,
      ai_explanation: aiExplanation,
      is_best: monthlyGap <= 0,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
