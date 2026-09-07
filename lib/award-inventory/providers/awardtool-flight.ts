import type { FlightAwardOption, FlightAwardProvider, FlightAwardSearchQuery } from '../types'

const BASE_URL = 'https://apisv2.awardtoolapi.com'

// Only map AwardTool programmes that already have a canonical CreditIQ programme
// id today. This keeps live results connected to the wallet/transfer graph instead
// of creating orphan loyalty ids. More AwardTool codes can be added as the
// CreditIQ programme registry grows.
const PROGRAMME_TO_AWARDTOOL: Record<string, string> = {
  'american-aadvantage': 'AA',
  aeroplan: 'AC',
  'british-airways-club': 'BA',
  cathay: 'CX',
  'delta-skymiles': 'DL',
  'emirates-skywards': 'EK',
  'etihad-guest': 'EY',
  'flying-blue': 'KL',
  'qatar-privilege-club': 'QR',
  krisflyer: 'SQ',
  'turkish-miles-smiles': 'TK',
  'united-mileageplus': 'UA',
}

const AWARDTOOL_TO_PROGRAMME: Record<string, string> = Object.fromEntries(
  Object.entries(PROGRAMME_TO_AWARDTOOL).map(([programmeId, code]) => [code, programmeId]),
)

const ALL_PROGRAM_CODES = [...new Set(Object.values(PROGRAMME_TO_AWARDTOOL))]

function cabinLabel(cabin: FlightAwardSearchQuery['cabin']): string {
  if (cabin === 'premium-economy') return 'Premium Economy'
  return cabin.charAt(0).toUpperCase() + cabin.slice(1)
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function numberOrNull(value: unknown): number | null {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function positiveInteger(value: unknown): number | null {
  const number = Number(value)
  return Number.isSafeInteger(number) && number > 0 ? number : null
}

function currencyMinor(value: unknown): number | null {
  const number = numberOrNull(value)
  if (number == null || number < 0) return null
  return Math.round(number * 100)
}

function normalCabin(value: unknown): string {
  const raw = text(value).toLowerCase().replaceAll('_', ' ').replaceAll('-', ' ')
  if (raw.includes('premium') && raw.includes('economy')) return 'premium-economy'
  if (raw.includes('business')) return 'business'
  if (raw.includes('first')) return 'first'
  if (raw.includes('economy')) return 'economy'
  return raw || 'unknown'
}

function firstString(row: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = text(row[key])
    if (value) return value
  }
  return null
}

function segmentRows(row: Record<string, unknown>): Record<string, unknown>[] {
  const candidates = [row.segments, row.segment, row.flights, row.legs, row.itinerary]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
  }
  return []
}

function normalSegments(row: Record<string, unknown>, origin: string, destination: string) {
  const raw = segmentRows(row)
  if (!raw.length) return [{
    flightNumber: firstString(row, ['flight_number', 'flightNumber', 'flight_no', 'flight']),
    origin,
    destination,
    departureAt: firstString(row, ['departure_at', 'departureAt', 'departure_time', 'depart_time', 'departure_datetime']),
    arrivalAt: firstString(row, ['arrival_at', 'arrivalAt', 'arrival_time', 'arrive_time', 'arrival_datetime']),
  }]

  return raw.map((segment) => ({
    flightNumber: firstString(segment, ['flight_number', 'flightNumber', 'flight_no', 'flight', 'number']),
    origin: firstString(segment, ['origin', 'from', 'departure_airport', 'departure']) || origin,
    destination: firstString(segment, ['destination', 'to', 'arrival_airport', 'arrival']) || destination,
    departureAt: firstString(segment, ['departure_at', 'departureAt', 'departure_time', 'depart_time', 'departure_datetime']),
    arrivalAt: firstString(segment, ['arrival_at', 'arrivalAt', 'arrival_time', 'arrive_time', 'arrival_datetime']),
  }))
}

export function normalizeAwardToolFlightRow(raw: unknown, query: FlightAwardSearchQuery, fetchedAt: string, index: number): FlightAwardOption | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const code = text(row.program_code || row.program || row.programCode).toUpperCase()
  const programmeId = AWARDTOOL_TO_PROGRAMME[code]
  if (!programmeId) return null

  const miles = positiveInteger(
    row.miles ?? row.points ?? row.mileage ?? row.award_miles ?? row.awardMiles ?? row.cost ?? row.price_miles,
  )
  if (!miles) return null

  const origin = firstString(row, ['origin', 'from', 'departure', 'departure_airport']) || query.origin
  const destination = firstString(row, ['destination', 'to', 'arrival', 'arrival_airport']) || query.destination
  const rawTaxes = row.taxes ?? row.tax ?? row.fees ?? row.surcharge ?? row.cash ?? row.cash_component
  const taxesMinor = currencyMinor(rawTaxes)
  const taxesCurrency = taxesMinor == null ? null : (
    firstString(row, ['taxes_currency', 'tax_currency', 'currency', 'cash_currency']) || 'USD'
  ).toUpperCase()

  return {
    providerResultId: `awardtool:${code}:${query.date}:${index}:${miles}`,
    programmeId,
    origin,
    destination,
    departureAt: firstString(row, ['departure_at', 'departureAt', 'departure_time', 'depart_time', 'departure_datetime']),
    arrivalAt: firstString(row, ['arrival_at', 'arrivalAt', 'arrival_time', 'arrive_time', 'arrival_datetime']),
    cabin: normalCabin(row.cabin ?? row.cabin_class ?? row.class ?? row.cabinClass),
    miles,
    taxesMinor,
    taxesCurrency,
    segments: normalSegments(row, origin, destination),
    evidence: {
      provider: 'awardtool-realtime',
      freshness: 'LIVE',
      fetchedAt,
      sourceUrl: `${BASE_URL}/flight_retrieval/search_result`,
    },
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function post(path: string, body: Record<string, unknown>, timeoutMs = 12_000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    })
    const json = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(`AwardTool ${path} failed (${response.status})`)
    return json as Record<string, unknown>
  } finally {
    clearTimeout(timeout)
  }
}

function programsFor(query: FlightAwardSearchQuery): string[] {
  if (query.programmeIds?.length) {
    return [...new Set(query.programmeIds.map(id => PROGRAMME_TO_AWARDTOOL[id]).filter(Boolean))]
  }
  return ALL_PROGRAM_CODES
}

export class AwardToolRealtimeFlightProvider implements FlightAwardProvider {
  readonly id = 'awardtool-realtime'
  readonly freshness = 'LIVE' as const

  constructor(private readonly apiKey = process.env.AWARDTOOL_API_KEY ?? '') {}

  isConfigured(): boolean {
    return this.apiKey.trim().length > 0
  }

  async search(query: FlightAwardSearchQuery): Promise<FlightAwardOption[]> {
    if (!this.isConfigured()) return []
    const programs = programsFor(query)
    if (!programs.length) return []

    const trigger = await post('/flight_trigger/search_real_time', {
      origin: query.origin,
      destination: query.destination,
      programs,
      cabins: [cabinLabel(query.cabin)],
      date: query.date,
      pax: Math.max(1, query.adults),
      api_key: this.apiKey,
      exit_early: true,
    })

    const taskId = text(trigger.task_id)
    if (!taskId) return []

    const unique = new Map<string, FlightAwardOption>()
    for (let poll = 0; poll < 10; poll += 1) {
      if (poll > 0) await sleep(3_500)
      const result = await post('/flight_retrieval/search_result', { task_id: taskId, api_key: this.apiKey })
      const rows = Array.isArray(result.result) ? result.result : []
      const fetchedAt = new Date().toISOString()
      rows.forEach((row, index) => {
        const option = normalizeAwardToolFlightRow(row, query, fetchedAt, index)
        if (!option) return
        if (option.cabin !== query.cabin && option.cabin !== 'unknown') return
        const segmentKey = option.segments.map(segment => `${segment.flightNumber || ''}:${segment.origin}:${segment.destination}:${segment.departureAt || ''}`).join('|')
        const key = `${option.programmeId}|${option.cabin}|${segmentKey}|${option.miles}`
        unique.set(key, option)
      })
      if (result.finish === true) break
    }

    return [...unique.values()].sort((a, b) => a.miles - b.miles)
  }
}

export function awardToolProgrammeCode(programmeId: string): string | null {
  return PROGRAMME_TO_AWARDTOOL[programmeId] ?? null
}
