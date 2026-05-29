import { NextRequest, NextResponse } from 'next/server'
import { retrieveRelevantCards, buildRagSystemPrompt } from '@/lib/rag'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { query, userPoints, cardBank, destination, origin, travelers, budget } = await req.json()

    // Support both calling conventions
    const tripQuery = query || ('travel to ' + (destination || 'unknown'))
    if (!tripQuery.trim()) return NextResponse.json({ error: 'Missing trip query' }, { status: 400 })

    const { context, devaluations } = await retrieveRelevantCards(tripQuery, {
      topK: 8,
      intent: 'travel',
    })

    const systemPrompt = buildRagSystemPrompt(context, devaluations)

    // Parse natural language dates
    const today = new Date();
    const nextWeekend = new Date(today);
    nextWeekend.setDate(today.getDate() + (6 - today.getDay() + 7) % 7 + 1);
    const nextWeekendStr = nextWeekend.toISOString().split('T')[0];

    const userPrompt = 'Plan a trip and recommend the best credit cards to maximize value.\n\n' +
      'TODAY\'S DATE: ' + today.toISOString().split('T')[0] + '\n' +
      'NEXT WEEKEND: ' + nextWeekendStr + '\n\n' +
      'ROUTING RULES (critical - follow these):\n' +
      '- Bali (DPS): No direct from India. Route = BLR/DEL/BOM → SIN → DPS via Singapore Airlines/Air Asia/Scoot\n' +
      '- Maldives (MLE): Route = via Colombo (CMB) or Singapore (SIN)\n' +
      '- Tokyo (NRT): Route = via Singapore (SIN) or direct on Air India\n' +
      '- Sydney (SYD): Route = via Singapore (SIN)\n' +
      '- London (LHR): Direct Air India DEL-LHR, or via Dubai on Emirates\n' +
      '- Paris (CDG): Via Dubai on Emirates or via London\n' +
      '- New York (JFK): Via London or Dubai\n' +
      '- Always show the connecting hub and airlines\n\n' +
      'POINTS KNOWLEDGE (use exact values):\n' +
      '- HDFC points → KrisFlyer 1:1 → BLR-SIN-DPS Business = 85,000 KrisFlyer miles\n' +
      '- HDFC points → KrisFlyer 1:1 → BLR-SIN Economy = 17,500 KrisFlyer miles\n' +
      '- HDFC points → InterMiles → BLR-DXB Economy = 20,000 InterMiles\n' +
      '- Axis EDGE → Turkish Miles&Smiles 1:1 → Good for Europe routing\n' +
      '- 1 HDFC point = Rs.0.25 cashback, but Rs.0.50-1.50 on SmartBuy\n\n' +
      'TRIP REQUEST: ' + tripQuery + '\n' +
      'User points balance: ' + (userPoints || 0) + ' points\n' +
      'Primary card bank: ' + (cardBank || 'Any') + '\n' +
      (travelers ? 'Travelers: ' + travelers + '\n' : '') +
      (budget ? 'Budget: Rs.' + budget + '\n' : '') +
      '\nAnalyze which cards from the database give maximum value for this trip.\n\n' +
      'Respond ONLY with valid JSON matching this exact structure:\n' +
      '{\n' +
      '  "destination": "Bangkok",\n' +
      '  "dates": "Next month",\n' +
      '  "duration": "5 nights",\n' +
      '  "tripType": "Leisure",\n' +
      '  "summary": "Brief trip summary with card strategy",\n' +
      '  "proTip": "Specific tip to maximize points for this trip",\n' +
      '  "totalPointsNeeded": 120000,\n' +
      '  "totalCashPrice": 85000,\n' +
      '  "totalPointsValue": 95000,\n' +
      '  "totalSaving": 10000,\n' +
      '  "bestCard": "HDFC Infinia",\n' +
      '  "bestCardId": "hdfc-infinia",\n' +
      '  "userPoints": ' + (userPoints || 0) + ',\n' +
      '  "pointsGap": 0,\n' +
      '  "canAfford": true,\n' +
      '  "flights": [\n' +
      '    {\n' +
      '      "option": "Economy return",\n' +
      '      "airline": "IndiGo / Air Asia",\n' +
      '      "class": "Economy",\n' +
      '      "pointsNeeded": 60000,\n' +
      '      "cashPrice": 45000,\n' +
      '      "pointsValue": 52000,\n' +
      '      "saving": 7000,\n' +
      '      "cardNeeded": "HDFC Infinia",\n' +
      '      "cardId": "hdfc-infinia",\n' +
      '      "transferPartner": "InterMiles",\n' +
      '      "bookingUrl": "https://www.kayak.co.in/flights/BLR-SIN/2026-06-07/2026-06-10",\n' +
      '      "mmtUrl": "https://www.makemytrip.com/...",\n' +
      '      "connectionHub": "Singapore (SIN)",\n' +
      '      "connectionAirline": "Scoot/Air Asia",\n' +
      '      "totalFlightTime": "9h 30m (via SIN)",\n' +
      '      "available": true\n' +
      '    }\n' +
      '  ],\n' +
      '  "hotels": [\n' +
      '    {\n' +
      '      "name": "Marriott Bangkok",\n' +
      '      "chain": "Marriott",\n' +
      '      "pointsNeeded": 60000,\n' +
      '      "cashPrice": 40000,\n' +
      '      "pointsValue": 43000,\n' +
      '      "saving": 3000,\n' +
      '      "cardNeeded": "HDFC Infinia",\n' +
      '      "cardId": "hdfc-infinia",\n' +
      '      "nights": 5,\n' +
      '      "available": true\n' +
      '    }\n' +
      '  ]\n' +
      '}'

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
