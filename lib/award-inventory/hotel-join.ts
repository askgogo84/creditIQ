import type { AwardWalletHotelAwardRate } from './providers/awardwallet'

export type HotelAwardJoinConfidence = 'EXACT' | 'HIGH'

export interface CashHotelJoinInput {
  id: string
  hotelName: string
  chainName: string | null
  latitude: number | null
  longitude: number | null
}

export interface HotelAwardJoin {
  cashHotelId: string
  awardHotelName: string
  confidence: HotelAwardJoinConfidence
  reasons: string[]
  rates: AwardWalletHotelAwardRate[]
}

const STOP = new Set([
  'hotel', 'hotels', 'resort', 'resorts', 'the', 'by', 'and', 'at', 'a', 'an',
  'collection', 'international', 'property', 'suite', 'suites',
])

function normalizedName(value: string): string {
  return value.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '')
}

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2 && !STOP.has(token))
}

function tokenOverlap(a: string, b: string): { shared: number; minRatio: number; maxRatio: number } {
  const left = new Set(tokens(a))
  const right = new Set(tokens(b))
  let shared = 0
  for (const token of left) if (right.has(token)) shared += 1
  const minSize = Math.min(left.size, right.size)
  const maxSize = Math.max(left.size, right.size)
  return {
    shared,
    minRatio: minSize ? shared / minSize : 0,
    maxRatio: maxSize ? shared / maxSize : 0,
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = Math.PI / 180
  const dLat = (lat2 - lat1) * rad
  const dLon = (lon2 - lon1) * rad
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function validCoord(value: number | null): value is number {
  return value != null && Number.isFinite(value)
}

function bestPropertyMatch(
  cash: CashHotelJoinInput,
  groups: Array<{ name: string; latitude: number | null; longitude: number | null; rates: AwardWalletHotelAwardRate[] }>,
): { group: typeof groups[number]; confidence: HotelAwardJoinConfidence; reasons: string[] } | null {
  const cashNorm = normalizedName(cash.hotelName)

  for (const group of groups) {
    if (cashNorm && cashNorm === normalizedName(group.name)) {
      return { group, confidence: 'EXACT', reasons: ['Normalised property names match exactly.'] }
    }
  }

  const candidates = groups.flatMap((group) => {
    const overlap = tokenOverlap(cash.hotelName, group.name)
    const distance = validCoord(cash.latitude) && validCoord(cash.longitude) &&
      validCoord(group.latitude) && validCoord(group.longitude)
      ? haversineKm(cash.latitude, cash.longitude, group.latitude, group.longitude)
      : null

    const coordStrong = distance != null && distance <= 0.35 && overlap.shared >= 1 && overlap.minRatio >= 0.5
    const nameStrong = overlap.shared >= 2 && overlap.minRatio >= 0.85 && overlap.maxRatio >= 0.65
    if (!coordStrong && !nameStrong) return []

    const score = (coordStrong ? 100 : 0) + overlap.minRatio * 10 + overlap.maxRatio * 5 - (distance ?? 1)
    const reasons = [
      ...(coordStrong ? [`Coordinates are within ${distance!.toFixed(2)} km.`] : []),
      `Property-name token overlap is ${Math.round(overlap.minRatio * 100)}% of the shorter name.`,
    ]
    return [{ group, confidence: 'HIGH' as const, reasons, score }]
  }).sort((a, b) => b.score - a.score)

  if (!candidates.length) return null
  if (candidates.length > 1 && Math.abs(candidates[0].score - candidates[1].score) < 1) return null
  const best = candidates[0]
  return { group: best.group, confidence: best.confidence, reasons: best.reasons }
}

/**
 * Join only exact/high-confidence properties. Ambiguous or weak matches stay
 * unjoined; CreditIQ must never attach another hotel's award price to a cash row.
 */
export function joinHotelAwardRates(
  cash: CashHotelJoinInput,
  rates: AwardWalletHotelAwardRate[],
): HotelAwardJoin | null {
  const grouped = new Map<string, { name: string; latitude: number | null; longitude: number | null; rates: AwardWalletHotelAwardRate[] }>()

  for (const rate of rates) {
    const key = `${normalizedName(rate.hotelName)}|${rate.latitude ?? ''}|${rate.longitude ?? ''}`
    const existing = grouped.get(key)
    if (existing) existing.rates.push(rate)
    else grouped.set(key, { name: rate.hotelName, latitude: rate.latitude, longitude: rate.longitude, rates: [rate] })
  }

  const match = bestPropertyMatch(cash, [...grouped.values()])
  if (!match) return null

  return {
    cashHotelId: cash.id,
    awardHotelName: match.group.name,
    confidence: match.confidence,
    reasons: match.reasons,
    rates: [...match.group.rates].sort((a, b) =>
      a.totalPoints - b.totalPoints || (a.totalCashMinor ?? Number.MAX_SAFE_INTEGER) - (b.totalCashMinor ?? Number.MAX_SAFE_INTEGER),
    ),
  }
}
