import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Transfer partner data by bank
const TRANSFER_PARTNERS: Record<string, any[]> = {
  HDFC: [
    { partner: 'KrisFlyer', ratio: '2:1', type: 'airline', url: 'https://www.singaporeair.com' },
    { partner: 'InterMiles', ratio: '1:1', type: 'airline', url: 'https://www.intermiles.com' },
    { partner: 'Club Vistara', ratio: '1:1', type: 'airline', url: 'https://www.airvistara.com' },
    { partner: 'Marriott Bonvoy', ratio: '2:1', type: 'hotel', url: 'https://www.marriott.com' },
    { partner: 'SmartBuy', ratio: '1:1', type: 'direct', url: 'https://www.hdfcsmartbuy.com' },
  ],
  Axis: [
    { partner: 'Club Vistara', ratio: '1:1', type: 'airline', url: 'https://www.airvistara.com' },
    { partner: 'EDGE Rewards', ratio: '1:1', type: 'direct', url: 'https://www.axisbankedgerewards.com' },
    { partner: 'InterMiles', ratio: '1:1', type: 'airline', url: 'https://www.intermiles.com' },
  ],
  Amex: [
    { partner: 'British Airways Avios', ratio: '1:1', type: 'airline', url: 'https://www.britishairways.com' },
    { partner: 'KrisFlyer', ratio: '2:1', type: 'airline', url: 'https://www.singaporeair.com' },
    { partner: 'Marriott Bonvoy', ratio: '1:1', type: 'hotel', url: 'https://www.marriott.com' },
    { partner: 'Hilton Honors', ratio: '1:2', type: 'hotel', url: 'https://www.hilton.com' },
  ],
  SBI: [
    { partner: 'Air India Miles', ratio: '1:1', type: 'airline', url: 'https://www.airindia.com' },
    { partner: 'Club Vistara', ratio: '1:1', type: 'airline', url: 'https://www.airvistara.com' },
  ],
  ICICI: [
    { partner: 'InterMiles', ratio: '1:1', type: 'airline', url: 'https://www.intermiles.com' },
    { partner: 'Club Vistara', ratio: '1:1', type: 'airline', url: 'https://www.airvistara.com' },
  ],
  IDFC: [],
  Kotak: [
    { partner: 'InterMiles', ratio: '1:1', type: 'airline', url: 'https://www.intermiles.com' },
  ],
  AU: [
    { partner: 'InterMiles', ratio: '1:1', type: 'airline', url: 'https://www.intermiles.com' },
  ],
};

// Card mapping by bank
const BEST_CARDS: Record<string, { id: string; name: string }> = {
  HDFC: { id: 'hdfc-infinia', name: 'HDFC Infinia' },
  Axis: { id: 'axis-magnus', name: 'Axis Magnus' },
  Amex: { id: 'amex-platinum', name: 'Amex Platinum' },
  SBI: { id: 'sbi-elite', name: 'SBI Elite' },
  ICICI: { id: 'icici-emeralde', name: 'ICICI Emeralde' },
  IDFC: { id: 'idfc-first', name: 'IDFC First' },
  Kotak: { id: 'kotak-811', name: 'Kotak 811' },
  AU: { id: 'au-zenith', name: 'AU Zenith' },
  None: { id: 'hdfc-infinia', name: 'HDFC Infinia' },
};

export async function POST(req: NextRequest) {
  try {
    const { query, userPoints = 0, cardBank = 'HDFC' } = await req.json();

    const partners = TRANSFER_PARTNERS[cardBank] || TRANSFER_PARTNERS['HDFC'];
    const bestCard = BEST_CARDS[cardBank] || BEST_CARDS['HDFC'];
    const partnersText = partners.length > 0
      ? partners.map(p => `${p.partner} (${p.ratio} ratio, ${p.type})`).join(', ')
      : 'No transfer partners — recommend switching to HDFC or Axis for better travel value';

    const prompt = `You are CreditIQ's AI Trip Planner for India. Plan a trip based on this request and return ONLY valid JSON.

User request: "${query}"
User's points balance: ${userPoints.toLocaleString('en-IN')} points
User's primary card bank: ${cardBank}
Available transfer partners for ${cardBank}: ${partnersText}

Create a realistic trip plan with actual flight and hotel options. Use real airline names, real hotel chains, and realistic Indian pricing in Rs.

Rules:
- Flight prices should be realistic for India-origin travel (e.g. Mumbai/Delhi to London economy Rs.55,000-85,000, business Rs.2,50,000-4,00,000)
- Hotel prices realistic for destination (London budget Rs.8,000/night, mid Rs.15,000, premium Rs.35,000)
- Points values based on actual transfer partner rates
- For HDFC: SmartBuy gives ~Rs.0.50/pt for flights, KrisFlyer transfer gives Rs.1.5-2/pt for business class
- For Axis: Club Vistara gives ~Rs.0.60/pt, EDGE gives Rs.0.30/pt
- Always show 2-3 flight options and 2-3 hotel options
- pointsValue = what those points are worth in Rs for that option
- saving = cashPrice - pointsValue (what user saves vs paying cash)
- canAfford = userPoints >= totalPointsNeeded

Respond ONLY with this exact JSON structure:
{
  "destination": "London, UK",
  "dates": "June 2026 (estimated)",
  "duration": "5 nights",
  "tripType": "Business",
  "summary": "5 nights in London — best value via KrisFlyer Business Class + Marriott Bonvoy",
  "proTip": "Book KrisFlyer 2 months ahead for saver awards. Set an alert on ExpertFlyer for space.",
  "totalPointsNeeded": 180000,
  "totalCashPrice": 425000,
  "totalPointsValue": 360000,
  "totalSaving": 295000,
  "bestCard": "HDFC Infinia",
  "bestCardId": "hdfc-infinia",
  "userPoints": ${userPoints},
  "pointsGap": 0,
  "canAfford": true,
  "flights": [
    {
      "option": "Transfer to KrisFlyer → Singapore Airlines BOM-LHR",
      "airline": "Singapore Airlines",
      "class": "Business Class",
      "pointsNeeded": 120000,
      "cashPrice": 320000,
      "pointsValue": 320000,
      "saving": 200000,
      "cardNeeded": "HDFC Infinia",
      "cardId": "hdfc-infinia",
      "transferPartner": "KrisFlyer",
      "bookingUrl": "https://www.singaporeair.com",
      "available": true
    }
  ],
  "hotels": [
    {
      "name": "London Marriott Hotel County Hall",
      "chain": "Marriott Bonvoy",
      "pointsNeeded": 60000,
      "cashPrice": 105000,
      "pointsValue": 105000,
      "saving": 105000,
      "cardNeeded": "HDFC Infinia",
      "cardId": "hdfc-infinia",
      "nights": 5,
      "available": true
    }
  ]
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: 'You are CreditIQ\'s AI Trip Planner. You respond ONLY with valid JSON, no markdown, no extra text. Use realistic Indian prices and actual airline/hotel programs.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    // Recalculate canAfford
    parsed.userPoints = userPoints;
    parsed.pointsGap = Math.max(0, parsed.totalPointsNeeded - userPoints);
    parsed.canAfford = userPoints >= parsed.totalPointsNeeded;

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Trip planner error:', err);
    return NextResponse.json({ error: 'Could not plan trip. Please try again.' }, { status: 500 });
  }
}
