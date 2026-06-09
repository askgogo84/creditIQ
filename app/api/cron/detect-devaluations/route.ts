import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 300;

const SOURCES_TO_CHECK = [
  { bank: 'HDFC', card: 'HDFC Infinia', url: 'https://www.hdfcbank.com/personal/pay/cards/credit-cards/infinia-credit-card' },
  { bank: 'HDFC', card: 'HDFC Regalia Gold', url: 'https://www.hdfcbank.com/personal/pay/cards/credit-cards/regalia-gold-credit-card' },
  { bank: 'HDFC', card: 'HDFC Diners Black', url: 'https://www.hdfcbank.com/personal/pay/cards/credit-cards/diners-club-black-credit-card' },
  { bank: 'Axis', card: 'Axis Magnus', url: 'https://www.axisbank.com/retail/cards/credit-card/magnus-credit-card' },
  { bank: 'Axis', card: 'Axis Atlas', url: 'https://www.axisbank.com/retail/cards/credit-card/atlas-credit-card' },
  { bank: 'SBI', card: 'SBI Cashback', url: 'https://www.sbicard.com/en/personal/credit-cards/shopping/sbi-card-cashback.page' },
  { bank: 'ICICI', card: 'ICICI Emeralde', url: 'https://www.icicibank.com/personal-banking/cards/credit-card/emeralde-private-metal' },
  { bank: 'AmEx', card: 'Amex Platinum Travel', url: 'https://www.americanexpress.com/in/credit-cards/platinum-travel-credit-card/' },
  { bank: 'IDFC', card: 'IDFC First Wealth', url: 'https://www.idfcfirstbank.com/credit-card/wealth-credit-card' },
  { bank: 'IndusInd', card: 'IndusInd Pinnacle', url: 'https://www.indusind.com/in/en/personal/cards/credit-card/pinnacle-credit-card.html' },
  { bank: 'Kotak', card: 'Kotak White Reserve', url: 'https://www.kotak.com/en/personal-banking/cards/credit-cards/white-reserve-credit-card.html' },
  { bank: 'HSBC', card: 'HSBC TravelOne', url: 'https://www.hsbc.co.in/credit-cards/products/travelone/' },
];

async function fetchPageSnapshot(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CreditIQ-Monitor/1.0)' },
      signal: AbortSignal.timeout(12000),
    });
    const html = await res.text();
    return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 8000);
  } catch { return ''; }
}

async function detectChanges(card: string, bank: string, oldSnap: string, newSnap: string) {
  if (!oldSnap || !newSnap || oldSnap === newSnap) return { changed: false, events: [] };
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514', max_tokens: 1000,
      messages: [{ role: 'user', content: `Compare these two snapshots of ${card} (${bank}) credit card page. Find meaningful benefit changes (fees, reward rates, caps, lounges, partners). Ignore layout/wording changes.\n\nYESTERDAY:\n${oldSnap.slice(0, 2500)}\n\nTODAY:\n${newSnap.slice(0, 2500)}\n\nRespond ONLY with JSON: {"changed":true/false,"events":[{"category":"reward-rate|lounge|cap-added|fee-hike|exclusion|redemption","description":"plain English","impact":"high|medium|low"}]}` }],
    }),
  });
  const data = await res.json();
  try { return JSON.parse(data.content?.[0]?.text?.replace(/```json|```/g, '').trim() || '{"changed":false,"events":[]}'); }
  catch { return { changed: false, events: [] }; }
}

async function runDetection() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  let checked = 0, devaluations = 0;

  for (const source of SOURCES_TO_CHECK) {
    checked++;
    const newSnap = await fetchPageSnapshot(source.url);
    if (!newSnap) continue;

    const slug = source.card.toLowerCase().replace(/\s+/g, '-');
    await supabase.from('page_snapshots').upsert({ card_slug: slug, bank: source.bank, url: source.url, snapshot_text: newSnap, snapshot_date: today }, { onConflict: 'card_slug,snapshot_date' });

    const { data: yesterday_data } = await supabase.from('page_snapshots').select('snapshot_text').eq('card_slug', slug).eq('snapshot_date', yesterday).single();
    if (!yesterday_data?.snapshot_text) continue;

    const detection = await detectChanges(source.card, source.bank, yesterday_data.snapshot_text, newSnap);
    if (detection.changed && detection.events?.length > 0) {
      for (const event of detection.events) {
        devaluations++;
        await supabase.from('devaluation_events').insert({ card_name: source.card, bank: source.bank, ...event, detected_at: new Date().toISOString(), date: today, status: 'detected' });
        if (event.impact === 'high') {
          fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/alerts/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'devaluation', card: source.card, bank: source.bank, description: event.description }) })
        }
      }
    }
  }

  try { await supabase.from('cron_logs').insert({ job: 'detect-devaluations', result: { checked, devaluations }, ran_at: new Date().toISOString() }) } catch {}
  console.log(`Detection complete: ${checked} checked, ${devaluations} devaluations found`);
}

export async function GET(req: NextRequest) {
  // Vercel crons are called by Vercel infrastructure only — no secret needed
  // Respond immediately — run detection in background
  runDetection().catch(console.error);
  return NextResponse.json({ message: 'Detection started', started_at: new Date().toISOString() });
}
