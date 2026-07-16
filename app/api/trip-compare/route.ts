import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Known Indian aviation price ranges (verified market data, updated May 2026)
// These are realistic ranges, not exact prices  --  Claude picks within range
const FLIGHT_PRICE_RANGES: Record<string, { economy: [number,number], business: [number,number] }> = {
  'GOA':  { economy: [3500, 7000],   business: [18000, 35000] },
  'DEL':  { economy: [3000, 6500],   business: [15000, 30000] },
  'BOM':  { economy: [2500, 5500],   business: [12000, 28000] },
  'HYD':  { economy: [2000, 5000],   business: [10000, 22000] },
  'MAA':  { economy: [2000, 4500],   business: [10000, 20000] },
  'CCU':  { economy: [3500, 7000],   business: [16000, 32000] },
  'COK':  { economy: [2500, 5500],   business: [12000, 24000] },
  'BLR':  { economy: [2500, 5500],   business: [12000, 25000] },
  'DXB':  { economy: [12000, 28000], business: [55000, 120000] },
  'SIN':  { economy: [15000, 35000], business: [65000, 140000] },
  'BKK':  { economy: [14000, 30000], business: [60000, 130000] },
  'LHR':  { economy: [35000, 75000], business: [150000, 350000] },
  'JFK':  { economy: [40000, 85000], business: [180000, 400000] },
  'default': { economy: [5000, 15000], business: [25000, 80000] },
}

// Known hotel price ranges by destination (per night, INR)
const HOTEL_PRICE_RANGES: Record<string, { budget: [number,number], mid: [number,number], luxury: [number,number] }> = {
  'GOA':     { budget: [1500, 3000], mid: [3000, 8000],   luxury: [8000, 25000] },
  'DEL':     { budget: [1500, 3000], mid: [3500, 9000],   luxury: [9000, 30000] },
  'BOM':     { budget: [2000, 4000], mid: [4000, 10000],  luxury: [10000, 35000] },
  'BLR':     { budget: [1500, 3000], mid: [3000, 8000],   luxury: [8000, 25000] },
  'DXB':     { budget: [5000, 9000], mid: [9000, 20000],  luxury: [20000, 60000] },
  'SIN':     { budget: [6000, 10000],mid: [10000, 22000], luxury: [22000, 70000] },
  'BKK':     { budget: [2000, 4000], mid: [4000, 12000],  luxury: [12000, 40000] },
  'LHR':     { budget: [8000, 15000],mid: [15000, 35000], luxury: [35000, 100000] },
  'default': { budget: [2000, 5000], mid: [5000, 12000],  luxury: [12000, 40000] },
}

// City/name -> IATA resolver (superset of the per-builder maps below). Used to
// query the live cached-fare endpoint. 'GOA' is not a valid airport code (Goa = GOI).
const CITY_IATA: Record<string, string> = {
  'bangalore': 'BLR', 'bengaluru': 'BLR', 'mumbai': 'BOM', 'delhi': 'DEL',
  'hyderabad': 'HYD', 'chennai': 'MAA', 'kolkata': 'CCU', 'pune': 'PNQ',
  'goa': 'GOI', 'jaipur': 'JAI', 'kochi': 'COK', 'ahmedabad': 'AMD',
  'dubai': 'DXB', 'singapore': 'SIN', 'bangkok': 'BKK', 'london': 'LHR',
  'new york': 'JFK', 'tokyo': 'NRT', 'paris': 'CDG', 'sydney': 'SYD',
  'bali': 'DPS', 'denpasar': 'DPS', 'colombo': 'CMB', 'kuala lumpur': 'KUL',
  'hong kong': 'HKG', 'maldives': 'MLE', 'male': 'MLE', 'abu dhabi': 'AUH',
  'seoul': 'ICN', 'istanbul': 'IST', 'rome': 'FCO', 'phuket': 'HKT', 'kathmandu': 'KTM',
}
function resolveIata(s: string): string {
  const k = (s || '').toLowerCase().trim()
  if (CITY_IATA[k]) return CITY_IATA[k]
  let code = (s || '').toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3)
  if (code === 'GOA') code = 'GOI'
  return code
}

// IATA airline code -> display name (no existing map in the repo to reuse).
const AIRLINE_NAMES: Record<string, string> = {
  '6E': 'IndiGo', 'AI': 'Air India', 'IX': 'Air India Express', 'UK': 'Air India',
  'SG': 'SpiceJet', 'QP': 'Akasa Air', 'I5': 'AIX Connect', 'G8': 'Go First',
  'VN': 'Vietnam Airlines', 'SQ': 'Singapore Airlines', 'TR': 'Scoot', 'AK': 'AirAsia',
  'FD': 'Thai AirAsia', 'EK': 'Emirates', 'FZ': 'flydubai', 'QR': 'Qatar Airways',
  'EY': 'Etihad Airways', 'WY': 'Oman Air', 'GF': 'Gulf Air', 'SV': 'Saudia',
  'TG': 'Thai Airways', 'MH': 'Malaysia Airlines', 'CX': 'Cathay Pacific',
  'BA': 'British Airways', 'LH': 'Lufthansa', 'AF': 'Air France', 'KL': 'KLM',
  'TK': 'Turkish Airlines', 'ET': 'Ethiopian Airlines', 'UL': 'SriLankan Airlines',
  'BG': 'Biman Bangladesh', 'KE': 'Korean Air', 'OZ': 'Asiana Airlines',
  'NH': 'ANA', 'JL': 'Japan Airlines', 'QF': 'Qantas', 'VS': 'Virgin Atlantic',
  'AA': 'American Airlines', 'UA': 'United Airlines', 'DL': 'Delta Air Lines',
}
function airlineName(code: string): string {
  const c = (code || '').toUpperCase()
  return AIRLINE_NAMES[c] || (c ? `Airline ${c}` : 'Airline')
}

function getFlightRange(dest: string, cls: string): [number, number] {
  const code = dest.toUpperCase().substring(0, 3)
  const ranges = FLIGHT_PRICE_RANGES[code] || FLIGHT_PRICE_RANGES['default']
  return cls.toLowerCase().includes('business') ? ranges.business : ranges.economy
}

function getHotelRange(dest: string, tier: string): [number, number] {
  const code = dest.toUpperCase().substring(0, 3)
  const ranges = HOTEL_PRICE_RANGES[code] || HOTEL_PRICE_RANGES['default']
  if (tier === 'luxury') return ranges.luxury
  if (tier === 'budget') return ranges.budget
  return ranges.mid
}

function buildKayakUrl(origin: string, dest: string, depDate: string, retDate: string, cabin: string): string {
  // Kayak India deep link with pre-filled search
  const CITY_IATA: Record<string, string> = {
    'bangalore': 'BLR', 'bengaluru': 'BLR', 'mumbai': 'BOM', 'delhi': 'DEL',
    'hyderabad': 'HYD', 'chennai': 'MAA', 'kolkata': 'CCU', 'pune': 'PNQ',
    'goa': 'GOI', 'jaipur': 'JAI', 'kochi': 'COK', 'ahmedabad': 'AMD',
    'dubai': 'DXB', 'singapore': 'SIN', 'bangkok': 'BKK', 'london': 'LHR',
    'new york': 'JFK', 'tokyo': 'NRT', 'paris': 'CDG', 'sydney': 'SYD',
  }
  const o = CITY_IATA[origin.toLowerCase()] || origin.toUpperCase().substring(0,3)
  const d = CITY_IATA[dest.toLowerCase()] || dest.toUpperCase().substring(0,3)
  const dep = depDate || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
  const ret = retDate || new Date(Date.now() + 37*24*60*60*1000).toISOString().split('T')[0]
  // Kayak deep link format
  return `https://www.kayak.co.in/flights/${o}-${d}/${dep}/${ret}?cabin=${cabin.toLowerCase().includes('business') ? 'business' : 'economy'}`
}

function buildBookingUrl(dest: string, checkin: string, checkout: string): string {
  const destEnc = encodeURIComponent(dest)
  const cin = checkin || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
  const cout = checkout || new Date(Date.now() + 33*24*60*60*1000).toISOString().split('T')[0]
  // Booking.com affiliate deep link with pre-filled destination + dates
  return `https://www.booking.com/searchresults.html?ss=${destEnc}&checkin=${cin}&checkout=${cout}&group_adults=2&no_rooms=1&aid=2311236`
}

function buildMmtFlightUrl(origin: string, dest: string): string {
  const CITY_MMT: Record<string, string> = {
    'bangalore': 'BLR', 'bengaluru': 'BLR', 'mumbai': 'BOM', 'delhi': 'DEL',
    'hyderabad': 'HYD', 'chennai': 'MAA', 'kolkata': 'CCU', 'goa': 'GOI',
    'jaipur': 'JAI', 'kochi': 'COK', 'pune': 'PNQ', 'ahmedabad': 'AMD',
  }
  const o = CITY_MMT[origin.toLowerCase()] || 'BLR'
  const d = CITY_MMT[dest.toLowerCase()] || dest.toUpperCase().substring(0,3)
  const dep = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0].replace(/-/g,'')
  // MMT affiliate deep link with pre-filled origin/dest
  return `https://www.makemytrip.com/flights/domestic/?tripType=R&itinerary=${o}-${d}-${dep}&paxType=A-1_C-0_I-0&cabinClass=E&sTime=${Date.now()}&forwardFlowRequired=true&utm_source=CreditIQ`
}

function buildMmtHotelUrl(dest: string): string {
  return `https://bitli.in/VrZOzeR`
}

function buildEasemytripUrl(origin: string, dest: string): string {
  const CITY: Record<string, string> = {
    'bangalore': 'BLR', 'bengaluru': 'BLR', 'mumbai': 'BOM', 'delhi': 'DEL',
    'hyderabad': 'HYD', 'chennai': 'MAA', 'goa': 'GOI', 'jaipur': 'JAI',
    'kochi': 'COK', 'pune': 'PNQ', 'kolkata': 'CCU', 'ahmedabad': 'AMD',
  }
  const o = CITY[origin.toLowerCase()] || 'BLR'
  const d = CITY[dest.toLowerCase()] || dest.toUpperCase().substring(0,3)
  const dep = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
  const ret = new Date(Date.now() + 33*24*60*60*1000).toISOString().split('T')[0]
  // TODO: replace with affiliate tracking ID when approved at partners.easemytrip.com
  return `https://www.easemytrip.com/flight/search?origin=${o}&dest=${d}&depDate=${dep}&retDate=${ret}&pax=1-0-0&class=E&tripMode=R`
}

function buildGoibiboUrl(origin: string, dest: string): string {
  const CITY: Record<string, string> = {
    'bangalore': 'BLR', 'bengaluru': 'BLR', 'mumbai': 'BOM', 'delhi': 'DEL',
    'hyderabad': 'HYD', 'chennai': 'MAA', 'goa': 'GOI', 'jaipur': 'JAI',
    'kochi': 'COK', 'pune': 'PNQ', 'kolkata': 'CCU', 'ahmedabad': 'AMD',
  }
  const o = CITY[origin.toLowerCase()] || 'BLR'
  const d = CITY[dest.toLowerCase()] || dest.toUpperCase().substring(0,3)
  const dep = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0].replace(/-/g,'')
  // TODO: replace with affiliate tracking ID when approved at goibibo.com/affiliate
  return `https://www.goibibo.com/flights/search/?travelType=R&from=${o}&to=${d}&depart=${dep}&adults=1&children=0&infants=0&class=E&source=metasearch`
}

export async function POST(req: NextRequest) {
  try {
    const {
      destination, origin = 'Bangalore', nights = 3, cabin = 'economy',
      departDate, returnDate, userPoints = 0, cardBank = 'HDFC', budget = 'mid',
      tripQuery
    } = await req.json()

    if (!destination) return NextResponse.json({ error: 'destination required' }, { status: 400 })

    const flightRange = getFlightRange(destination, cabin)
    const hotelRange = getHotelRange(destination, budget)
    const kayakUrl = buildKayakUrl(origin, destination, departDate, returnDate, cabin)
    const bookingUrl = buildBookingUrl(destination, departDate, returnDate)
    const mmtFlightUrl = buildMmtFlightUrl(origin, destination)
    const mmtHotelUrl = buildMmtHotelUrl(destination)
    const googleFlightsUrl = `https://www.google.com/flights?q=flights+from+${encodeURIComponent(origin)}+to+${encodeURIComponent(destination)}`

    // Points transfer rates per bank (realistic values)
    const TRANSFER_PARTNERS: Record<string, { partner: string; ratio: number; program: string }[]> = {
      'HDFC':   [{ partner: 'InterMiles', ratio: 1.0, program: 'intermiles' }, { partner: 'Singapore KrisFlyer', ratio: 1.0, program: 'krisflyer' }],
      'Axis':   [{ partner: 'InterMiles', ratio: 1.0, program: 'intermiles' }],
      'SBI':    [{ partner: 'Air India Flying Returns', ratio: 1.0, program: 'flying-returns' }],
      'ICICI':  [{ partner: 'InterMiles', ratio: 1.0, program: 'intermiles' }],
      'Amex':   [{ partner: 'Singapore KrisFlyer', ratio: 1.0, program: 'krisflyer' }, { partner: 'Marriott Bonvoy', ratio: 1.0, program: 'marriott' }],
      'default':[{ partner: 'InterMiles', ratio: 1.0, program: 'intermiles' }],
    }

    const bank = cardBank || 'HDFC'
    const partners = TRANSFER_PARTNERS[bank] || TRANSFER_PARTNERS['default']
    const primaryPartner = partners[0]

    // Points needed for flight (approx 1pt = Re.0.35 for flights via transfer)
    const flightMid = Math.round((flightRange[0] + flightRange[1]) / 2)
    const flightPtsNeeded = Math.round(flightMid / 0.35)
    const canAffordFlight = userPoints >= flightPtsNeeded

    // Hotel points (Marriott approx 1pt = Re.0.6)
    const hotelMid = Math.round((hotelRange[0] + hotelRange[1]) / 2)
    const hotelPtsPerNight = Math.round(hotelMid / 0.6)

    const prompt = `You are a travel price intelligence engine. Generate realistic flight and hotel comparison data for this trip.

TRIP: ${origin} to ${destination}
NIGHTS: ${nights}
CABIN: ${cabin}
BUDGET TIER: ${budget}
USER POINTS: ${userPoints} (${bank} bank)
PRIMARY TRANSFER PARTNER: ${primaryPartner.partner}

PRICE CONSTRAINTS (use values WITHIN these ranges only  --  do not go outside):
- Flight one-way economy: Rs.${flightRange[0].toLocaleString('en-IN')} to Rs.${flightRange[1].toLocaleString('en-IN')}
- Hotel per night: Rs.${hotelRange[0].toLocaleString('en-IN')} to Rs.${hotelRange[1].toLocaleString('en-IN')}
- Points for flight return: ${Math.round(flightPtsNeeded * 0.8).toLocaleString()} to ${Math.round(flightPtsNeeded * 1.3).toLocaleString()} points
- User can afford flight with points: ${canAffordFlight}

RULES:
1. Generate EXACTLY 3 flight options and EXACTLY 3 hotel options
2. Rank by VALUE = savings + points efficiency, not just cheapest price
3. Flight 1 = best value (uses points if user has enough), Flight 2 = best price, Flight 3 = premium option
4. Hotel 1 = best value for money, Hotel 2 = luxury/points option, Hotel 3 = budget
5. Use REAL airline names for ${origin}-${destination} route (IndiGo, Air India, SpiceJet, Akasa Air. NEVER use Vistara - merged into Air India Nov 2024)
6. Use REAL hotel chains for ${destination}
7. points_saving = what user saves by using points vs cash (e.g. if flight costs Rs.5000 cash and 12000 pts, saving = Rs.5000 - (12000 * 0.35) = Rs.800)
8. Every cashPrice MUST be within the price constraint ranges above
9. NEVER invent airlines that don't fly this route

Respond ONLY with valid JSON:
{
  "origin": "${origin}",
  "destination": "${destination}",
  "nights": ${nights},
  "cabin": "${cabin}",
  "priceNote": "Estimated ranges based on typical fares. Click to see live rates.",
  "flights": [
    {
      "rank": 1,
      "badge": "Best value",
      "airline": "IndiGo",
      "flightNo": "6E-501",
      "departure": "06:15",
      "arrival": "07:30",
      "duration": "1h 15m",
      "stops": 0,
      "cashPriceMin": 4200,
      "cashPriceMax": 5800,
      "cashPriceMid": 5000,
      "pointsOption": true,
      "pointsNeeded": 14000,
      "pointsPartner": "${primaryPartner.partner}",
      "pointsSaving": 1800,
      "canAfford": ${canAffordFlight},
      "bookingPlatforms": ["Kayak", "MakeMyTrip", "Google Flights"],
      "whyBest": "Cheapest non-stop with points redemption option"
    }
  ],
  "hotels": [
    {
      "rank": 1,
      "badge": "Best value",
      "name": "Hotel Name",
      "chain": "Chain Name",
      "stars": 4,
      "area": "Beach area name",
      "includes": "Breakfast included",
      "cashPricePerNight": 3500,
      "cashPriceTotal": 10500,
      "pointsOption": false,
      "pointsPerNight": 0,
      "pointsPartner": "",
      "bookingPlatforms": ["Booking.com", "MakeMyTrip Hotels"],
      "whyBest": "Best price-quality ratio with beach access"
    }
  ],
  "tripSummary": {
    "cheapestTotal": 15000,
    "bestValueTotal": 18000,
    "pointsCoveragePercent": 65,
    "recommendedStrategy": "Use HDFC points for flight via InterMiles, pay cash for mid-range hotel"
  }
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''
    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(clean)

    // Fetch the REAL cheapest cached fare (Travelpayouts) for the #1 card. No date
    // param — the cache is date-sparse, so pinning an exact day usually returns [].
    const originIata = resolveIata(origin)
    let destIata = resolveIata(destination)
    if (destIata === 'GOA') destIata = 'GOI'
    let liveFare: {
      price: number; airlineCode: string; airlineName: string;
      flightNumber: string | null; sampleDate: string | null;
      source: 'travelpayouts'; bookingLink: string;
    } | null = null
    try {
      const base = new URL(req.url).origin
      const fr = await fetch(`${base}/api/flights/cheapest?origin=${originIata}&destination=${destIata}`, { cache: 'no-store' })
      if (fr.ok) {
        const fj = await fr.json()
        const destObj = fj?.data?.[destIata]
        const first = destObj && typeof destObj === 'object' ? (Object.values(destObj)[0] as any) : null
        if (first && Number(first.price) > 0) {
          const tpMarker = process.env.TRAVELPAYOUTS_MARKER || ''
          const code = String(first.airline || '').toUpperCase()
          liveFare = {
            price: Math.round(Number(first.price)), // ROUND-TRIP already — do not double
            airlineCode: code,
            airlineName: airlineName(code),
            flightNumber: first.flight_number != null ? `${code}-${first.flight_number}` : null,
            sampleDate: String(first.departure_at || '').slice(0, 10) || null,
            source: 'travelpayouts',
            bookingLink: `https://www.aviasales.com/search/${originIata}${destIata}1${tpMarker ? `?marker=${tpMarker}` : ''}`,
          }
        }
      }
    } catch (e) {
      console.error('trip-compare live fare fetch failed:', e)
    }

    const flightUrls = {
      kayak: kayakUrl,
      mmt: mmtFlightUrl,
      googleFlights: googleFlightsUrl,
      easemytrip: buildEasemytripUrl(origin, destination),
      goibibo: buildGoibiboUrl(origin, destination),
    }

    // #1 card becomes the real cached fare; every other card stays estimated and
    // must NOT carry an invented flight number or specific clock times.
    const flights = (parsed.flights || []).map((f: any, i: number) => {
      if (i === 0 && liveFare) {
        return {
          ...f,
          dataSource: 'live',
          airline: liveFare.airlineName,
          airlineCode: liveFare.airlineCode,
          flightNo: liveFare.flightNumber,
          departure: null,
          arrival: null,
          cashPriceMin: liveFare.price,
          cashPriceMax: liveFare.price,
          cashPriceMid: liveFare.price,
          pointsSaving: 0, // LLM saving was derived from an invented cash price
          sampleDate: liveFare.sampleDate,
          source: liveFare.source,
          liveBookingLink: liveFare.bookingLink,
          urls: flightUrls,
        }
      }
      return {
        ...f,
        dataSource: 'estimated',
        flightNo: null,
        departure: null,
        arrival: null,
        urls: flightUrls,
      }
    })

    // Ground "cheapest total" in the real fare: real round-trip flight + cheapest
    // (still-estimated) hotel total for the stay. bestValueTotal stays LLM-estimated.
    let tripSummary = parsed.tripSummary
    if (liveFare && tripSummary) {
      const hotelTotals = (parsed.hotels || [])
        .map((h: any) => Number(h.cashPriceTotal))
        .filter((n: number) => Number.isFinite(n) && n > 0)
      const cheapestHotel = hotelTotals.length ? Math.min(...hotelTotals) : 0
      tripSummary = { ...tripSummary, cheapestTotal: liveFare.price + cheapestHotel }
    }

    const result = {
      ...parsed,
      liveFare,
      flights,
      tripSummary,
      hotels: (parsed.hotels || []).map((h: any) => ({
        ...h,
        urls: {
          booking: bookingUrl,
          mmt: mmtHotelUrl,
        }
      })),
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Trip compare error:', err)
    return NextResponse.json({ error: 'Comparison failed' }, { status: 500 })
  }
}
