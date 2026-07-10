// lib/seats-aero.ts
// seats.aero Pro API integration
// Docs: https://developers.seats.aero/reference/cached-search

const SEATS_AERO_BASE = 'https://seats.aero/partnerapi';

// Map program names to seats.aero source codes
const PROGRAM_TO_SOURCE: Record<string, string> = {
  'KrisFlyer': 'singapore',
  'Singapore Airlines': 'krisflyer',
  'Air India Flying Returns': 'flyingblue', // closest available
  'Emirates Skywards': 'emirates',
  'Etihad Guest': 'etihad',
  'British Avios': 'ba',
  'Turkish Miles&Smiles': 'turkish',
  'United MileagePlus': 'united',
  'American AAdvantage': 'american',
  'Delta SkyMiles': 'delta',
};

export interface SeatsAeroResult {
  available: boolean;
  mileageCost: number;       // J (business) mileage cost
  remainingSeats: number;    // J remaining seats
  airlines: string;          // e.g. "SQ"
  isDirect: boolean;
  source: string;            // e.g. "krisflyer"
  date: string;
  id: string;                // availability record ID — key for the trips lookup
  originAirport: string;
  destinationAirport: string;
  dataSource: 'seats.aero (live)' | 'estimated';
}

// Per-flight detail for ONE availability record. The cached-search endpoint does
// NOT carry flight numbers, times, or duration — those live only in the trips
// endpoint, one extra (credit-costing) call per availability.
export interface SeatsAeroTrip {
  flightNumbers: string;     // e.g. "SQ509" (comma-joined if multi-segment)
  carriers: string;          // e.g. "Singapore Airlines"
  aircraft: string;          // e.g. "Boeing 787-10"
  departsAt: string;         // ISO datetime
  arrivesAt: string;         // ISO datetime
  durationMinutes: number;
  stops: number;
  cabin: string;             // 'economy' | 'business' | 'first'
  mileageCost: number;
  totalTaxes: number;        // minor units of taxesCurrency, per seats.aero
  taxesCurrency: string;
  remainingSeats: number;
  originAirport: string;
  destinationAirport: string;
}

export async function searchAwardAvailability(
  origin: string,       // e.g. 'BLR'
  destination: string,  // e.g. 'SIN'
  startDate: string,    // e.g. '2026-06-28' (YYYY-MM-DD)
  endDate: string,      // e.g. '2026-07-05'
  program?: string,     // e.g. 'KrisFlyer'
  cabin: 'economy' | 'business' | 'first' = 'business'
): Promise<SeatsAeroResult[]> {
  const apiKey = process.env.SEATS_AERO_API_KEY;
  if (!apiKey) return [];

  try {
    const params = new URLSearchParams({
      origin_airport: origin,
      destination_airport: destination,
      start_date: startDate,
      end_date: endDate,
      take: '20',
      order_by: 'lowest_mileage',
    });

    // Add program filter if we know the source code
    if (program && PROGRAM_TO_SOURCE[program]) {
      params.set('sources', PROGRAM_TO_SOURCE[program]);
    }

    const res = await fetch(`${SEATS_AERO_BASE}/search?${params}`, {
      headers: {
        'Partner-Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache 1 hour
    });

    if (!res.ok) {
      console.error('seats.aero API error:', res.status, await res.text());
      return [];
    }

    const data = await res.json();
    const results: SeatsAeroResult[] = [];

    for (const item of data.data || []) {
      // Pick the right cabin fields
      let available = false;
      let mileageCost = 0;
      let remainingSeats = 0;
      let airlines = '';
      let isDirect = false;

      if (cabin === 'economy') {
        available = item.YAvailable;
        mileageCost = parseInt(item.YMileageCost || '0');
        remainingSeats = item.YRemainingSeats || 0;
        airlines = item.YAirlines || '';
        isDirect = item.YDirect || false;
      } else if (cabin === 'business') {
        available = item.JAvailable;
        mileageCost = parseInt(item.JMileageCost || '0');
        remainingSeats = item.JRemainingSeats || 0;
        airlines = item.JAirlines || '';
        isDirect = item.JDirect || false;
      } else if (cabin === 'first') {
        available = item.FAvailable;
        mileageCost = parseInt(item.FMileageCost || '0');
        remainingSeats = item.FRemainingSeats || 0;
        airlines = item.FAirlines || '';
        isDirect = item.FDirect || false;
      }

      if (available && mileageCost > 0) {
        results.push({
          available,
          mileageCost,
          remainingSeats,
          airlines,
          isDirect,
          source: item.Source || item.Route?.Source || '',
          date: item.Date || '',
          id: item.ID || '',
          originAirport: item.Route?.OriginAirport || item.OriginAirport || '',
          destinationAirport: item.Route?.DestinationAirport || item.DestinationAirport || '',
          dataSource: 'seats.aero (live)',
        });
      }
    }

    return results;
  } catch (err) {
    console.error('seats.aero fetch error:', err);
    return [];
  }
}

// Fetch per-flight trip details for one availability record (flight number,
// departure/arrival times, duration, exact stop count, taxes). This is a SECOND
// seats.aero call, keyed on the availability `ID`, and each call costs API
// credits — callers should cap how many awards they enrich.
// Returns the best (lowest-mileage, then fewest-stops) trip matching the cabin,
// or null if none / on error.
export async function getAvailabilityTrips(
  availabilityId: string,
  cabin: 'economy' | 'business' | 'first' = 'business'
): Promise<SeatsAeroTrip | null> {
  const apiKey = process.env.SEATS_AERO_API_KEY;
  if (!apiKey || !availabilityId) return null;

  try {
    const res = await fetch(`${SEATS_AERO_BASE}/trips/${encodeURIComponent(availabilityId)}`, {
      headers: {
        'Partner-Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache 1 hour
    });

    if (!res.ok) {
      console.error('seats.aero trips API error:', res.status);
      return null;
    }

    const data = await res.json();
    const trips: any[] = data.data || data.Trips || [];
    if (!trips.length) return null;

    // Prefer trips for the requested cabin that carry real mileage; if none
    // match the cabin, fall back to whatever the record has.
    const matches = trips.filter((t) => {
      const c = String(t.Cabin || '').toLowerCase();
      return c === cabin && (Number(t.MileageCost) || 0) > 0;
    });
    const pool = matches.length ? matches : trips;

    // Best = lowest mileage, then fewest stops.
    const best = pool.reduce((b, t) => {
      const bm = Number(b.MileageCost) || Number.MAX_SAFE_INTEGER;
      const tm = Number(t.MileageCost) || Number.MAX_SAFE_INTEGER;
      if (tm !== bm) return tm < bm ? t : b;
      return (Number(t.Stops) || 0) < (Number(b.Stops) || 0) ? t : b;
    });

    const aircraft = Array.isArray(best.Aircraft) ? best.Aircraft.join(', ') : (best.Aircraft || '');

    return {
      flightNumbers: best.FlightNumbers || '',
      carriers: best.Carriers || '',
      aircraft,
      departsAt: best.DepartsAt || '',
      arrivesAt: best.ArrivesAt || '',
      durationMinutes: Number(best.TotalDuration) || 0,
      stops: Number(best.Stops) || 0,
      cabin: String(best.Cabin || cabin).toLowerCase(),
      mileageCost: Number(best.MileageCost) || 0,
      totalTaxes: Number(best.TotalTaxes) || 0,
      taxesCurrency: best.TaxesCurrency || '',
      remainingSeats: Number(best.RemainingSeats) || 0,
      originAirport: best.OriginAirport || '',
      destinationAirport: best.DestinationAirport || '',
    };
  } catch (err) {
    console.error('seats.aero trips fetch error:', err);
    return null;
  }
}

// Convenience: get best business class option for a route + date range
export async function getBestBusinessClass(
  origin: string,
  destination: string,
  startDate: string,
  endDate: string,
  program?: string
): Promise<{ available: boolean; minMileage: number; seats: number; airlines: string; dataSource: string }> {
  const results = await searchAwardAvailability(origin, destination, startDate, endDate, program, 'business');

  if (!results.length) {
    return { available: false, minMileage: 0, seats: 0, airlines: '', dataSource: 'seats.aero (no data)' };
  }

  // Sort by mileage cost ascending
  results.sort((a, b) => a.mileageCost - b.mileageCost);
  const best = results[0];

  return {
    available: true,
    minMileage: best.mileageCost,
    seats: best.remainingSeats,
    airlines: best.airlines,
    dataSource: 'seats.aero (live)',
  };
}
