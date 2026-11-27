/** Adult-only, one-way provider search input. Never silently re-price a family as one adult. */
export type FlightPartyValidation =
  | { ok: true; adults: number; fareBasis: 'TOTAL_FOR_REQUESTED_ADULTS' }
  | { ok: false; status: 400 | 422; code: string; detail: string }

export function validateFlightParty(query: URLSearchParams): FlightPartyValidation {
  const raw = query.get('adults')
  const adults = raw == null || raw === '' ? 1 : Number(raw)
  if ((raw != null && raw !== '' && !/^[1-9]$/.test(raw)) ||
      !Number.isSafeInteger(adults) || adults < 1 || adults > 9) {
    return { ok: false, status: 400, code: 'invalid_adult_count', detail: 'adults must be an integer between 1 and 9' }
  }

  for (const name of ['children', 'infants']) {
    const count = query.get(name)
    if (count != null && count !== '0' && count !== '') {
      return { ok: false, status: 422, code: 'child_fares_not_supported',
        detail: 'Child and infant prices require age-specific provider quotes. Do not use adult-only fares.' }
    }
  }
  for (const name of ['child_ages', 'children_ages', 'ages']) {
    if (query.get(name)) return { ok: false, status: 422, code: 'child_fares_not_supported',
      detail: 'Children need age-specific live fare validation.' }
  }
  if (query.get('return_date') || query.get('returnDate') ||
      query.get('round_trip') === 'true' || query.get('roundtrip') === 'true') {
    return { ok: false, status: 422, code: 'round_trip_requires_new_quote',
      detail: 'This endpoint currently provides one-way prices. Do not represent them as round-trip totals.' }
  }
  return { ok: true, adults, fareBasis: 'TOTAL_FOR_REQUESTED_ADULTS' }
}
