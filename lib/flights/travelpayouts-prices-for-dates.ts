export type TravelpayoutsDatedFare = {
  id: string
  price: number
  airline: string
  airlines: string[]
  from: string
  to: string
  departure: string
  arrival: string
  duration: number
  durationSeconds: number
  stops: number
  segments: Array<{
    from: string
    to: string
    airline: string
    flightNo: string
    departure: string
    arrival: string
  }>
  bookingLink: string
  provider: 'travelpayouts-v3'
  cashCabin: 'economy-assumed'
}

/**
 * Normalize Aviasales/Travelpayouts v3 prices_for_dates records.
 *
 * Important: this endpoint is cached fare discovery (found by Aviasales users in
 * the last 48h), not a GDS live-booking response. The API does not return a cabin
 * field, so cashCabin is deliberately `economy-assumed`; Business award searches
 * must not present this number as a verified Business cash fare.
 */
export function normalizeTravelpayoutsPricesForDates(
  data: any,
  from: string,
  to: string,
  marker = '',
): TravelpayoutsDatedFare[] {
  const rows = Array.isArray(data?.data) ? data.data : []
  return rows.flatMap((row: any, index: number) => {
    const price = Number(row?.price)
    if (!(price > 0)) return []

    const airline = String(row?.airline || 'Various')
    const departure = String(row?.departure_at || '')
    const durationMinutes = Number(row?.duration_to ?? row?.duration ?? 0)
    const originAirport = String(row?.origin_airport || from)
    const destinationAirport = String(row?.destination_airport || to)
    const flightNoRaw = row?.flight_number == null ? '' : String(row.flight_number)
    const linkPath = typeof row?.link === 'string' ? row.link : ''
    const baseLink = linkPath
      ? `https://www.aviasales.com${linkPath.startsWith('/') ? '' : '/'}${linkPath}`
      : `https://www.aviasales.com/search/${from}${to}`
    const bookingLink = marker
      ? `${baseLink}${baseLink.includes('?') ? '&' : '?'}marker=${encodeURIComponent(marker)}`
      : baseLink

    return [{
      id: `tpv3-${index}-${airline}-${flightNoRaw || 'fare'}-${departure || 'date'}`,
      price,
      airline,
      airlines: airline && airline !== 'Various' ? [airline] : [],
      from: originAirport,
      to: destinationAirport,
      departure,
      // prices_for_dates does not expose arrival_at; do not fabricate one.
      arrival: '',
      duration: durationMinutes > 0 ? Math.round(durationMinutes / 60) : 0,
      durationSeconds: durationMinutes > 0 ? durationMinutes * 60 : 0,
      stops: Number.isFinite(Number(row?.transfers)) ? Math.max(0, Number(row.transfers)) : 0,
      segments: flightNoRaw ? [{
        from: originAirport,
        to: destinationAirport,
        airline,
        flightNo: `${airline}${flightNoRaw}`,
        departure,
        arrival: '',
      }] : [],
      bookingLink,
      provider: 'travelpayouts-v3',
      cashCabin: 'economy-assumed',
    }]
  })
}
