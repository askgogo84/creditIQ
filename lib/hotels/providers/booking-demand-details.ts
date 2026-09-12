export type BookingDemandHotelDetails = {
  hotelId: string
  name: string | null
  imageUrls: string[]
  stars: number | null
  latitude: number | null
  longitude: number | null
  deeplink: string | null
}

function baseUrl() {
  const override = (process.env.BOOKING_DEMAND_BASE_URL || '').trim().replace(/\/$/, '')
  if (override) return override
  return (process.env.BOOKING_DEMAND_ENV || 'sandbox').toLowerCase() === 'production'
    ? 'https://demandapi.booking.com/3.2'
    : 'https://demandapi-sandbox.booking.com/3.2'
}

function headers() {
  return {
    Authorization: `Bearer ${process.env.BOOKING_DEMAND_API_TOKEN || ''}`,
    'X-Affiliate-Id': process.env.BOOKING_AFFILIATE_ID || '',
    'Content-Type': 'application/json',
  }
}

function finite(value: unknown): number | null {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function translated(value: any): string | null {
  if (typeof value === 'string') return value
  if (!value || typeof value !== 'object') return null
  const candidate = value['en-gb'] ?? value['en-us'] ?? value.fallback ?? Object.values(value).find(v => typeof v === 'string')
  return typeof candidate === 'string' ? candidate : null
}

export function extractBookingPhotos(detail: any): string[] {
  const photos = Array.isArray(detail?.photos) ? detail.photos : []
  const seen = new Set<string>()
  const urls: string[] = []
  for (const photo of photos) {
    const candidates = typeof photo === 'string'
      ? [photo]
      : [photo?.url?.large, photo?.url?.medium, photo?.url?.small, photo?.url, photo?.large, photo?.medium, photo?.small]
    for (const candidate of candidates) {
      if (typeof candidate !== 'string' || !candidate.startsWith('http') || seen.has(candidate)) continue
      seen.add(candidate)
      urls.push(candidate)
      break
    }
  }
  return urls.slice(0, 30)
}

export async function getBookingDemandHotelDetails(hotelId: string): Promise<BookingDemandHotelDetails> {
  const numericId = Number(hotelId)
  if (!Number.isSafeInteger(numericId) || numericId <= 0) throw new Error('invalid Booking.com hotel id')
  if (!process.env.BOOKING_DEMAND_API_TOKEN || !process.env.BOOKING_AFFILIATE_ID) throw new Error('Booking.com Demand API is not configured')

  const res = await fetch(`${baseUrl()}/accommodations/details`, {
    method: 'POST', headers: headers(), cache: 'no-store',
    body: JSON.stringify({ accommodations: [numericId], extras: ['photos'], languages: ['en-gb'] }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Booking.com hotel details failed (${res.status})`)
  const detail = Array.isArray(json?.data) ? json.data[0] : null
  if (!detail) throw new Error('Booking.com returned no hotel detail')

  const stars = finite(detail?.rating?.stars ?? detail?.rating?.number_of_stars ?? detail?.stars ?? detail?.class)
  const latitude = finite(detail?.location?.coordinates?.latitude ?? detail?.location?.latitude ?? detail?.coordinates?.latitude)
  const longitude = finite(detail?.location?.coordinates?.longitude ?? detail?.location?.longitude ?? detail?.coordinates?.longitude)
  const rawUrl = typeof detail?.url === 'string' ? detail.url : detail?.url?.web

  return {
    hotelId: String(numericId),
    name: translated(detail?.name) || translated(detail?.title),
    imageUrls: extractBookingPhotos(detail),
    stars: stars != null && stars >= 0 && stars <= 5 ? stars : null,
    latitude,
    longitude,
    deeplink: typeof rawUrl === 'string' && rawUrl.startsWith('http') ? rawUrl : null,
  }
}
