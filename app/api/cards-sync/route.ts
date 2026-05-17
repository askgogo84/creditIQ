import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SOURCES = [
  'https://www.paisabazaar.com/credit-card/',
  'https://select.finology.in/credit-card',
];

async function fetchPageText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CardIQ-Bot/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 6000);
  } catch { return ''; }
}

async function runDiscovery() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { error: 'No API key', found: 0, stored: 0 };

  const texts = await Promise.all(SOURCES.map(fetchPageText));
  const combined = texts.join('\n\n---\n\n').slice(0, 10000);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `Extract NEW Indian credit cards from this text that are NOT in this list: HDFC Infinia, HDFC Regalia Gold, HDFC Millennia, HDFC Diners Black, HDFC Swiggy, HDFC Freedom, HDFC MoneyBack+, HDFC Marriott Bonvoy, HDFC IndianOil, HDFC Diners ClubMiles, HDFC Platinum Times, SBI Cashback, SBI Elite, SBI SimplyCLICK, SBI SimplySAVE, SBI PULSE, SBI Prime, SBI AURUM, SBI Club Vistara, SBI BPCL Octane, SBI Air India, Amazon Pay ICICI, ICICI Sapphiro, ICICI Emeralde, ICICI Coral, ICICI Rubyx, ICICI MakeMyTrip Platinum, ICICI MakeMyTrip Signature, ICICI HPCL Super Saver, ICICI Expressions, Axis Magnus, Axis Atlas, Axis ACE, Axis Flipkart, Axis Vistara, Axis MyZone, Axis Horizon, Axis Reserve, Airtel Axis, IndianOil Axis, Axis NEO, Amex Platinum Travel, Amex Gold, Amex MRCC, Amex SmartEarn, IDFC Wealth, IDFC Select, IDFC Classic, IDFC WOW, IDFC Millennia, IDFC Club Vistara, Kotak 811, Kotak League, Kotak Royale, Kotak White, Kotak Privy League, Kotak Essentia, RBL ShopRite, RBL Popcorn, RBL World Safari, RBL ICON, RBL Fun Plus, Bajaj RBL SuperCard, YES Marquee, YES First Preferred, YES Prosperity, YES ACE, SC Ultimate, SC Smart, SC DigiSmart, SC Manhattan, SC Super Value, AU Zenith, AU LIT, AU Altura, AU Vetta, IndusInd Pinnacle, IndusInd Celesta, IndusInd Iconia, IndusInd Nexxt, IndusInd Legend, HSBC Cashback, HSBC Premier, HSBC Live+, OneCard, Federal Signet, Federal Celesta, BOB Eterna, BOB Prime, IDBI Imperium, Tata Neu Infinity, Tata Neu Plus.

Return ONLY a JSON array (no markdown, no text):
[{"name":"Card Name","bank":"Bank Name","joining_fee":999,"annual_fee":999,"reward_rate":1.0,"best_for":"One line","category":["cashback"],"apr":42,"tier":"entry"}]
If none found: []

Text: ${combined}`
      }],
    }),
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || '[]';
  let newCards: any[] = [];
  try { newCards = JSON.parse(text.replace(/```json|```/g, '').trim()); } catch { newCards = []; }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let stored = 0;

  if (supabaseUrl && supabaseKey && newCards.length > 0) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    for (const card of newCards) {
      const slug = card.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-');
      const { error } = await supabase.from('pending_cards').upsert({
        slug, name: card.name, bank: card.bank,
        joining_fee_inr: card.joining_fee || 0,
        annual_fee_inr: card.annual_fee || 0,
        base_reward_rate: card.reward_rate || 1,
        best_for: card.best_for || '',
        category: card.category || [],
        apr_percent: card.apr || 42,
        tier: card.tier || 'entry',
        status: 'pending_review',
        discovered_at: new Date().toISOString(),
        source: 'auto-discovery',
      }, { onConflict: 'slug' });
      if (!error) stored++;
    }
  }

  return { found: newCards.length, stored, cards: newCards.map((c: any) => c.name) };
}

// Vercel cron triggers GET
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET || process.env.SYNC_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await runDiscovery();
  return NextResponse.json(result);
}

// Manual trigger from admin panel triggers POST
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const secret = process.env.SYNC_SECRET || 'cardiq-sync-2026';
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await runDiscovery();
  return NextResponse.json(result);
}
