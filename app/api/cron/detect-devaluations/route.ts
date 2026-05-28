// app/api/cron/detect-devaluations/route.ts
// Runs daily via Vercel cron — compares current card data vs yesterday's snapshot
// Detects: fee hikes, reward rate cuts, cap additions, lounge removals, partner removals
// Saves devaluation events to Supabase + triggers email alerts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 300;

const SOURCES_TO_CHECK = [
  // HDFC
  { bank: 'HDFC', card: 'HDFC Infinia', url: 'https://www.hdfcbank.com/personal/pay/cards/credit-cards/infinia-credit-card' },
  { bank: 'HDFC', card: 'HDFC Regalia Gold', url: 'https://www.hdfcbank.com/personal/pay/cards/credit-cards/regalia-gold-credit-card' },
  { bank: 'HDFC', card: 'HDFC Diners Black', url: 'https://www.hdfcbank.com/personal/pay/cards/credit-cards/diners-club-black-credit-card' },
  // Axis
  { bank: 'Axis', card: 'Axis Magnus', url: 'https://www.axisbank.com/retail/cards/credit-card/magnus-credit-card' },
  { bank: 'Axis', card: 'Axis Atlas', url: 'https://www.axisbank.com/retail/cards/credit-card/atlas-credit-card' },
  // SBI
  { bank: 'SBI', card: 'SBI Cashback', url: 'https://www.sbicard.com/en/personal/credit-cards/shopping/sbi-card-cashback.page' },
  // ICICI
  { bank: 'ICICI', card: 'ICICI Emeralde', url: 'https://www.icicibank.com/personal-banking/cards/credit-card/emeralde-private-metal' },
  // Amex
  { bank: 'AmEx', card: 'Amex Platinum Travel', url: 'https://www.americanexpress.com/in/credit-cards/platinum-travel-credit-card/' },
  // IDFC
  { bank: 'IDFC', card: 'IDFC First Wealth', url: 'https://www.idfcfirstbank.com/credit-card/wealth-credit-card' },
  // IndusInd
  { bank: 'IndusInd', card: 'IndusInd Pinnacle', url: 'https://www.indusind.com/in/en/personal/cards/credit-card/pinnacle-credit-card.html' },
  // Kotak
  { bank: 'Kotak', card: 'Kotak White Reserve', url: 'https://www.kotak.com/en/personal-banking/cards/credit-cards/white-reserve-credit-card.html' },
  // HSBC
  { bank: 'HSBC', card: 'HSBC TravelOne', url: 'https://www.hsbc.co.in/credit-cards/products/travelone/' },
];

async function fetchPageSnapshot(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CreditIQ-Monitor/1.0; +https://creditiq.app)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(15000),
    });
    const html = await res.text();
    // Strip HTML tags, normalize whitespace
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000); // First 8KB of clean text
  } catch (e: any) {
    return '';
  }
}

async function detectChanges(
  card: string,
  bank: string,
  oldSnapshot: string,
  newSnapshot: string
): Promise<{ changed: boolean; events: any[] }> {
  if (!oldSnapshot || !newSnapshot) return { changed: false, events: [] };

  // Quick hash check — if snapshots are identical, skip AI
  if (oldSnapshot === newSnapshot) return { changed: false, events: [] };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `You are CreditIQ's devaluation detection AI. Compare two snapshots of a bank's credit card page and identify any benefit changes.

Card: ${card} (${bank})

YESTERDAY'S PAGE:
${oldSnapshot.slice(0, 3000)}

TODAY'S PAGE:
${newSnapshot.slice(0, 3000)}

Look for changes in:
- Annual fee or joining fee amounts
- Reward point rates (X points per Rs.100)
- Cashback percentages
- Lounge access (visits per year, spend gates added)
- Transfer partner additions or removals
- Spending caps (new or changed)
- Category exclusions added
- Milestone benefit changes
- Forex markup changes

Respond ONLY with valid JSON (no markdown):
{
  "changed": true/false,
  "events": [
    {
      "category": "reward-rate" | "lounge" | "cap-added" | "fee-hike" | "exclusion" | "redemption",
      "description": "Specific change in plain English — e.g. 'Annual fee raised from Rs.2,500 to Rs.3,500'",
      "impact": "high" | "medium" | "low",
      "old_value": "what it was before (if detectable)",
      "new_value": "what it is now"
    }
  ]
}

If no meaningful benefit changes detected (only wording tweaks, layout changes), return: {"changed": false, "events": []}`,
      }],
    }),
  });

  const data = await res.json();
  const text = data.content?.[0]?.text ?? '{"changed":false,"events":[]}';
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return { changed: false, events: [] };
  }
}

export async function GET(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET || process.env.SYNC_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const results = {
    checked: 0,
    changed: 0,
    devaluations_found: 0,
    events: [] as any[],
  };

  for (const source of SOURCES_TO_CHECK) {
    results.checked++;

    // Fetch today's snapshot
    const newSnapshot = await fetchPageSnapshot(source.url);
    if (!newSnapshot) continue;

    // Save today's snapshot
    await supabase.from('page_snapshots').upsert({
      card_slug: source.card.toLowerCase().replace(/\s+/g, '-'),
      bank: source.bank,
      url: source.url,
      snapshot_text: newSnapshot,
      snapshot_date: today,
    }, { onConflict: 'card_slug,snapshot_date' });

    // Get yesterday's snapshot
    const { data: yesterdayData } = await supabase
      .from('page_snapshots')
      .select('snapshot_text')
      .eq('card_slug', source.card.toLowerCase().replace(/\s+/g, '-'))
      .eq('snapshot_date', yesterday)
      .single();

    if (!yesterdayData?.snapshot_text) continue;

    // AI diff detection
    const detection = await detectChanges(
      source.card,
      source.bank,
      yesterdayData.snapshot_text,
      newSnapshot
    );

    if (detection.changed && detection.events.length > 0) {
      results.changed++;

      for (const event of detection.events) {
        results.devaluations_found++;
        results.events.push({ card: source.card, ...event });

        // Save to devaluation_events table
        await supabase.from('devaluation_events').insert({
          card_name: source.card,
          bank: source.bank,
          category: event.category,
          description: event.description,
          impact: event.impact,
          old_value: event.old_value,
          new_value: event.new_value,
          detected_at: new Date().toISOString(),
          date: today,
          status: 'detected', // pending review before publishing
        });

        // Trigger alert emails for high-impact changes
        if (event.impact === 'high') {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/alerts/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'devaluation',
              card: source.card,
              bank: source.bank,
              description: event.description,
              impact: event.impact,
            }),
          }).catch(() => {}); // Non-blocking
        }
      }
    }
  }

  return NextResponse.json({
    message: `Checked ${results.checked} cards. Found ${results.devaluations_found} changes on ${results.changed} cards.`,
    ...results,
  });
}
