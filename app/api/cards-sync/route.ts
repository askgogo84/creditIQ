import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SOURCES = [
  'https://www.paisabazaar.com/credit-card/',
  'https://www.bankbazaar.com/credit-card.html',
  'https://select.finology.in/credit-card',
];

async function fetchPageText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CardIQ-Bot/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    // Strip HTML tags, get plain text
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 8000);
  } catch {
    return '';
  }
}

export async function POST(req: NextRequest) {
  // Verify secret to prevent abuse
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.SYNC_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 });

  try {
    // Fetch content from sources
    const texts = await Promise.all(SOURCES.map(fetchPageText));
    const combined = texts.join('\n\n---\n\n').slice(0, 12000);

    // Ask Claude to extract new cards
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `You are a credit card data extractor for India. 

From the following text scraped from Indian credit card comparison sites, extract any credit cards that are NOT already in our database.

Our existing cards include: HDFC Infinia, HDFC Regalia Gold, HDFC Millennia, HDFC Diners Black, SBI Cashback, SBI Elite, SBI SimplyCLICK, Amazon Pay ICICI, ICICI Sapphiro, ICICI Emeralde, ICICI Coral, Axis Magnus, Axis Atlas, Axis ACE, Axis Flipkart, Axis Vistara, Amex Platinum Travel, Amex Gold, Amex MRCC, Amex SmartEarn, IDFC First Wealth, IDFC First Select, IDFC First Classic, IDFC WOW, IDFC Millennia, Kotak 811, Kotak League, Kotak Royale, RBL ShopRite, RBL Popcorn, YES Marquee, YES First Preferred, SC Ultimate, SC Smart, SC DigiSmart, AU Zenith, AU LIT, AU Altura, IndusInd Pinnacle, IndusInd Celesta, IndusInd Iconia, HSBC Cashback, HSBC Premier, HSBC Live+, OneCard, Federal Bank Signet, BOB Eterna, Tata Neu Infinity, Tata Neu Plus, HDFC Swiggy, HDFC Freedom, HDFC MoneyBack+, HDFC Marriott Bonvoy, SBI AURUM, SBI PULSE, SBI Prime, Axis Reserve, Airtel Axis, IndianOil Axis, Axis NEO, ICICI MakeMyTrip Platinum, ICICI MakeMyTrip Signature, ICICI HPCL Super Saver.

For each NEW card found, return ONLY a JSON array (no other text) with this structure:
[{
  "name": "Card name",
  "bank": "Bank name",
  "joining_fee": 0,
  "annual_fee": 0,
  "reward_rate": 1,
  "best_for": "One line description",
  "category": ["cashback"],
  "apr": 42,
  "tier": "entry|mid|premium|super-premium"
}]

If no new cards found, return: []

Source text:
${combined}`
        }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '[]';

    let newCards: any[] = [];
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      newCards = JSON.parse(clean);
    } catch {
      newCards = [];
    }

    // If Supabase configured, store new cards for review
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let stored = 0;

    if (supabaseUrl && supabaseKey && newCards.length > 0) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      for (const card of newCards) {
        const slug = card.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const { error } = await supabase.from('pending_cards').upsert({
          slug,
          name: card.name,
          bank: card.bank,
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

    return NextResponse.json({
      found: newCards.length,
      stored,
      cards: newCards.map(c => c.name),
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
