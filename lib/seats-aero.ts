// lib/seats-aero.ts
// seats.aero Pro API integration
// Docs: https://developers.seats.aero/reference/cached-search

const SEATS_AERO_BASE = 'https://seats.aero/partnerapi';

// Map program names to seats.aero source codes
const PROGRAM_TO_SOURCE: Record<string, string> = {
  'KrisFlyer': 'krisflyer',
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
  dataSource: 'seats.aero (live)' | 'estimated';
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
