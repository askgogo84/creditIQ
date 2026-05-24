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

    const userPrompt = 'Plan a trip and recommend the best credit cards to maximize value.\n\n' +
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
      '      "bookingUrl": "https://intermiles.com",\n' +
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
