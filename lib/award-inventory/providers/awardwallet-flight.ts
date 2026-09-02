import type { FlightAwardOption, FlightAwardSearchQuery, FlightAwardProvider } from '../types'

const BASE_URL = 'https://ra.awardwallet.com/v1'

export interface AwardWalletFlightProviderInfo {
  code: string
  displayName: string
  shortName: string
  loginRequired: boolean
  authMode: string | null
  supportedCurrencies: string[]
}

export type AwardWalletFlightSearchResult =
  | { status: 'SUCCESS'; provider: AwardWalletFlightProviderInfo; options: FlightAwardOption[]; fetchedAt: string }
  | { status: 'PENDING'; provider: AwardWalletFlightProviderInfo; options: []; fetchedAt: string; reason: string }
  | { status: 'DIRECT_REQUIRED'; provider: AwardWalletFlightProviderInfo | null; options: []; fetchedAt: string; reason: string }
  | { status: 'PROVIDER_ERROR'; provider: AwardWalletFlightProviderInfo | null; options: []; fetchedAt: string; reason: string }

const PROGRAMME_HINTS: Record<string, { preferredCodes: string[]; nameTokens: string[] }> = {
  krisflyer: { preferredCodes: ['singapore', 'krisflyer'], nameTokens: ['singapore', 'krisflyer'] },
  'air-india-maharaja': { preferredCodes: ['airindia'], nameTokens: ['air india', 'maharaja'] },
  'flying-blue': { preferredCodes: ['flyingblue'], nameTokens: ['flying blue', 'air france', 'klm'] },
  'etihad-guest': { preferredCodes: ['etihad'], nameTokens: ['etihad'] },
  'qatar-privilege-club': { preferredCodes: ['qatar'], nameTokens: ['qatar'] },
  'british-airways-club': { preferredCodes: ['britishairways', 'ba'], nameTokens: ['british airways'] },
  'turkish-miles-smiles': { preferredCodes: ['turkish'], nameTokens: ['turkish'] },
  'united-mileageplus': { preferredCodes: ['united'], nameTokens: ['united'] },
  aeroplan: { preferredCodes: ['aeroplan'], nameTokens: ['aeroplan', 'air canada'] },
  cathay: { preferredCodes: ['cathay'], nameTokens: ['cathay'] },
  'emirates-skywards': { preferredCodes: ['emirates'], nameTokens: ['emirates'] },
  'american-aadvantage': { preferredCodes: ['american'], nameTokens: ['american', 'aadvantage'] },
  'delta-skymiles': { preferredCodes: ['delta'], nameTokens: ['delta', 'skymiles'] },
}

function text(v: unknown): string { return typeof v === 'string' ? v.trim() : '' }
function positiveInt(v: unknown): number | null {
  const n = Number(v)
  return Number.isSafeInteger(n) && n > 0 ? n : null
}
function finite(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}
function normalCabin(value: unknown): string {
  const c = text(value).toLowerCase()
  if (c === 'firstclass') return 'first'
  if (c === 'premiumeconomy') return 'premium-economy'
  if (c === 'business' || c === 'economy' || c === 'first') return c
  return c || 'unknown'
}
function cabinForRequest(value: FlightAwardSearchQuery['cabin']): string {
  if (value === 'first') return 'firstClass'
  if (value === 'premium-economy') return 'premiumEconomy'
  return value
}

export function resolveGuestAwardWalletFlightProvider(
  programmeId: string,
  providers: AwardWalletFlightProviderInfo[],
): AwardWalletFlightProviderInfo | null {
  const hints = PROGRAMME_HINTS[programmeId]
  if (!hints) return null
  const guest = (p: AwardWalletFlightProviderInfo) => !p.loginRequired || p.authMode === 'optional'
  for (const code of hints.preferredCodes) {
    const exact = providers.find((p) => p.code.toLowerCase() === code && guest(p))
    if (exact) return exact
  }
  const matches = providers.filter((p) => {
    if (!guest(p)) return false
    const haystack = `${p.code} ${p.displayName} ${p.shortName}`.toLowerCase()
    return hints.nameTokens.some((token) => haystack.includes(token))
  })
  return matches.length === 1 ? matches[0] : null
}

export function normalizeAwardWalletFlightResults(
  raw: unknown,
  programmeId: string,
  providerCode: string,
  fetchedAt: string,
): FlightAwardOption[] {
  if (!raw || typeof raw !== 'object') return []
  const payload = raw as Record<string, unknown>
  const state = Number(payload.state)
  if (state !== 1 || !Array.isArray(payload.routes)) return []

  const out: FlightAwardOption[] = []
  let i = 0
  for (const routeRaw of payload.routes) {
    if (!routeRaw || typeof routeRaw !== 'object') continue
    const route = routeRaw as Record<string, unknown>
    const mileCost = route.mileCost && typeof route.mileCost === 'object' ? route.mileCost as Record<string, unknown> : {}
    const miles = positiveInt(mileCost.miles)
    if (!miles) continue
    const cash = route.cashCost && typeof route.cashCost === 'object' ? route.cashCost as Record<string, unknown> : {}
    const taxes = finite(cash.taxes)
    const fees = finite(cash.fees)
    const cashCurrency = text(cash.currency).toUpperCase() || null
    const taxesMinor = taxes == null && fees == null ? null : Math.round(((taxes ?? 0) + (fees ?? 0)) * 100)
    const segmentsRaw = Array.isArray(route.segments) ? route.segments : []
    const segments = segmentsRaw.flatMap((segmentRaw) => {
      if (!segmentRaw || typeof segmentRaw !== 'object') return []
      const segment = segmentRaw as Record<string, unknown>
      const dep = segment.departure && typeof segment.departure === 'object' ? segment.departure as Record<string, unknown> : {}
      const arr = segment.arrival && typeof segment.arrival === 'object' ? segment.arrival as Record<string, unknown> : {}
      const flightNumbers = Array.isArray(segment.flightNumbers) ? segment.flightNumbers.map(text).filter(Boolean) : []
      return [{
        flightNumber: flightNumbers[0] ?? null,
        origin: text(dep.airport),
        destination: text(arr.airport),
        departureAt: text(dep.dateTime) || null,
        arrivalAt: text(arr.dateTime) || null,
      }]
    })
    const first = segments[0]
    const last = segments[segments.length - 1]
    const firstRaw = segmentsRaw[0] && typeof segmentsRaw[0] === 'object' ? segmentsRaw[0] as Record<string, unknown> : {}
    out.push({
      providerResultId: `${providerCode}:${fetchedAt}:${i}`,
      programmeId,
      origin: first?.origin ?? '',
      destination: last?.destination ?? '',
      departureAt: first?.departureAt ?? null,
      arrivalAt: last?.arrivalAt ?? null,
      cabin: normalCabin(firstRaw.standardCOS),
      miles,
      taxesMinor,
      taxesCurrency: taxesMinor == null ? null : cashCurrency,
      segments,
      evidence: { provider: 'awardwallet-flight', freshness: 'LIVE', fetchedAt },
    })
    i += 1
  }
  return out
}

function wait(ms: number): Promise<void> { return new Promise((resolve) => setTimeout(resolve, ms)) }

export class AwardWalletFlightSearchClient implements FlightAwardProvider {
  readonly id = 'awardwallet-flight'
  readonly freshness = 'LIVE' as const

  constructor(private readonly auth = process.env.AWARDWALLET_API_AUTH ?? '') {}

  isConfigured(): boolean { return this.auth.trim().length > 0 }

  private async listProviders(): Promise<AwardWalletFlightProviderInfo[]> {
    if (!this.isConfigured()) return []
    const res = await fetch(`${BASE_URL}/providers/list`, {
      headers: { 'X-Authentication': this.auth }, cache: 'no-store',
    })
    if (!res.ok) throw new Error(`AwardWallet flight provider list failed: ${res.status}`)
    const json = await res.json() as { providers?: unknown }
    if (!Array.isArray(json.providers)) return []
    return json.providers.flatMap((row) => {
      if (!row || typeof row !== 'object') return []
      const r = row as Record<string, unknown>
      const code = text(r.code)
      if (!code) return []
      return [{
        code,
        displayName: text(r.displayName),
        shortName: text(r.shortName),
        loginRequired: r.loginRequired === true,
        authMode: text(r.authMode) || null,
        supportedCurrencies: Array.isArray(r.supportedCurrencies) ? r.supportedCurrencies.map(text).filter(Boolean) : [],
      }]
    })
  }

  private async submit(provider: AwardWalletFlightProviderInfo, query: FlightAwardSearchQuery): Promise<string | null> {
    const currency = provider.supportedCurrencies.includes('INR') ? 'INR' : (provider.supportedCurrencies[0] || 'USD')
    const res = await fetch(`${BASE_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Authentication': this.auth },
      body: JSON.stringify({
        provider: provider.code,
        departure: { airportCode: query.origin, date: query.date },
        arrival: query.destination,
        standardItineraryCOS: cabinForRequest(query.cabin),
        passengers: { adults: query.adults },
        responseTypes: ['singleDate'],
        currency,
        timeout: 60,
        priority: 9,
      }),
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`AwardWallet flight search failed: ${res.status}`)
    const json = await res.json() as { requestId?: unknown }
    return text(json.requestId) || null
  }

  private async getResult(requestId: string): Promise<unknown> {
    if (!/^[a-z0-9_-]+$/i.test(requestId)) throw new Error('invalid AwardWallet flight request id')
    const res = await fetch(`${BASE_URL}/getResults/${encodeURIComponent(requestId)}`, {
      headers: { 'X-Authentication': this.auth }, cache: 'no-store',
    })
    if (!res.ok) throw new Error(`AwardWallet flight result failed: ${res.status}`)
    return await res.json()
  }

  async search(query: FlightAwardSearchQuery): Promise<FlightAwardOption[]> {
    const programmeId = query.programmeIds?.length === 1 ? query.programmeIds[0] : null
    if (!programmeId || !this.isConfigured()) return []
    const providers = await this.listProviders()
    const provider = resolveGuestAwardWalletFlightProvider(programmeId, providers)
    if (!provider) return []
    const requestId = await this.submit(provider, query)
    if (!requestId) return []
    for (let i = 0; i < 4; i += 1) {
      if (i > 0) await wait(900)
      const result = await this.getResult(requestId)
      if (result && typeof result === 'object') {
        const state = Number((result as Record<string, unknown>).state)
        if (state === 1) return normalizeAwardWalletFlightResults(result, programmeId, provider.code, new Date().toISOString())
        if (state < 0) return []
      }
    }
    return []
  }

  async searchGuestVerified(query: FlightAwardSearchQuery, programmeId: string): Promise<AwardWalletFlightSearchResult> {
    const fetchedAt = new Date().toISOString()
    if (!this.isConfigured()) return { status: 'PROVIDER_ERROR', provider: null, options: [], fetchedAt, reason: 'AwardWallet API is not configured.' }
    const providers = await this.listProviders()
    const provider = resolveGuestAwardWalletFlightProvider(programmeId, providers)
    if (!provider) {
      const hints = PROGRAMME_HINTS[programmeId]
      const known = hints ? providers.find((p) => {
        const haystack = `${p.code} ${p.displayName} ${p.shortName}`.toLowerCase()
        return hints.nameTokens.some((token) => haystack.includes(token))
      }) ?? null : null
      return { status: 'DIRECT_REQUIRED', provider: known, options: [], fetchedAt, reason: known?.loginRequired ? 'Award provider requires loyalty login; CreditIQ does not collect those credentials in Travel.' : 'No guest-capable live provider is mapped for this programme.' }
    }
    try {
      const options = await this.search({ ...query, programmeIds: [programmeId] })
      return options.length
        ? { status: 'SUCCESS', provider, options, fetchedAt: new Date().toISOString() }
        : { status: 'PENDING', provider, options: [], fetchedAt: new Date().toISOString(), reason: 'Live provider did not return completed award options within the bounded foreground poll.' }
    } catch (error) {
      return { status: 'PROVIDER_ERROR', provider, options: [], fetchedAt, reason: error instanceof Error ? error.message : 'Live flight award provider failed.' }
    }
  }
}
