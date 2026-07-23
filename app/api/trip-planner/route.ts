import { NextRequest, NextResponse } from 'next/server'
import { retrieveRelevantCards, buildRagSystemPrompt } from '@/lib/rag'
import { callClaude, MODELS } from '@/lib/ai'
import { rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

// Nuclear Vistara strip — runs on the entire JSON string before parse
function normalizeDestination(query: string): string {
  const q = query.toLowerCase()
  const aliases: Record<string, string> = {
    'nagkok': 'bangkok', 'bangok': 'bangkok', 'bangkock': 'bangkok',
    'singapor': 'singapore', 'singapur': 'singapore',
    'dubay': 'dubai', 'tokio': 'tokyo', 'sydeny': 'sydney',
  }
  for (const [typo, correct] of Object.entries(aliases)) {
    if (q.includes(typo)) return q.replace(typo, correct)
  }
  return q
}

function stripVistara(raw: string): string {
  return raw
    .replace(/Vistara/gi, 'Air India')
    .replace(/\bUK-\d+\b/g, 'AI')
}


export async function POST(req: NextRequest) {
  try {
    const rl = await rateLimit(req, 'trip-planner')
    if (!rl.ok) return rl.res

    const { query, userPoints, cardBank, destination, origin, travelers, budget } = await req.json()
    const rawQuery = query || ('travel to ' + (destination || 'unknown'))
    const tripQuery = normalizeDestination(rawQuery)
    if (!tripQuery.trim()) return NextResponse.json({ error: 'Missing trip query' }, { status: 400 })

    const { context, devaluations, igInsights } = await retrieveRelevantCards(tripQuery, { topK: 8, intent: 'travel' })
    const systemPrompt = buildRagSystemPrompt(context, devaluations, igInsights)

    // Pre-fetch real award availability from seats.aero
    const originCode = (!origin || origin === 'Bangalore') ? 'BLR' : origin.slice(0, 3).toUpperCase()
    const DEST_CODES: Record<string, string> = {
      'bali': 'DPS', 'singapore': 'SIN', 'bangkok': 'BKK', 'dubai': 'DXB',
      'london': 'LHR', 'tokyo': 'NRT', 'paris': 'CDG', 'sydney': 'SYD',
      'maldives': 'MLE', 'colombo': 'CMB', 'kuala lumpur': 'KUL', 'hong kong': 'HKG',
      'goa': 'GOI', 'mumbai': 'BOM', 'delhi': 'DEL', 'chennai': 'MAA',
      'phuket': 'HKT', 'kathmandu': 'KTM', 'new york': 'JFK',
    }
        const queryLower = tripQuery.toLowerCase()
    const resolvedDest = Object.entries(DEST_CODES).find(([k]) => queryLower.includes(k))?.[1] 
      || DEST_CODES[(destination || '').toLowerCase()] 
      || 'SIN'
    const searchStart = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
    const searchEnd = new Date(Date.now() + 60*24*60*60*1000).toISOString().split('T')[0]
    let liveAvailability = ''
    try {
      const apiKey = process.env.SEATS_AERO_API_KEY
      if (apiKey) {
        const leg1 = resolvedDest === 'DPS' ? 'SIN' : resolvedDest
        const r1 = await fetch(`https://seats.aero/partnerapi/search?origin_airport=${originCode}&destination_airport=${leg1}&start_date=${searchStart}&end_date=${searchEnd}&sources=singapore&take=5&order_by=lowest_mileage`, {
          headers: { 'Partner-Authorization': apiKey }
        })
        if (r1.ok) {
          const d1 = await r1.json()
          const best = (d1.data || []).find((x: any) => x.JAvailable && parseInt(x.JMileageCost) > 0)
          if (best) liveAvailability += `LIVE DATA (seats.aero) ${originCode}?${leg1} Business KrisFlyer: ${best.JMileageCost} miles, ${best.JRemainingSeats} seats, airlines: ${best.JAirlines}. `
        }
        if (resolvedDest === 'DPS') {
          const r2 = await fetch(`https://seats.aero/partnerapi/search?origin_airport=SIN&destination_airport=DPS&start_date=${searchStart}&end_date=${searchEnd}&take=5&order_by=lowest_mileage`, {
            headers: { 'Partner-Authorization': apiKey }
          })
          if (r2.ok) {
            const d2 = await r2.json()
            const best2 = (d2.data || []).find((x: any) => x.JAvailable && parseInt(x.JMileageCost) > 0)
            if (best2) liveAvailability += `LIVE DATA (seats.aero) SIN?DPS Business: ${best2.JMileageCost} miles, ${best2.JRemainingSeats} seats, airlines: ${best2.JAirlines}. `
          }
        }
      }
    } catch (e) { console.error("seats.aero fetch error:", e) }

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

${liveAvailability ? `REAL-TIME AVAILABILITY FROM seats.aero (use these exact numbers, do not estimate):\n${liveAvailability}\n` : ""}CRITICAL ACCURACY RULES — follow strictly:
1. VISTARA DOES NOT EXIST � permanently merged into Air India on November 12, 2024. NEVER show Vistara, UK flight codes, or IndiGo 6E for international routes. If you are about to write "Vistara" anywhere in your response, replace it with "Air India" instead.
2. NO DIRECT INDIA→BALI flights. BLR-DPS route = BLR→SIN→DPS via Singapore Airlines (SQ), Scoot (TR), or Air Asia (AK).
3. NO DIRECT INDIA→SYDNEY. Route = via Singapore (SIN).
4. NO DIRECT INDIA→TOKYO. Route = via Singapore or direct Air India DEL-NRT.
5. NEVER invent flight numbers. NEVER use UK- prefix codes (those were Vistara which no longer exists). Only state airline name.
6. NEVER invent specific prices — give realistic RANGES based on seasonal norms.
7. Points values: HDFC→KrisFlyer 1:1. BLR-SIN Business = ~42,500 KrisFlyer miles one-way. BLR-SIN-DPS Business = ~67,500 KrisFlyer miles total. BLR-SIN Economy = ~17,500 KrisFlyer miles.
8. Air India Flying Returns is the correct programme post-Vistara merger.
9. InterMiles is DISCONTINUED as a flight programme (retail-voucher rewards only as of 2026) — NEVER recommend InterMiles for any flight redemption or points transfer. IndiGo's own programme is 6E Rewards (NOT InterMiles); for domestic/short-haul redemptions use Air India Flying Returns or the card's own points portal.
10. All dates must be REAL future dates based on TODAY = ${todayStr}.
11. FOR DOMESTIC INDIA ROUTES (BLR-GOA, BLR-DEL, BLR-BOM etc): Use ONLY IndiGo, Air India, SpiceJet, Akasa Air. NEVER Vistara for any route.
12. SELF-CHECK before responding: Search your response for "Vistara" or "UK-" — if found, replace with "Air India" or "IndiGo" immediately.

VERIFIED TRANSFER PORTAL URLS (use these exact URLs, never invent others):
- HDFC SmartBuy (points transfer): https://offers.smartbuy.hdfcbank.com
- KrisFlyer redemption: https://www.singaporeair.com/en_UK/in/plan-travel/book-flights/
- Air India Flying Returns: https://www.airindia.com/in/en/flying-returns.html
- Axis EDGE Miles: https://travel.axisbank.co.in

AWARD RATES (use community intelligence sweet spots above when available, otherwise use these baselines — prefer creator-found rates over these):
- BLR→SIN Economy (KrisFlyer): 17,500 miles one-way
- BLR→SIN Business (KrisFlyer): 42,500 miles one-way  
- SIN→DPS Economy (KrisFlyer): 12,500 miles one-way
- SIN→DPS Business (KrisFlyer): 25,000 miles one-way
- BLR→DXB Economy (Air India Flying Returns): 20,000 miles one-way
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

    const ai = await callClaude({
      model: MODELS.opus,
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })
    if (!ai.ok) {
      return NextResponse.json({ ok: false, reason: ai.reason }, { status: ai.status })
    }

    const clean = ai.text.replace(/```json/g, '').replace(/```/g, '').trim()
    // Nuclear strip on raw string BEFORE parse — catches every field
    const sanitized = stripVistara(clean)
    let parsed: any
    try {
      parsed = JSON.parse(sanitized)
    } catch {
      return NextResponse.json({ ok: false, reason: 'ai_bad_response' }, { status: 502 })
    }

    // Field-level strip as secondary safety net
    const vr = (s: string) => s?.replace(/Vistara/gi, 'Air India').replace(/\bUK-\d+\b/g, 'AI') ?? s
    if (parsed.flights) {
      parsed.flights = parsed.flights.map((f: any) => ({
        ...f,
        airline: vr(f.airline),
        option: vr(f.option),
        connectionAirline: vr(f.connectionAirline),
      }))
    }
    if (parsed.summary) parsed.summary = vr(parsed.summary)
    if (parsed.proTip) parsed.proTip = vr(parsed.proTip)

    // Domestic route airline validation
    const domesticDests = ['GOI','BOM','DEL','MAA','CCU','HYD','COK','AMD','PNQ']
    const validDomestic = ['IndiGo','Air India','SpiceJet','Akasa Air','GoFirst','StarAir']
    if (parsed.flights && domesticDests.includes(resolvedDest)) {
      parsed.flights = parsed.flights.map((f: any) => ({
        ...f,
        airline: validDomestic.some(a => f.airline?.includes(a)) ? f.airline : 'IndiGo',
        connectionAirline: vr(f.connectionAirline),
      }))
    }
    return NextResponse.json(parsed)
  } catch (err: any) {
    console.error('Trip planner error:', err)
    return NextResponse.json({ error: 'Trip planning failed', detail: err?.message || String(err) }, { status: 500 })
  }
}
