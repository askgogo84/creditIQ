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

/**
 * Intentionally excludes `loyaltyAccount`.
 *
 * AwardWallet can accept programme credentials for some searches, including
 * passwords/OTP answers. CreditIQ must not start forwarding those secrets from
 * Travel UI as part of an inventory proof-of-concept. Providers that require a
 * consumer login stay unsupported until a dedicated credential-consent design
 * exists.
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

export class AwardWalletHotelSearchClient {
  constructor(private readonly auth = process.env.AWARDWALLET_API_AUTH ?? '') {}

  isConfigured(): boolean {
    return this.auth.trim().length > 0
  }

  async submit(input: AwardWalletHotelSearchInput): Promise<string | null> {
    if (!this.isConfigured()) return null

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8_000)
    try {
      const res = await fetch(`${HOTEL_BASE_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authentication': this.auth,
        },
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
}
