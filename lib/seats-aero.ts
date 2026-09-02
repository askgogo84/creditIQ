// lib/seats-aero.ts
// seats.aero Pro API integration
// Docs: https://developers.seats.aero/reference/cached-search

const SEATS_AERO_BASE = 'https://seats.aero/partnerapi';
const CACHED_SEARCH_MAX = 1000;

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
  mileageCost: number;
  remainingSeats: number;
  airlines: string;
  isDirect: boolean;
  source: string;
  date: string;
  id: string;
  originAirport: string;
  destinationAirport: string;
  dataSource: 'seats.aero (live)' | 'estimated';
  yMileageCost: number;
  jMileageCost: number;
}

export interface SeatsAeroTrip {
  flightNumbers: string;
  carriers: string;
  aircraft: string;
  departsAt: string;
  arrivesAt: string;
  durationMinutes: number;
  stops: number;
  cabin: string;
  mileageCost: number;
  totalTaxes: number;
  taxesCurrency: string;
  remainingSeats: number;
  originAirport: string;
  destinationAirport: string;
}

export async function searchAwardAvailability(
  origin: string,
  destination: string,
  startDate: string,
  endDate: string,
  program?: string,
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
      // Cached Search accepts up to 1000 rows per request. The old integration
      // silently asked for only 20, which made Travel look much thinner than the
      // provider inventory. The Trips enrichment cap remains separate: summary
      // award rows stay visible even when we only enrich a few of them.
      take: String(CACHED_SEARCH_MAX),
      order_by: 'lowest_mileage',
    });

    if (program && PROGRAM_TO_SOURCE[program]) {
      params.set('sources', PROGRAM_TO_SOURCE[program]);
    }

    const res = await fetch(`${SEATS_AERO_BASE}/search?${params}`, {
      headers: {
        'Partner-Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error('seats.aero API error:', res.status, await res.text());
      return [];
    }

    const data = await res.json();
    const results: SeatsAeroResult[] = [];

    for (const item of data.data || []) {
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
          yMileageCost: parseInt(item.YMileageCost || '0') || 0,
          jMileageCost: parseInt(item.JMileageCost || '0') || 0,
        });
      }
    }

    return results;
  } catch (err) {
    console.error('seats.aero fetch error:', err);
    return [];
  }
}

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
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error('seats.aero trips API error:', res.status);
      return null;
    }

    const data = await res.json();
    const trips: any[] = data.data || data.Trips || [];
    if (!trips.length) return null;

    const matches = trips.filter((t) => {
      const c = String(t.Cabin || '').toLowerCase();
      return c === cabin && (Number(t.MileageCost) || 0) > 0;
    });
    const pool = matches.length ? matches : trips;

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
