const BASE_URL = 'https://apisv2.awardtoolapi.com'

export type PanoramaCabin = 'economy' | 'business'

export interface AwardToolPanoramaQuery {
  origin: string
  destination: string
  from: string
  to: string
}

export interface AwardToolPanoramaOption {
  date: string
  route: string
  programmeCode: string
  economyPoints: number | null
  businessPoints: number | null
  economyNonstopPoints: number | null
  businessNonstopPoints: number | null
  lastSeen: string | null
  freshness: 'CACHED'
  verificationRequired: true
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function positiveInteger(value: unknown): number | null {
  const n = Number(value)
  return Number.isSafeInteger(n) && n > 0 ? n : null
}

function dayDiffInclusive(from: string, to: string): number {
  const start = new Date(`${from}T00:00:00Z`).getTime()
  const end = new Date(`${to}T00:00:00Z`).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) throw new Error('Invalid Panorama date range')
  return Math.floor((end - start) / 86_400_000) + 1
}

export function validatePanoramaRange(query: AwardToolPanoramaQuery): void {
  if (!/^[A-Z]{3}$/.test(query.origin) || !/^[A-Z]{3}$/.test(query.destination)) {
    throw new Error('Panorama airport searches require three-letter IATA codes')
  }
  const days = dayDiffInclusive(query.from, query.to)
  if (days > 8) throw new Error('AwardTool recommends no more than eight days per airport-pair Route Data request')
}

export function splitPanoramaRange(origin: string, destination: string, from: string, to: string): AwardToolPanoramaQuery[] {
  const start = new Date(`${from}T00:00:00Z`)
  const end = new Date(`${to}T00:00:00Z`)
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end < start) throw new Error('Invalid Panorama date range')
  const out: AwardToolPanoramaQuery[] = []
  let cursor = start
  while (cursor <= end) {
    const chunkEnd = new Date(cursor)
    chunkEnd.setUTCDate(chunkEnd.getUTCDate() + 7)
    if (chunkEnd > end) chunkEnd.setTime(end.getTime())
    out.push({ origin, destination, from: cursor.toISOString().slice(0, 10), to: chunkEnd.toISOString().slice(0, 10) })
    cursor = new Date(chunkEnd)
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return out
}

export function normalizePanoramaRow(raw: unknown): AwardToolPanoramaOption | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const date = text(row.date)
  const route = text(row.route)
  const programmeCode = text(row.program ?? row.programme ?? row.program_code).toUpperCase()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !route || !programmeCode) return null
  const points = row.points && typeof row.points === 'object' ? row.points as Record<string, unknown> : {}
  const nonstop = row.points_ns && typeof row.points_ns === 'object' ? row.points_ns as Record<string, unknown> : {}
  return {
    date,
    route,
    programmeCode,
    economyPoints: positiveInteger(points.y),
    businessPoints: positiveInteger(points.j),
    economyNonstopPoints: positiveInteger(nonstop.y),
    businessNonstopPoints: positiveInteger(nonstop.j),
    lastSeen: text(row.ls) || null,
    freshness: 'CACHED',
    verificationRequired: true,
  }
}

export class AwardToolPanoramaProvider {
  constructor(private readonly apiKey = process.env.AWARDTOOL_API_KEY ?? '') {}

  isConfigured(): boolean {
    return this.apiKey.trim().length > 0
  }

  async searchRoute(query: AwardToolPanoramaQuery): Promise<AwardToolPanoramaOption[]> {
    if (!this.isConfigured()) return []
    validatePanoramaRange(query)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12_000)
    try {
      const response = await fetch(`${BASE_URL}/panorama/panorama_route_data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date_range: { from: query.from, to: query.to },
          origins: { countries: [], regions: [], airports: [query.origin] },
          arrivals: { countries: [], regions: [], airports: [query.destination] },
          api_key: this.apiKey,
        }),
        signal: controller.signal,
        cache: 'no-store',
      })
      const json = await response.json().catch(() => ({})) as Record<string, unknown>
      if (!response.ok) throw new Error(`AwardTool Panorama failed (${response.status})`)
      const rows = Array.isArray(json.data) ? json.data : []
      return rows.map(normalizePanoramaRow).filter((row): row is AwardToolPanoramaOption => row !== null)
    } finally {
      clearTimeout(timer)
    }
  }

  async searchFlexible(origin: string, destination: string, from: string, to: string): Promise<AwardToolPanoramaOption[]> {
    const chunks = splitPanoramaRange(origin, destination, from, to)
    const results: AwardToolPanoramaOption[] = []
    // Trial guidance asks us to keep concurrency minimal, so requests are intentionally sequential.
    for (const chunk of chunks) results.push(...await this.searchRoute(chunk))
    return results.sort((a, b) => a.date.localeCompare(b.date) || (a.businessPoints ?? Number.MAX_SAFE_INTEGER) - (b.businessPoints ?? Number.MAX_SAFE_INTEGER))
  }
}
