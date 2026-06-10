import { NextRequest, NextResponse } from 'next/server'
import { retrieveRelevantCards, buildRagSystemPrompt } from '@/lib/rag'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Seats.aero Pro API — live award seat availability
const SEATS_BASE = 'https://seats.aero/partnerapi'

// Map common city names / IATA codes
const CITY_TO_IATA: Record<string, string> = {
  mumbai: 'BOM', delhi: 'DEL', bangalore: 'BLR', bengaluru: 'BLR',
  chennai: 'MAA', hyderabad: 'HYD', kolkata: 'CCU', pune: 'PNQ',
  ahmedabad: 'AMD', goa: 'GOI', kochi: 'COK', jaipur: 'JAI',
  bangkok: 'BKK', singapore: 'SIN', dubai: 'DXB', london: 'LHR',
  paris: 'CDG', tokyo: 'NRT', 'new york': 'JFK', sydney: 'SYD',
  hongkong: 'HKG', 'hong kong': 'HKG', bali: 'DPS', phuket: 'HKT',
  kualalumpur: 'KUL', 'kuala lumpur': 'KUL', doha: 'DOH', abu dhabi: 'AUH',
  amsterdam: 'AMS', frankfurt: 'FRA', toronto: 'YYZ', milan: 'MXP',
  rome: 'FCO', barcelona: 'BCN', zurich: 'ZRH', vienna: 'VIE',
}

// Map airline names to Seats.aero program slugs
const AIRLINE_TO_PROGRAM: Record<string, string> = {
  'air india': 'air-india',
  'vistara': 'air-india', // merged
  'indigo': 'indigo',
  'singapore airlines': 'krisflyer',
  'krisflyer': 'krisflyer',
  'cathay': 'asia-miles',
  'cathay pacific': 'asia-miles',
  'emirates': 'emirates',
  'etihad': 'etihad',
  'qatar': 'qatar',
  'lufthansa': 'miles-and-more',
  'british airways': 'avios',
  'avios': 'avios',
  'aeroplan': 'aeroplan',
  'air canada': 'aeroplan',
  'united': 'mileageplus',
  'delta': 'skymiles',
  'american': 'aadvantage',
}

function extractIata(text: string): string | null {
  const lower = text.toLowerCase()
  for (const [city, code] of Object.entries(CITY_TO_IATA)) {
    if (lower.includes(city)) return code
  }
  // Try direct IATA code (3 capital letters)
  const match = text.match(/([A-Z]{3})/)
  return match ? match[1] : null
}

function extractProgram(text: string): string | null {
  const lower = text.toLowerCase()
  for (const [airline, program] of Object.entries(AIRLINE_TO_PROGRAM)) {
    if (lower.includes(airline)) return program
  }
  return null
}

function extractCabin(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('business') || lower.includes('biz')) return 'business'
  if (lower.includes('first')) return 'first'
  return 'economy'
}

async function searchLiveAvailability(
  origin: string,
  destination: string,
  program: string | null,
  cabin: string,
  apiKey: string
): Promise<any[]> {
  try {
    // Search for availability
    const params = new URLSearchParams({
      origin_airport: origin,
      destination_airport: destination,
      cabin: cabin,
      ...(program ? { program_filter: program } : {}),
    })
    const res = await fetch(`${SEATS_BASE}/availability?${params}`, {
      headers: {
        'Partner-Authorization': apiKey,
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) {
      console.error('Seats.aero error:', res.status, await res.text())
      return []
    }
    const data = await res.json()
    return (data.data || data.availability || []).slice(0, 8)
  } catch (e) {
    console.error('Seats.aero fetch error:', e)
    return []
  }
}

function formatAvailability(results: any[], origin: string, dest: string, cabin: string): string {
  if (!results.length) {
    return `No live award availability found for ${origin}→${dest} in ${cabin} class right now. Availability changes hourly — try checking directly on the airline's award booking portal.`
  }

  const lines = [`**Live award availability: ${origin} → ${dest} (${cabin.toUpperCase()})**
`]

  for (const r of results.slice(0, 5)) {
    const date = r.date || r.departure_date || 'TBD'
    const airline = r.airline || r.carrier || r.program || ''
    const miles = r.mileage_cost || r.points || r.cost || ''
    const tax = r.taxes_usd ? `+ $${r.taxes_usd} tax` : ''
    const seats = r.seats || r.available_seats || ''
    const available = r.available === false ? '❌' : '✅'

    lines.push(`${available} **${date}** — ${airline}${miles ? ` · ${miles.toLocaleString()} miles` : ''}${tax}${seats ? ` · ${seats} seat(s)` : ''}`)
  }

  lines.push(`
*Data from Seats.aero · Updated in real time · Book directly on airline website*`)
  return lines.join('
')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    let message: string
    let history: any[] = []

    if (body.messages && Array.isArray(body.messages)) {
      const msgs = body.messages
      const lastUser = [...msgs].reverse().find((m: any) => m.role === 'user')
      message = lastUser?.content ?? ''
      history = msgs.slice(0, -1)
    } else {
      message = body.message ?? ''
      history = body.history ?? []
    }

    if (!message.trim()) return NextResponse.json({ error: 'Missing message' }, { status: 400 })

    const seatsKey = process.env.SEATS_AERO_API_KEY
    let liveAvailabilityContext = ''

    // Try to extract route and search live availability
    if (seatsKey) {
      const origin = extractIata(message) ||
        (history.length ? extractIata(history.map((m:any) => m.content).join(' ')) : null)

      // Look for destination separately
      const words = message.toLowerCase().split(/\s+/)
      const destIdx = words.findIndex(w => ['to', 'for', 'visit', 'going'].includes(w))
      const destText = destIdx >= 0 ? words.slice(destIdx + 1, destIdx + 4).join(' ') : message
      const destination = extractIata(destText) || extractIata(message)

      const program = extractProgram(message) ||
        (history.length ? extractProgram(history.map((m:any) => m.content).join(' ')) : null)
      const cabin = extractCabin(message)

      if (destination && destination !== origin) {
        const fromIata = origin || 'BOM' // default Mumbai
        console.log(`Seats.aero search: ${fromIata}→${destination} ${program || 'any'} ${cabin}`)
        const results = await searchLiveAvailability(fromIata, destination, program, cabin, seatsKey)
        if (results.length > 0) {
          liveAvailabilityContext = '

LIVE AWARD AVAILABILITY (from Seats.aero right now):
' +
            formatAvailability(results, fromIata, destination, cabin)
        }
      }
    }

    // Get card context
    const { context, devaluations, igInsights } = await retrieveRelevantCards(message, {
      topK: 6,
      intent: 'travel',
    })

    const systemPrompt = buildRagSystemPrompt(context, devaluations, igInsights) +
      liveAvailabilityContext +
      `

You are CreditIQ's Travel AI — helping Indian card holders maximize travel with points.
RULES:
- If LIVE AWARD AVAILABILITY data is present above, lead with it — show actual dates, miles, airlines
- If no live data, give honest estimates with ranges and caveat "verify on airline website"  
- Always recommend the best card for earning/redeeming on this specific route
- Mention transfer partners and ratios when relevant
- Keep responses focused and actionable — specific numbers, not vague advice
- Never hardcode lounge visit counts — say "verify with bank as benefits change"
- Plain text with **bold** for key numbers only`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20000)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: systemPrompt,
        messages: [...history, { role: 'user', content: message }],
      }),
    })

    clearTimeout(timeout)
    const data = await response.json()
    const reply = data.content?.[0]?.text ?? 'Sorry, I could not get a response.'
    return NextResponse.json({ reply, message: reply })

  } catch (err: any) {
    console.error('Travel AI error:', err)
    return NextResponse.json({ error: 'Travel AI failed' }, { status: 500 })
  }
}
