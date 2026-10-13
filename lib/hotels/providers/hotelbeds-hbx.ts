import crypto from 'node:crypto'
import https from 'node:https'
import type { IncomingHttpHeaders } from 'node:http'

export type HbxHotelOffer = {
  id: string
  hotelId: string
  hotelName: string
  chainName: string | null
  stars: number | null
  latitude: number | null
  longitude: number | null
  imageUrl: string | null
  roomName: string | null
  roomType: string | null
  cancellationPolicy: string | null
  mealPlan: string | null
  paymentType: string | null
  currency: string
  totalPrice: number
  basePrice: number | null
  taxesAndFees: number | null
  agentName: string | null
  deeplink: string | null
  source: 'hotelbeds-hbx'
  rateKey: string
  rateType: 'BOOKABLE' | 'RECHECK' | string | null
}

export type HbxHotelPage = {
  offers: HbxHotelOffer[]
  total: number | null
  destinationCode: string
  environment: 'test' | 'production'
  requestId: string | null
}

const DESTINATION_CODES: Record<string, string> = {
  goa: 'GOI',
  panaji: 'GOI',
  mumbai: 'BOM',
  bombay: 'BOM',
  delhi: 'DEL',
  'new delhi': 'DEL',
  bengaluru: 'BLR',
  bangalore: 'BLR',
  chennai: 'MAA',
  hyderabad: 'HYD',
  kolkata: 'CCU',
  pune: 'PNQ',
  jaipur: 'JAI',
  kochi: 'COK',
  cochin: 'COK',
  dubai: 'DXB',
  singapore: 'SIN',
  bangkok: 'BKK',
  london: 'LON',
  paris: 'PAR',
  'new york': 'NYC',
  tokyo: 'TYO',
  'hong kong': 'HKG',
  bali: 'DPS',
  'kuala lumpur': 'KUL',
  doha: 'DOH',
  abu_dhabi: 'AUH',
  'abu dhabi': 'AUH',
}

function env(name: string) {
  return (process.env[name] || '').trim()
}

function pem(name: string) {
  return env(name).replace(/\\n/g, '\n')
}

function environment(): 'test' | 'production' {
  return env('HOTELBEDS_ENV').toLowerCase() === 'production' ? 'production' : 'test'
}

function baseUrl() {
  const override = env('HOTELBEDS_BASE_URL').replace(/\/$/, '')
  if (override) return override
  return environment() === 'production'
    ? 'https://api-mtls.hotelbeds.com'
    : 'https://api-mtls.test.hotelbeds.com'
}

export function hotelbedsConfigured() {
  return Boolean(
    env('HOTELBEDS_API_KEY') &&
    env('HOTELBEDS_SECRET') &&
    pem('HOTELBEDS_CLIENT_CERT_PEM') &&
    pem('HOTELBEDS_CLIENT_KEY_PEM'),
  )
}

export function hotelbedsConfigurationState() {
  return {
    apiKey: Boolean(env('HOTELBEDS_API_KEY')),
    secret: Boolean(env('HOTELBEDS_SECRET')),
    clientCert: Boolean(pem('HOTELBEDS_CLIENT_CERT_PEM')),
    clientKey: Boolean(pem('HOTELBEDS_CLIENT_KEY_PEM')),
    environment: environment(),
  }
}

function signature(timestampSeconds: number) {
  return crypto
    .createHash('sha256')
    .update(`${env('HOTELBEDS_API_KEY')}${env('HOTELBEDS_SECRET')}${timestampSeconds}`)
    .digest('hex')
}

function normalizeDestination(destination: string) {
  const raw = destination.trim()
  if (/^[A-Za-z]{3}$/.test(raw)) return raw.toUpperCase()
  const key = raw.toLowerCase().replace(/\s+/g, ' ')
  return DESTINATION_CODES[key] || null
}

type HbxTransport = (url: string, body: unknown, timeoutMs?: number) => Promise<{ status: number; headers: IncomingHttpHeaders; data: any }>

function requestJson(url: string, body: unknown, timeoutMs = 18_000): Promise<{ status: number; headers: IncomingHttpHeaders; data: any }> {
  return new Promise((resolve, reject) => {
    const timestamp = Math.floor(Date.now() / 1000)
    const parsed = new URL(url)
    const payload = JSON.stringify(body)
    const options: https.RequestOptions = {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: `${parsed.pathname}${parsed.search}`,
      method: 'POST',
      cert: pem('HOTELBEDS_CLIENT_CERT_PEM'),
      key: pem('HOTELBEDS_CLIENT_KEY_PEM'),
      ca: pem('HOTELBEDS_CA_CERT_PEM') || undefined,
      rejectUnauthorized: true,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Api-key': env('HOTELBEDS_API_KEY'),
        'X-Signature': signature(timestamp),
      },
    }

    const req = https.request(options, res => {
      const chunks: Buffer[] = []
      res.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8')
        let data: any = null
        try { data = text ? JSON.parse(text) : null } catch { data = { raw: text } }
        resolve({ status: res.statusCode || 0, headers: res.headers, data })
      })
    })
    req.setTimeout(timeoutMs, () => req.destroy(new Error('HBX Hotelbeds request timed out')))
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

function stars(categoryName: unknown): number | null {
  const match = String(categoryName || '').match(/([1-5])/)
  return match ? Number(match[1]) : null
}

function cancellationText(rate: any): string | null {
  const policies = Array.isArray(rate?.cancellationPolicies) ? rate.cancellationPolicies : []
  if (!policies.length) return rate?.rateClass === 'NRF' ? 'Non-refundable' : null
  const first = policies[0]
  if (first?.from && first?.amount != null) return `Cancellation fee ${first.amount} from ${first.from}`
  return 'Cancellation policy returned by HBX'
}

function normalizeHotel(hotel: any, checkin: string, checkout: string): HbxHotelOffer[] {
  const rooms = Array.isArray(hotel?.rooms) ? hotel.rooms : []
  const candidates = rooms.flatMap((room: any) => {
    const rates = Array.isArray(room?.rates) ? room.rates : []
    return rates.map((rate: any) => ({ room, rate }))
  })
  if (!candidates.length) return []
  candidates.sort((a: any, b: any) => Number(a.rate?.net || Infinity) - Number(b.rate?.net || Infinity))
  const { room, rate } = candidates[0]
  const totalPrice = Number(rate?.net)
  if (!Number.isFinite(totalPrice) || totalPrice <= 0) return []
  const hotelId = String(hotel?.code || '')
  if (!hotelId) return []

  return [{
    id: `hbx:${hotelId}:${rate?.rateKey || `${checkin}:${checkout}`}`,
    hotelId,
    hotelName: String(hotel?.name || `HBX hotel ${hotelId}`),
    chainName: hotel?.chainName ? String(hotel.chainName) : null,
    stars: stars(hotel?.categoryName || hotel?.categoryCode),
    latitude: Number.isFinite(Number(hotel?.latitude)) ? Number(hotel.latitude) : null,
    longitude: Number.isFinite(Number(hotel?.longitude)) ? Number(hotel.longitude) : null,
    imageUrl: null,
    roomName: room?.name ? String(room.name) : null,
    roomType: room?.code ? String(room.code) : null,
    cancellationPolicy: cancellationText(rate),
    mealPlan: rate?.boardName ? String(rate.boardName) : rate?.boardCode ? String(rate.boardCode) : null,
    paymentType: rate?.paymentType ? String(rate.paymentType) : null,
    currency: String(hotel?.currency || rate?.currency || 'EUR'),
    totalPrice,
    basePrice: null,
    taxesAndFees: null,
    agentName: `HBX Hotelbeds ${environment() === 'test' ? 'evaluation' : 'live'}`,
    deeplink: null,
    source: 'hotelbeds-hbx',
    rateKey: String(rate?.rateKey || ''),
    rateType: rate?.rateType ? String(rate.rateType).toUpperCase() : null,
  }]
}

export async function searchHotelbedsHotels(input: {
  destination: string
  checkin: string
  checkout: string
  adults: number
  rooms?: number
  limit?: number
}): Promise<HbxHotelPage> {
  if (!hotelbedsConfigured()) throw new Error('HBX Hotelbeds is not fully configured')
  const destinationCode = normalizeDestination(input.destination)
  if (!destinationCode) throw new Error(`HBX destination code is not mapped for ${input.destination}`)

  const body = {
    stay: { checkIn: input.checkin, checkOut: input.checkout },
    occupancies: [{
      rooms: Math.max(1, input.rooms || 1),
      adults: Math.max(1, input.adults || 1),
      children: 0,
    }],
    destination: { code: destinationCode },
    filter: { maxHotels: Math.max(1, Math.min(50, input.limit || 50)) },
  }

  const result = await requestJson(`${baseUrl()}/hotel-api/1.0/hotels`, body)
  if (result.status < 200 || result.status >= 300) {
    const errorValue = result.data?.error
    const message =
      (typeof errorValue === 'string' ? errorValue : null) ||
      errorValue?.message ||
      errorValue?.code ||
      result.data?.message ||
      (typeof result.data?.raw === 'string' ? result.data.raw.slice(0, 300) : null) ||
      `HTTP ${result.status}`
    throw new Error(`HBX Hotelbeds availability failed: ${message}`)
  }

  const hotels = Array.isArray(result.data?.hotels?.hotels) ? result.data.hotels.hotels : []
  const offers = hotels.flatMap((hotel: any) => normalizeHotel(hotel, input.checkin, input.checkout))
  const total = Number.isFinite(Number(result.data?.hotels?.total)) ? Number(result.data.hotels.total) : null
  const requestId = String(result.headers['x-request-id'] || result.data?.auditData?.processTime || '') || null

  return { offers, total, destinationCode, environment: environment(), requestId }
}


export type HbxTestBookingResult = {
  provider: 'hotelbeds-hbx'
  testMode: true
  bookingReference: string
  status: string | null
  rateKey: string
  rateType: string | null
  totalNet: number | null
  currency: string | null
}

function firstRate(data: any): any | null {
  const hotels = Array.isArray(data?.hotels?.hotels) ? data.hotels.hotels : []
  for (const hotel of hotels) {
    const rooms = Array.isArray(hotel?.rooms) ? hotel.rooms : []
    for (const room of rooms) {
      const rates = Array.isArray(room?.rates) ? room.rates : []
      if (rates[0]) return rates[0]
    }
  }
  return null
}

export async function checkHotelbedsRate(
  rateKey: string,
  transport: HbxTransport = requestJson,
): Promise<{ rateKey: string; rateType: string | null; net: number | null; currency: string | null }> {
  if (!rateKey.trim()) throw new Error('HBX CheckRate requires rateKey')
  const result = await transport(`${baseUrl()}/hotel-api/1.0/checkrates`, {
    rooms: [{ rateKey }],
  })
  if (result.status < 200 || result.status >= 300) {
    const message = result.data?.error?.message || result.data?.error || result.data?.message || `HTTP ${result.status}`
    throw new Error(`HBX CheckRate failed: ${String(message).slice(0, 260)}`)
  }
  const rate = firstRate(result.data)
  if (!rate?.rateKey) throw new Error('HBX CheckRate returned no bookable rateKey')
  return {
    rateKey: String(rate.rateKey),
    rateType: rate?.rateType ? String(rate.rateType).toUpperCase() : null,
    net: Number.isFinite(Number(rate?.net)) ? Number(rate.net) : null,
    currency: rate?.currency ? String(rate.currency) : null,
  }
}

export async function bookHotelbedsTestRate(
  input: {
    rateKey: string
    rateType?: string | null
    holder: { firstName: string; lastName: string }
    adults?: number
    clientReference: string
    tolerance?: number
  },
  transport: HbxTransport = requestJson,
): Promise<HbxTestBookingResult> {
  if (environment() !== 'test') throw new Error('HBX TEST booking adapter refuses production environment')
  if (!input.rateKey.trim()) throw new Error('HBX TEST booking requires rateKey')
  if (!input.holder.firstName.trim() || !input.holder.lastName.trim()) throw new Error('HBX TEST booking requires holder name')

  let rateKey = input.rateKey
  let rateType = input.rateType ? input.rateType.toUpperCase() : null
  let checkedNet: number | null = null
  let checkedCurrency: string | null = null

  if (rateType === 'RECHECK') {
    const checked = await checkHotelbedsRate(rateKey, transport)
    rateKey = checked.rateKey
    rateType = checked.rateType
    checkedNet = checked.net
    checkedCurrency = checked.currency
  }

  if (rateType === 'RECHECK') throw new Error('HBX CheckRate did not return a BOOKABLE rate')

  const adults = Math.max(1, Math.min(9, Number.isSafeInteger(input.adults) ? input.adults! : 1))
  const paxes = Array.from({ length: adults }, (_, index) => ({
    roomId: 1,
    type: 'AD',
    name: index === 0 ? input.holder.firstName.trim() : `Test${index + 1}`,
    surname: input.holder.lastName.trim(),
  }))

  // HBX recommends allowing at least 60 seconds for booking confirmation.
  const result = await transport(`${baseUrl()}/hotel-api/1.0/bookings`, {
    holder: {
      name: input.holder.firstName.trim(),
      surname: input.holder.lastName.trim(),
    },
    rooms: [{ rateKey, paxes }],
    clientReference: input.clientReference.slice(0, 20),
    remark: 'CreditIQ provider acceptance test',
    tolerance: input.tolerance ?? 2,
  }, 65_000)

  if (result.status < 200 || result.status >= 300) {
    const message = result.data?.error?.message || result.data?.error || result.data?.message || `HTTP ${result.status}`
    throw new Error(`HBX TEST booking failed: ${String(message).slice(0, 260)}`)
  }

  const booking = result.data?.booking
  const reference = booking?.reference
  if (!reference) throw new Error('HBX TEST booking response did not include booking reference')

  return {
    provider: 'hotelbeds-hbx',
    testMode: true,
    bookingReference: String(reference),
    status: booking?.status ? String(booking.status) : null,
    rateKey,
    rateType,
    totalNet: Number.isFinite(Number(booking?.totalNet)) ? Number(booking.totalNet) : checkedNet,
    currency: booking?.currency ? String(booking.currency) : checkedCurrency,
  }
}
