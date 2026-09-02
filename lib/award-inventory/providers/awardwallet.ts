const HOTEL_BASE_URL = 'https://ra-hotels.awardwallet.com/v1'

export interface AwardWalletHotelSearchInput {
  provider: string
  destination: string
  checkInDate: string
  checkOutDate?: string
  numberOfRooms: 1 | 2
  numberOfAdults: number
  numberOfKids: number
  priority?: number
  userData?: string
}

export interface AwardWalletProviderInfo {
  code: string
  displayName: string
  shortName: string
  loginRequired: boolean
}

export interface AwardWalletHotelAwardRate {
  id: string
  programmeId: string
  providerCode: string
  hotelName: string
  hotelUrl: string | null
  addressText: string | null
  latitude: number | null
  longitude: number | null
  checkInDate: string
  checkOutDate: string | null
  numberOfNights: number
  roomType: string | null
  roomName: string | null
  rateName: string | null
  pointsPerNight: number
  totalPoints: number
  cashPerNightMinor: number | null
  totalCashMinor: number | null
  cashCurrency: string | null
  fetchedAt: string
  freshness: 'LIVE'
  source: 'awardwallet'
}

export type AwardWalletGuestSearchResult =
  | { status: 'SUCCESS'; provider: AwardWalletProviderInfo; rates: AwardWalletHotelAwardRate[]; fetchedAt: string }
  | { status: 'DIRECT_REQUIRED'; provider: AwardWalletProviderInfo | null; rates: []; fetchedAt: string; reason: string }
  | { status: 'PENDING'; provider: AwardWalletProviderInfo; rates: []; fetchedAt: string; reason: string }
  | { status: 'PROVIDER_ERROR'; provider: AwardWalletProviderInfo | null; rates: []; fetchedAt: string; reason: string }

/**
 * Intentionally excludes `loyaltyAccount`.
 *
 * AwardWallet can accept programme credentials for some searches, including
 * passwords/OTP answers. CreditIQ does NOT forward those secrets from Travel.
 * Providers that require a consumer login remain DIRECT_REQUIRED.
 */
export function buildAwardWalletHotelSearchBody(input: AwardWalletHotelSearchInput): Record<string, unknown> {
  if (!/^[a-z0-9_-]+$/i.test(input.provider)) throw new Error('invalid AwardWallet provider id')
  if (!input.destination.trim()) throw new Error('destination required')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.checkInDate)) throw new Error('invalid check-in date')
  if (input.checkOutDate && !/^\d{4}-\d{2}-\d{2}$/.test(input.checkOutDate)) throw new Error('invalid check-out date')
  if (input.numberOfAdults < 1 || input.numberOfAdults > 4) throw new Error('adults out of range')
  if (input.numberOfKids < 0 || input.numberOfKids > 4) throw new Error('kids out of range')

  return {
    provider: input.provider,
    destination: input.destination.trim(),
    checkInDate: input.checkInDate,
    ...(input.checkOutDate ? { checkOutDate: input.checkOutDate } : {}),
    numberOfRooms: input.numberOfRooms,
    numberOfAdults: input.numberOfAdults,
    numberOfKids: input.numberOfKids,
    priority: Math.min(9, Math.max(1, input.priority ?? 9)),
    ...(input.userData ? { userData: input.userData } : {}),
    downloadPreview: false,
  }
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function finiteNonNegative(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) && n >= 0 ? n : null
}

function positiveInteger(value: unknown): number | null {
  const n = Number(value)
  return Number.isSafeInteger(n) && n > 0 ? n : null
}

function dateNights(checkIn: string, checkOut: string | null): number | null {
  if (!checkOut) return null
  const a = Date.parse(`${checkIn}T00:00:00Z`)
  const b = Date.parse(`${checkOut}T00:00:00Z`)
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return null
  const nights = Math.round((b - a) / 86_400_000)
  return Number.isSafeInteger(nights) && nights > 0 ? nights : null
}

const PROGRAMME_HINTS: Record<string, { preferredCodes: string[]; nameTokens: string[] }> = {
  'marriott-bonvoy': { preferredCodes: ['marriott'], nameTokens: ['marriott', 'bonvoy'] },
  'world-of-hyatt': { preferredCodes: ['goldpassport'], nameTokens: ['hyatt'] },
  'hilton-honors': { preferredCodes: ['hhonors'], nameTokens: ['hilton', 'honors'] },
  'ihg-one': { preferredCodes: [], nameTokens: ['ihg', 'intercontinental'] },
  'wyndham-rewards': { preferredCodes: [], nameTokens: ['wyndham'] },
  'choice-privileges': { preferredCodes: [], nameTokens: ['choice'] },
  'i-prefer': { preferredCodes: [], nameTokens: ['i prefer', 'preferred hotels'] },
}

/** Resolve only a provider AwardWallet currently reports and only when guest search is allowed. */
export function resolveGuestAwardWalletProvider(
  programmeId: string,
  providers: AwardWalletProviderInfo[],
): AwardWalletProviderInfo | null {
  const hints = PROGRAMME_HINTS[programmeId]
  if (!hints) return null

  for (const code of hints.preferredCodes) {
    const exact = providers.find((provider) => provider.code.toLowerCase() === code && !provider.loginRequired)
    if (exact) return exact
  }

  const matches = providers.filter((provider) => {
    if (provider.loginRequired) return false
    const haystack = `${provider.code} ${provider.displayName} ${provider.shortName}`.toLowerCase()
    return hints.nameTokens.some((token) => haystack.includes(token))
  })
  return matches.length === 1 ? matches[0] : null
}

export function normalizeAwardWalletHotels(
  raw: unknown,
  programmeId: string,
  providerCode: string,
  fetchedAt: string,
): AwardWalletHotelAwardRate[] {
  if (!raw || typeof raw !== 'object') return []
  const payload = raw as Record<string, unknown>
  if (payload.state !== 'success' && payload.state !== 'warning') return []
  if (!Array.isArray(payload.hotels)) return []

  const out: AwardWalletHotelAwardRate[] = []

  for (const hotelRaw of payload.hotels) {
    if (!hotelRaw || typeof hotelRaw !== 'object') continue
    const hotel = hotelRaw as Record<string, unknown>
    const hotelName = text(hotel.name)
    const checkInDate = text(hotel.checkInDate)
    const checkOutDate = text(hotel.checkOutDate) || null
    if (!hotelName || !/^\d{4}-\d{2}-\d{2}$/.test(checkInDate)) continue

    const nights = positiveInteger(hotel.numberOfNights) ?? dateNights(checkInDate, checkOutDate)
    if (!nights) continue

    const address = hotel.address && typeof hotel.address === 'object'
      ? hotel.address as Record<string, unknown>
      : {}
    const hotelUrl = text(hotel.hotelURL) || null
    const addressText = text(address.text) || null
    const latitude = finiteNonNegative(address.lat)
    const longitudeRaw = typeof address.lng === 'number' ? address.lng : Number(address.lng)
    const longitude = Number.isFinite(longitudeRaw) ? longitudeRaw : null
    const hotelCurrency = text(hotel.originalCurrency).toUpperCase() || 'USD'

    let emitted = 0
    if (Array.isArray(hotel.rooms)) {
      for (const roomRaw of hotel.rooms) {
        if (!roomRaw || typeof roomRaw !== 'object') continue
        const room = roomRaw as Record<string, unknown>
        if (!Array.isArray(room.rates)) continue
        for (const rateRaw of room.rates) {
          if (!rateRaw || typeof rateRaw !== 'object') continue
          const rate = rateRaw as Record<string, unknown>
          const pointsPerNight = positiveInteger(rate.pointsPerNight)
          if (!pointsPerNight) continue
          const cashPerNight = finiteNonNegative(rate.cashPerNight)
          const currency = text(rate.originalCurrency).toUpperCase() || hotelCurrency
          const cashPerNightMinor = cashPerNight == null ? null : Math.round(cashPerNight * 100)
          out.push({
            id: `${providerCode}:${hotelName}:${checkInDate}:${emitted}`,
            programmeId,
            providerCode,
            hotelName,
            hotelUrl,
            addressText,
            latitude,
            longitude,
            checkInDate,
            checkOutDate,
            numberOfNights: nights,
            roomType: text(room.type) || null,
            roomName: text(room.name) || null,
            rateName: text(rate.name) || null,
            pointsPerNight,
            totalPoints: pointsPerNight * nights,
            cashPerNightMinor,
            totalCashMinor: cashPerNightMinor == null ? null : cashPerNightMinor * nights,
            cashCurrency: cashPerNightMinor == null ? null : currency,
            fetchedAt,
            freshness: 'LIVE',
            source: 'awardwallet',
          })
          emitted += 1
        }
      }
    }

    // Some providers expose a property-level standard award even when no room
    // rate array is returned. Preserve it as a generic award option.
    if (emitted === 0) {
      const pointsPerNight = positiveInteger(hotel.pointsPerNight)
      if (pointsPerNight) {
        out.push({
          id: `${providerCode}:${hotelName}:${checkInDate}:property`,
          programmeId,
          providerCode,
          hotelName,
          hotelUrl,
          addressText,
          latitude,
          longitude,
          checkInDate,
          checkOutDate,
          numberOfNights: nights,
          roomType: null,
          roomName: text(hotel.roomType) || null,
          rateName: null,
          pointsPerNight,
          totalPoints: pointsPerNight * nights,
          cashPerNightMinor: null,
          totalCashMinor: null,
          cashCurrency: null,
          fetchedAt,
          freshness: 'LIVE',
          source: 'awardwallet',
        })
      }
    }
  }

  return out
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class AwardWalletHotelSearchClient {
  constructor(private readonly auth = process.env.AWARDWALLET_API_AUTH ?? '') {}

  isConfigured(): boolean {
    return this.auth.trim().length > 0
  }

  private headers(): Record<string, string> {
    return { 'Content-Type': 'application/json', 'X-Authentication': this.auth }
  }

  async listProviders(): Promise<AwardWalletProviderInfo[]> {
    if (!this.isConfigured()) return []
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8_000)
    try {
      const res = await fetch(`${HOTEL_BASE_URL}/providers/list`, {
        headers: { 'X-Authentication': this.auth },
        signal: controller.signal,
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`AwardWallet provider list failed: ${res.status}`)
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
        }]
      })
    } finally {
      clearTimeout(timeout)
    }
  }

  async submit(input: AwardWalletHotelSearchInput): Promise<string | null> {
    if (!this.isConfigured()) return null

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8_000)
    try {
      const res = await fetch(`${HOTEL_BASE_URL}/search`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(buildAwardWalletHotelSearchBody(input)),
        signal: controller.signal,
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`AwardWallet hotel search failed: ${res.status}`)
      const json = await res.json() as { requestId?: unknown }
      return typeof json.requestId === 'string' && json.requestId ? json.requestId : null
    } finally {
      clearTimeout(timeout)
    }
  }

  async getResult(requestId: string): Promise<unknown | null> {
    if (!this.isConfigured()) return null
    if (!/^[a-z0-9_-]+$/i.test(requestId)) throw new Error('invalid AwardWallet request id')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8_000)
    try {
      const res = await fetch(`${HOTEL_BASE_URL}/getResults/${encodeURIComponent(requestId)}`, {
        headers: { 'X-Authentication': this.auth },
        signal: controller.signal,
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`AwardWallet hotel result failed: ${res.status}`)
      return await res.json()
    } finally {
      clearTimeout(timeout)
    }
  }

  /**
   * Preview-safe guest search. AwardWallet recommends callbacks in production;
   * this bounded poll is intentionally short and never receives loyalty secrets.
   */
  async searchGuest(
    programmeId: string,
    input: Omit<AwardWalletHotelSearchInput, 'provider'>,
    options: { maxPolls?: number; pollDelayMs?: number } = {},
  ): Promise<AwardWalletGuestSearchResult> {
    const fetchedAt = new Date().toISOString()
    if (!this.isConfigured()) {
      return { status: 'PROVIDER_ERROR', provider: null, rates: [], fetchedAt, reason: 'AwardWallet API is not configured.' }
    }

    const providers = await this.listProviders()
    const provider = resolveGuestAwardWalletProvider(programmeId, providers)
    if (!provider) {
      const known = PROGRAMME_HINTS[programmeId]
        ? providers.find((p) => {
            const haystack = `${p.code} ${p.displayName} ${p.shortName}`.toLowerCase()
            return PROGRAMME_HINTS[programmeId].nameTokens.some((token) => haystack.includes(token))
          }) ?? null
        : null
      return {
        status: 'DIRECT_REQUIRED',
        provider: known,
        rates: [],
        fetchedAt,
        reason: known?.loginRequired
          ? 'Award provider requires loyalty login; CreditIQ does not collect those credentials in Travel.'
          : 'No guest-capable award provider is mapped for this programme.',
      }
    }

    const requestId = await this.submit({ ...input, provider: provider.code })
    if (!requestId) {
      return { status: 'PROVIDER_ERROR', provider, rates: [], fetchedAt, reason: 'Award search did not return a request id.' }
    }

    const maxPolls = Math.max(1, Math.min(6, options.maxPolls ?? 4))
    const delay = Math.max(0, Math.min(2_500, options.pollDelayMs ?? 1_000))
    let lastState = 'queued_up'
    for (let i = 0; i < maxPolls; i += 1) {
      if (i > 0 && delay > 0) await wait(delay)
      const result = await this.getResult(requestId)
      if (!result || typeof result !== 'object') continue
      const state = text((result as Record<string, unknown>).state)
      lastState = state || lastState
      if (state === 'success' || state === 'warning') {
        return {
          status: 'SUCCESS',
          provider,
          rates: normalizeAwardWalletHotels(result, programmeId, provider.code, new Date().toISOString()),
          fetchedAt: new Date().toISOString(),
        }
      }
      if (state && state !== 'queued_up') {
        return { status: 'PROVIDER_ERROR', provider, rates: [], fetchedAt: new Date().toISOString(), reason: `Award provider returned ${state}.` }
      }
    }

    return {
      status: 'PENDING',
      provider,
      rates: [],
      fetchedAt: new Date().toISOString(),
      reason: `Award search is still ${lastState}; retry the selected hotel shortly.`,
    }
  }
}
