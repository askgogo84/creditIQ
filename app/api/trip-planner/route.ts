import { NextRequest, NextResponse } from 'next/server'
import { retrieveRelevantCards, buildRagSystemPrompt } from '@/lib/rag'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { query, userPoints, cardBank, destination, origin, travelers, budget } = await req.json()
    const tripQuery = query || ('travel to ' + (destination || 'unknown'))
    if (!tripQuery.trim()) return NextResponse.json({ error: 'Missing trip query' }, { status: 400 })

    const { context, devaluations } = await retrieveRelevantCards(tripQuery, { topK: 8, intent: 'travel' })
    const systemPrompt = buildRagSystemPrompt(context, devaluations)

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    // Next weekend calculation
    const daysUntilSat = (6 - today.getDay() + 7) % 7 || 7
    const nextSat = new Date(today); nextSat.setDate(today.getDate() + daysUntilSat)
    const nextMon = new Date(nextSat); nextMon.setDate(nextSat.getDate() + 2)
    const nextSatStr = nextSat.toISOString().split('T')[0]
    const nextMonStr = nextMon.toISOString().split('T')[0]

    const userPrompt = `You are CIRA, CreditIQ's travel intelligence AI. Plan this trip using ONLY verified, real information.

TODAY: ${todayStr}
NEXT WEEKEND: ${nextSatStr} to ${nextMonStr}

TRIP REQUEST: ${tripQuery}
User points balance: ${userPoints || 0} points
Primary card bank: ${cardBank || 'HDFC'}
Origin: ${origin || 'Bangalore'}
${travelers ? 'Travelers: ' + travelers : ''}
${budget ? 'Budget: Rs.' + budget : ''}

CRITICAL ACCURACY RULES — follow strictly:
1. VISTARA NO LONGER EXISTS — merged into Air India on November 12, 2024. NEVER mention Vistara or UK-flight codes.
2. NO DIRECT INDIA→BALI flights. BLR-DPS route = BLR→SIN→DPS via Singapore Airlines (SQ), Scoot (TR), or Air Asia (AK).
3. NO DIRECT INDIA→SYDNEY. Route = via Singapore (SIN).
4. NO DIRECT INDIA→TOKYO. Route = via Singapore or direct Air India DEL-NRT.
5. NEVER invent flight numbers (like UK-2537). Only state airline name and hub.
6. NEVER invent specific prices — give realistic RANGES based on seasonal norms.
7. Points values: HDFC→KrisFlyer 1:1. BLR-SIN-DPS Business = ~85,000 KrisFlyer miles. BLR-SIN Economy = ~17,500 KrisFlyer miles.
8. Air India Flying Returns is the correct programme post-Vistara merger.
9. InterMiles = IndiGo's programme (not for SQ routes).
10. All dates must be REAL future dates based on TODAY = ${todayStr}.

VERIFIED AWARD RATES (use these exact figures):
- BLR→SIN Economy (KrisFlyer): 17,500 miles one-way
- BLR→SIN Business (KrisFlyer): 42,500 miles one-way  
- SIN→DPS Economy (KrisFlyer): 12,500 miles one-way
- SIN→DPS Business (KrisFlyer): 25,000 miles one-way
- BLR→DXB Economy (InterMiles): 20,000 miles one-way
- BLR→LHR Economy (Air India Flying Returns): 25,000 miles one-way
- BLR→BKK Economy (KrisFlyer): 20,000 miles one-way

VERIFIED CASH PRICE RANGES (realistic 2026, return from BLR):
- BLR-SIN return: Rs.18,000-35,000 Economy
- BLR-DPS return (via SIN): Rs.28,000-55,000 Economy
- BLR-BKK return: Rs.15,000-30,000 Economy
- BLR-DXB return: Rs.18,000-40,000 Economy
- BLR-LHR return: Rs.55,000-1,20,000 Economy
- BLR-MLE return (via CMB): Rs.20,000-45,000 Economy

Respond ONLY with valid JSON (no markdown, no preamble):
{
  "destination": "Bali",
  "dates": "May 31 - June 2, 2026",
  "duration": "3 nights",
  "tripType": "Leisure",
  "summary": "3 nights in Bali via Singapore. No direct flights from India — route is BLR→SIN→DPS. With 1,82,164 HDFC points you can cover the flights in business class via KrisFlyer transfer.",
  "proTip": "Transfer HDFC points to KrisFlyer 1:1. BLR-SIN-DPS Business class needs 85,000 KrisFlyer miles return. You have enough points to cover flights and still have 97,164 pts for hotel via SmartBuy.",
  "totalPointsNeeded": 85000,
  "totalCashPrice": 45000,
  "totalPointsValue": 85000,
  "totalSaving": 40000,
  "bestCard": "HDFC Infinia",
  "bestCardId": "hdfc-infinia",
  "userPoints": ${userPoints || 0},
  "pointsGap": 0,
  "canAfford": true,
  "flights": [
    {
      "option": "Business Class via Singapore",
      "airline": "Singapore Airlines + Scoot",
      "class": "Business",
      "pointsNeeded": 85000,
      "cashPrice": 55000,
      "pointsValue": 85000,
      "saving": 30000,
      "cardNeeded": "HDFC Infinia",
      "cardId": "hdfc-infinia",
      "transferPartner": "KrisFlyer",
      "bookingUrl": "https://www.singaporeair.com/en_UK/in/plan-travel/book-flights/",
      "connectionHub": "Singapore (SIN)",
      "connectionAirline": "Singapore Airlines BLR-SIN, then Scoot SIN-DPS",
      "totalFlightTime": "9h 30m (BLR→SIN 4h, SIN→DPS 2h 30m + transit)",
      "available": true
    },
    {
      "option": "Economy via Singapore",
      "airline": "Air Asia + Scoot",
      "class": "Economy",
      "pointsNeeded": 30000,
      "cashPrice": 38000,
      "pointsValue": 30000,
      "saving": 8000,
      "cardNeeded": "HDFC Regalia Gold",
      "cardId": "hdfc-regalia-gold",
      "transferPartner": "KrisFlyer",
      "bookingUrl": "https://www.kayak.co.in/flights/BLR-DPS/2026-05-31/2026-06-02",
      "connectionHub": "Singapore (SIN)",
      "connectionAirline": "Air Asia BLR-SIN, then Scoot SIN-DPS",
      "totalFlightTime": "9h (BLR→SIN 3h 50m, SIN→DPS 2h 25m + transit)",
      "available": true
    }
  ],
  "hotels": [
    {
      "name": "Marriott Bali Nusa Dua",
      "chain": "Marriott Bonvoy",
      "pointsNeeded": 45000,
      "cashPrice": 28000,
      "pointsValue": 35000,
      "saving": 7000,
      "cardNeeded": "HDFC Infinia",
      "cardId": "hdfc-infinia",
      "nights": 3,
      "available": true
    }
  ]
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''
    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(clean)
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Trip planner error:', err)
    return NextResponse.json({ error: 'Trip planning failed' }, { status: 500 })
  }
}
