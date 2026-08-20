// lib/cheapest-cash.ts
// Cheapest cash fare for a route via Travelpayouts (prices/cheap). Extracted
// verbatim from app/api/trip-planner/live-price/route.ts so both the live-price
// route AND the Fly-on-Points "Show cash price" endpoint share ONE implementation
// (no drift, one token-handling place). Behaviour unchanged.
//
// Cash is enrichment: every failure path returns null, never throws — the caller
// degrades to "no cash price", it never 5xxes the response.

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
