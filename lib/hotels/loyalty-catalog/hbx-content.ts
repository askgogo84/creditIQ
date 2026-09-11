import crypto from 'node:crypto'
import https from 'node:https'
import { unstable_cache } from 'next/cache'
import { programmeIdForHotelChain } from '@/lib/redemption-rails/programme-resolver'
import type { OfficialLoyaltyProperty } from './official'

const HBX_CONTENT_DOCS = 'https://developer.hotelbeds.com/documentation/hotels/content-api/'

function env(name: string) {
  return (process.env[name] || '').trim()
}

function pem(name: string) {
  return env(name).replace(/\\n/g, '\n')
}

function configured() {
  return Boolean(env('HOTELBEDS_API_KEY') && env('HOTELBEDS_SECRET'))
}

function environment() {
  return env('HOTELBEDS_ENV').toLowerCase() === 'production' ? 'production' : 'test'
}

function baseUrl() {
  const override = env('HOTELBEDS_CONTENT_BASE_URL').replace(/\/$/, '')
  if (override) return override
  const hasMtls = Boolean(pem('HOTELBEDS_CLIENT_CERT_PEM') && pem('HOTELBEDS_CLIENT_KEY_PEM'))
  if (hasMtls) {
    return environment() === 'production'
      ? 'https://api-mtls.hotelbeds.com'
      : 'https://api-mtls.test.hotelbeds.com'
  }
  return environment() === 'production'
    ? 'https://api.hotelbeds.com'
    : 'https://api.test.hotelbeds.com'
}

function signature(timestampSeconds: number) {
  return crypto
    .createHash('sha256')
    .update(`${env('HOTELBEDS_API_KEY')}${env('HOTELBEDS_SECRET')}${timestampSeconds}`)
    .digest('hex')
}

function requestJson(path: string): Promise<any | null> {
  if (!configured()) return Promise.resolve(null)
  return new Promise((resolve) => {
    const timestamp = Math.floor(Date.now() / 1000)
    const url = new URL(`${baseUrl()}${path}`)
    const options: https.RequestOptions = {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || 443,
      path: `${url.pathname}${url.search}`,
      method: 'GET',
      cert: pem('HOTELBEDS_CLIENT_CERT_PEM') || undefined,
      key: pem('HOTELBEDS_CLIENT_KEY_PEM') || undefined,
      ca: pem('HOTELBEDS_CA_CERT_PEM') || undefined,
      rejectUnauthorized: true,
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'identity',
        'Api-key': env('HOTELBEDS_API_KEY'),
        'X-Signature': signature(timestamp),
      },
    }

    const req = https.request(options, res => {
      const chunks: Buffer[] = []
      res.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
      res.on('end', () => {
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) return resolve(null)
        const text = Buffer.concat(chunks).toString('utf8')
        try { resolve(text ? JSON.parse(text) : null) } catch { resolve(null) }
      })
    })
    req.setTimeout(10_000, () => req.destroy())
    req.on('error', () => resolve(null))
    req.end()
  })
}

function text(value: any): string {
  if (typeof value === 'string') return value.trim()
  if (value && typeof value.content === 'string') return value.content.trim()
  if (value && typeof value.description === 'string') return value.description.trim()
  if (value?.description && typeof value.description.content === 'string') return value.description.content.trim()
  if (value?.name && typeof value.name.content === 'string') return value.name.content.trim()
  if (value?.name && typeof value.name === 'string') return value.name.trim()
  return ''
}

function norm(value: unknown) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function destinationTerms(item: any) {
  const terms = [text(item?.name), text(item?.description), item?.code]
  for (const zone of Array.isArray(item?.zones) ? item.zones : []) {
    terms.push(text(zone?.name), text(zone?.description))
  }
  for (const zone of Array.isArray(item?.groupZones) ? item.groupZones : []) {
    terms.push(text(zone?.name), text(zone?.content))
  }
  return terms.filter(Boolean)
}

const loadDestinations = unstable_cache(async () => {
  if (!configured()) return [] as any[]
  const pages = await Promise.all([
    [1, 1000], [1001, 2000], [2001, 3000], [3001, 4000], [4001, 5000],
  ].map(async ([from, to]) => {
    const data = await requestJson(`/hotel-content-api/1.0/locations/destinations?fields=all&language=ENG&from=${from}&to=${to}&useSecondaryLanguage=false`)
    return Array.isArray(data?.destinations) ? data.destinations : []
  }))
  return pages.flat()
}, ['hbx-hotel-content-destinations-v1'], { revalidate: 86_400 })

const loadChains = unstable_cache(async () => {
  if (!configured()) return {} as Record<string, string>
  const pages = await Promise.all([
    [1, 1000], [1001, 2000],
  ].map(async ([from, to]) => {
    const data = await requestJson(`/hotel-content-api/1.0/types/chains?fields=all&language=ENG&from=${from}&to=${to}&useSecondaryLanguage=false`)
    return Array.isArray(data?.chains) ? data.chains : []
  }))
  const result: Record<string, string> = {}
  for (const chain of pages.flat()) {
    const code = String(chain?.code || '').trim()
    const label = text(chain?.description) || text(chain?.name)
    if (code && label) result[code] = label
  }
  return result
}, ['hbx-hotel-content-chains-v1'], { revalidate: 86_400 })

const loadHotelsForDestination = unstable_cache(async (destinationCode: string) => {
  if (!configured() || !destinationCode) return [] as any[]
  const data = await requestJson(`/hotel-content-api/1.0/hotels?fields=all&language=ENG&destinationCode=${encodeURIComponent(destinationCode)}&from=1&to=1000&useSecondaryLanguage=false`)
  return Array.isArray(data?.hotels) ? data.hotels : []
}, ['hbx-hotel-content-hotels-v1'], { revalidate: 86_400 })

async function resolveDestinationCode(destination: string) {
  const needle = norm(destination)
  if (!needle) return null
  const destinations = await loadDestinations()
  const scored = destinations
    .map((item: any) => {
      const terms = destinationTerms(item).map(norm).filter(Boolean)
      let score = 0
      if (terms.some(term => term === needle)) score = 100
      else if (terms.some(term => term.startsWith(needle) || needle.startsWith(term))) score = 75
      else if (terms.some(term => term.includes(needle) || needle.includes(term))) score = 50
      return { item, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
  const code = String(scored[0]?.item?.code || '').trim()
  return code || null
}

function imageUrl(hotel: any) {
  const images = Array.isArray(hotel?.images) ? hotel.images : []
  const first = images.find((image: any) => image?.path)
  if (!first?.path) return null
  return `https://photos.hotelbeds.com/giata/bigger/${String(first.path).replace(/^\/+/, '')}`
}

function address(hotel: any) {
  const addr = text(hotel?.address)
  const city = text(hotel?.city)
  const postal = text(hotel?.postalCode)
  return [addr, city, postal].filter(Boolean).join(', ') || null
}

export async function fetchHbxLoyaltyContent(destination: string): Promise<OfficialLoyaltyProperty[]> {
  if (!configured()) return []
  const destinationCode = await resolveDestinationCode(destination)
  if (!destinationCode) return []

  const [hotels, chains] = await Promise.all([
    loadHotelsForDestination(destinationCode),
    loadChains(),
  ])

  const out = new Map<string, OfficialLoyaltyProperty>()
  for (const hotel of hotels) {
    const name = text(hotel?.name)
    if (!name) continue
    const chainCode = String(hotel?.chainCode || '').trim()
    const chainName = chainCode ? chains[chainCode] || '' : ''
    const programmeId = programmeIdForHotelChain(`${chainName} ${name}`)
    if (!programmeId) continue

    const code = String(hotel?.code || '').trim() || `${programmeId}:${norm(name).replace(/ /g, '-')}`
    const property: OfficialLoyaltyProperty = {
      providerPropertyId: `hbx:${code}`,
      programmeId,
      name,
      brand: chainName || null,
      subBrand: null,
      formattedAddress: address(hotel),
      imageUrl: imageUrl(hotel),
      awardAvailabilityPercent: null,
      observedPointsMin: null,
      observedPointsMedian: null,
      observedPointsMax: null,
      updatedAt: new Date().toISOString(),
      source: 'LICENSED_CONTENT',
      sourceName: 'HBX Hotel Content API',
      sourceUrl: HBX_CONTENT_DOCS,
    }
    out.set(`${programmeId}:${norm(name)}`, property)
  }

  return [...out.values()]
}
