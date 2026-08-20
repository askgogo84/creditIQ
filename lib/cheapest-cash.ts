// lib/cheapest-cash.ts
// Cheapest cash fare for a route via Travelpayouts. Two scopes:
//
//   fetchCashForDate()  — v3 prices_for_dates, departure_at = the row's DATE. This
//                         is the one we want: same-date, same-trip as the award, so
//                         the points-vs-cash verdict is a like-for-like comparison.
//   fetchCheapestCash() — v1 prices/cheap, ROUTE-level cheapest (no date). Kept as
//                         the EXPLICIT fallback when the per-date call fails or the
//                         date has no cached fare, and used by live-price/route.ts.
//
// Cash is enrichment: every failure path returns null, never throws — the caller
// degrades to "no cash price" / falls back, it never 5xxes the response.
//
// direct / one_way are left unset (Travelpayouts defaults), unchanged from the
// original route-level call.

// v3 per-date: cheapest fare DEPARTING `date` (YYYY-MM-DD). null on failure / no
// fare for that exact date -> caller falls back to route-level.
export async function fetchCashForDate(
  origin: string,
  destination: string,
  date: string,
  signal?: AbortSignal,
): Promise<number | null> {
  const token = process.env.TRAVELPAYOUTS_TOKEN || '';
  if (!token || !date) return null;
  try {
    const url = new URL('https://api.travelpayouts.com/aviasales/v3/prices_for_dates');
    url.searchParams.set('origin', origin);
    url.searchParams.set('destination', destination);
    url.searchParams.set('departure_at', date); // exact date
    url.searchParams.set('currency', 'inr');
    url.searchParams.set('sorting', 'price');
    url.searchParams.set('limit', '30');
    const res = await fetch(url.toString(), {
      headers: { 'X-Access-Token': token },
      next: { revalidate: 3600 },
      signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rows: any[] = Array.isArray(data?.data) ? data.data : [];
    let min: number | null = null;
    for (const r of rows) {
      // v3 can echo nearby departures — keep only the exact date we asked for.
      if (String(r?.departure_at || '').slice(0, 10) !== date) continue;
      const price = Number(r?.price);
      if (price > 0 && (min === null || price < min)) min = price;
    }
    return min;
  } catch {
    return null;
  }
}

// v1 route-level: cheapest fare on the route, no date. The fallback + live-price.
export async function fetchCheapestCash(
  origin: string,
  destination: string,
  signal?: AbortSignal,
): Promise<number | null> {
  const token = process.env.TRAVELPAYOUTS_TOKEN || '';
  if (!token) return null;
  try {
    const url = new URL('https://api.travelpayouts.com/v1/prices/cheap');
    url.searchParams.set('origin', origin);
    url.searchParams.set('destination', destination);
    url.searchParams.set('currency', 'INR');
    // Token goes in the X-Access-Token header ONLY — never the query string, which
    // would leak it into edge/access logs (same fix as cron/refresh-fares).
    const res = await fetch(url.toString(), {
      headers: { 'X-Access-Token': token },
      next: { revalidate: 3600 }, // cache 1 hour
      signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const entries = data?.data?.[destination];
    if (!entries || typeof entries !== 'object') return null;
    let min: number | null = null;
    for (const k of Object.keys(entries)) {
      const price = Number(entries[k]?.price);
      if (price > 0 && (min === null || price < min)) min = price;
    }
    return min;
  } catch {
    return null; // cash is enrichment — never fail the whole response on it
  }
}
