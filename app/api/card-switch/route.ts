import { NextRequest, NextResponse } from 'next/server';
import { SEED_CARDS } from '@/lib/data/seed-cards';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { currentCardId, reasons, outstandingDebt, currentInterestRate } = await req.json();

    const currentCard = SEED_CARDS.find(c => c.id === currentCardId) as any;
    if (!currentCard) return NextResponse.json({ error: 'Card not found' }, { status: 400 });

    const prompt = `You are CreditIQ's unbiased card switch advisor for India. 

A user currently has: ${currentCard.name} (${currentCard.bank}), annual fee Rs.${currentCard.annual_fee_inr ?? 0}

Reasons they want to switch: ${reasons.join(', ')}
Outstanding balance: Rs.${outstandingDebt ?? 0}
Current interest rate: ${currentInterestRate ?? 36}% per annum

Recommend exactly 3 Indian credit cards they should switch to. Pick cards that directly solve their stated problems. Be specific about why each card fixes their issues.

Respond ONLY with valid JSON, no markdown:
{
  "summary": "2-3 sentences on why these cards solve their specific problems",
  "cards": [
    {
      "id": "hdfc-regalia-gold",
      "name": "HDFC Regalia Gold",
      "bank": "HDFC Bank",
      "annualFee": 2500,
      "reasons": ["Lower annual fee than your current card", "Better rewards on dining and travel", "4 complimentary lounge visits per quarter"],
      "btOffer": "0% interest on balance transfer for 3 months with 1% processing fee"
    }
  ]
}

Use real card IDs from this list (use exact slugs): hdfc-regalia-gold, hdfc-infinia, hdfc-millenia, axis-magnus, axis-privilege, axis-flipkart, sbi-cashback, sbi-elite, idfc-first, idfc-first-wow, icici-amazon-pay, scapia, au-zenith, kotak-811`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: 'You are CreditIQ\'s unbiased card switch advisor. Always respond with valid JSON only, no markdown or extra text.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    // Enrich with real annual fees from seed cards
    parsed.cards = parsed.cards.map((card: any) => {
      const seedCard = SEED_CARDS.find(c => c.id === card.id) as any;
      return {
        ...card,
        annualFee: seedCard?.annual_fee_inr ?? card.annualFee ?? 0,
      };
    });

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Card switch error:', err);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
