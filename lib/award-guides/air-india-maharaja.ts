import type { PublishedFlightAwardGuide, PublishedFlightAwardGuideQuery } from './types'

export const AIR_INDIA_MAHARAJA_CALCULATOR_URL =
  'https://www.airindia.com/in/en/maharaja-club/points-calculator.html'
export const AIR_INDIA_MAHARAJA_GUIDE_CAPTURED_AT = '2026-09-03'

const caveat =
  'Air India says calculator amounts are tentative and fares depend on booking time and seat availability.'

function economyGuide(
  origin: string,
  destination: string,
  valueMin: number,
  valueMax: number,
  prime: number,
): PublishedFlightAwardGuide {
  return {
    programmeId: 'air-india-maharaja',
    programmeName: 'Air India Maharaja Club',
    origin,
    destination,
    cabin: 'economy',
    tripType: 'ONE_WAY',
    passengerScope: 'PER_PASSENGER',
    tiers: [
      { id: 'VALUE', label: 'Value fare', pointsMin: valueMin, pointsMax: valueMax },
      { id: 'PRIME', label: 'Prime fare', pointsMin: prime, pointsMax: prime },
    ],
    taxesState: 'NOT_PUBLISHED',
    authority: 'PLANNING_ONLY',
    evidence: {
      sourceKind: 'PROGRAMME_CALCULATOR',
      sourceUrl: AIR_INDIA_MAHARAJA_CALCULATOR_URL,
      capturedAt: AIR_INDIA_MAHARAJA_GUIDE_CAPTURED_AT,
      caveat,
    },
  }
}

/**
 * Directional, route-level captures from Air India's public points calculator.
 * Do not infer reverse routes, missing cabins, taxes, dates, or availability.
 */
export const AIR_INDIA_MAHARAJA_PUBLISHED_GUIDES: readonly PublishedFlightAwardGuide[] = [
  economyGuide('BLR', 'MAA', 1_500, 4_000, 8_000),
  economyGuide('DEL', 'GOI', 5_000, 7_500, 12_500),
  economyGuide('ATQ', 'BOM', 5_500, 8_500, 11_000),
  economyGuide('HYD', 'DXB', 12_000, 25_000, 30_000),
  economyGuide('DEL', 'SIN', 12_000, 30_000, 40_000),
  economyGuide('DEL', 'LHR', 35_000, 60_000, 70_000),
  economyGuide('DEL', 'SFO', 40_000, 75_000, 90_000),
  economyGuide('DEL', 'MEL', 40_000, 75_000, 90_000),
]

export function findAirIndiaMaharajaPublishedGuide(
  query: PublishedFlightAwardGuideQuery,
): PublishedFlightAwardGuide | null {
  if (query.programmeId !== 'air-india-maharaja') return null
  const origin = query.origin.trim().toUpperCase()
  const destination = query.destination.trim().toUpperCase()
  return AIR_INDIA_MAHARAJA_PUBLISHED_GUIDES.find((guide) =>
    guide.origin === origin &&
    guide.destination === destination &&
    guide.cabin === query.cabin,
  ) ?? null
}
