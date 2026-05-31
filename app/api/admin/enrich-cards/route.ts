// app/api/admin/enrich-cards/route.ts
// AI enrichment pipeline ? populates empty card fields using Claude Haiku
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const maxDuration = 300;

async function enrichCard(card: any, anthropicKey: string): Promise<any | null> {
  const prompt = [
    'You are a credit card data expert for India. Fill in accurate data for this card.',
    'Card: ' + card.name + ' by ' + card.bank,
    'Current annual fee: Rs.' + (card.annual_fee_inr || 0),
    'Current base reward rate: ' + (card.base_reward_rate || 1) + '%',
    '',
    'Return ONLY valid JSON (no markdown):',
    '{',
    '  "base_reward_rate": <number, actual reward rate as percentage>,',
    '  "forex_markup_percent": <number, typically 0, 1.5, 2, 3.5>,',
    '  "expert_rating": <number 1-10>,',
    '  "best_for": "<one clear sentence, no special chars>",',
    '  "highlights": ["<benefit 1>", "<benefit 2>", "<benefit 3>"],',
    '  "drawbacks": ["<drawback 1>", "<drawback 2>"],',
    '  "category_rewards": [{"category": "<name>", "rate": <number>, "unit": "percent", "cap_inr_monthly": <number or null>}],',
    '  "redemption_options": [{"type": "<type>", "partner": "<partner or null>", "value_per_point_inr": <number>}],',
    '  "lounges": [{"type": "domestic", "network": "<network>", "visits_per_year": <number or null>, "notes": "<notes>"}]',
    '}',
    '',
    'Use only verified, real data for this specific card. If unsure about lounges or specific benefits, use empty array [].',
    'For category_rewards include at minimum the top 2-3 spend categories for this card.',
  ].join('\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = (data.content?.[0]?.text || '').replace(/`json|`/g, '').trim();
  try { return JSON.parse(text); } catch { return null; }
}

export async function POST(req: NextRequest) {
  const { password, limit = 10, force = false } = await req.json();
  if (password !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!anthropicKey || !supabaseUrl || !supabaseKey) return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });

  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(supabaseUrl, supabaseKey);

  // Fetch cards that need enrichment
  let query = sb.from('cards').select('*');
  if (!force) {
    query = query.or('highlights.eq.,highlights.is.null,category_rewards.eq.,category_rewards.is.null');
  }
  const { data: cards, error } = await query.limit(limit);
  if (error || !cards?.length) return NextResponse.json({ success: true, message: 'No cards need enrichment', enriched: 0 });

  const results = { enriched: 0, failed: 0, skipped: 0, details: [] as any[] };

  for (const card of cards) {
    try {
      const enriched = await enrichCard(card, anthropicKey);
      if (!enriched) { results.failed++; results.details.push({ id: card.id, status: 'parse_failed' }); continue; }

      // Build update object ? only update fields that are empty
      const update: any = {};
      if (!card.highlights || card.highlights === '' || card.highlights === '[]') update.highlights = JSON.stringify(enriched.highlights || []);
      if (!card.drawbacks || card.drawbacks === '' || card.drawbacks === '[]') update.drawbacks = JSON.stringify(enriched.drawbacks || []);
      if (!card.category_rewards || card.category_rewards === '' || card.category_rewards === '[]') update.category_rewards = JSON.stringify(enriched.category_rewards || []);
      if (!card.redemption_options || card.redemption_options === '' || card.redemption_options === '[]') update.redemption_options = JSON.stringify(enriched.redemption_options || []);
      if (!card.lounges || card.lounges === '' || card.lounges === '[]') update.lounges = JSON.stringify(enriched.lounges || []);
      if (!card.expert_rating) update.expert_rating = enriched.expert_rating;
      if (!card.best_for || card.best_for?.includes('???')) update.best_for = enriched.best_for;
      if (card.forex_markup_percent === 3.5 || !card.forex_markup_percent) update.forex_markup_percent = enriched.forex_markup_percent;
      update.last_verified = new Date().toISOString().split('T')[0];
      update.updated_at = new Date().toISOString();

      if (Object.keys(update).length <= 2) { results.skipped++; results.details.push({ id: card.id, status: 'already_enriched' }); continue; }

      const { error: updateError } = await sb.from('cards').update(update).eq('id', card.id);
      if (updateError) { results.failed++; results.details.push({ id: card.id, status: 'update_failed', error: updateError.message }); }
      else { results.enriched++; results.details.push({ id: card.id, name: card.name, status: 'enriched', fields: Object.keys(update) }); }

      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 500));
    } catch (e: any) { results.failed++; results.details.push({ id: card.id, status: 'error', error: e.message }); }
  }

  return NextResponse.json({ success: true, total_processed: cards.length, ...results });
}
