import type { CashFlight } from '@/lib/fusion-core'
import type { SeatsAeroResult } from '@/lib/seats-aero'

const AIRLINE_NAMES: Record<string, string> = {
  AI: 'Air India',
  '6E': 'IndiGo',
  IX: 'Air India Express',
  QP: 'Akasa Air',
  SG: 'SpiceJet',
  UK: 'Vistara',
}

function dayOf(iso: string): string {
  return (iso || '').slice(0, 10)
}

function carrierCode(value: string): string {
  const normalized = (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  return /^[A-Z0-9]{2}$/.test(normalized) ? normalized : ''
}

function awardCarriesCarrier(award: SeatsAeroResult, code: string): boolean {
  const raw = (award.airlines || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!raw || !code) return false
  return raw.includes(code)
}

/**
 * Bind an award record to a concrete cash itinerary only when the award evidence
 * is date-specific live evidence and its carrier identity is compatible.
 *
 * Cached discovery is intentionally never attached to a cash itinerary. A cached
 * Aeroplan/other programme record can be useful discovery evidence, but without
 * live itinerary identity it must not turn every Air India/IndiGo cash row into
 * an apparent Aeroplan flight merely because the dates match.
 */
export function matchAwardToCashFlight(
  flight: CashFlight,
  awards: SeatsAeroResult[],
  pricingAuthority: string | null | undefined,
): SeatsAeroResult | null {
  if (pricingAuthority !== 'DATE_SPECIFIC_LIVE') return null

  const flightDay = dayOf(flight.departure)
  const flightCarrier = carrierCode(flight.airline)

  const candidates = awards.filter(award => {
    if (flightDay && dayOf(award.date) && dayOf(award.date) !== flightDay) return false

    // A concrete live cash carrier requires concrete compatible carrier evidence
    // on the award. Missing award carrier identity is not enough to claim a match.
    if (flightCarrier && !awardCarriesCarrier(award, flightCarrier)) return false

    return true
  })

  if (!candidates.length) return null
  return candidates.reduce((best, award) => award.mileageCost < best.mileageCost ? award : best)
}

export function cashSourceCabinVerified(source: unknown, providerFlag: unknown): boolean {
  if (providerFlag === false) return false
  return ['skyscanner-live', 'amadeus', 'kiwi-mcp', 'kiwi'].includes(String(source || ''))
}

export function airlineDisplayName(value: string | null | undefined): string {
  const code = carrierCode(value || '')
  return code ? (AIRLINE_NAMES[code] || code) : (value || 'Airline not identified')
}
