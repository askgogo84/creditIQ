'use client';

import { useState, useEffect } from 'react';
import { authedFetch } from '@/lib/authed-fetch';

interface FlightOption {
  rank: number;
  badge?: string;
  airline: string;
  flightNo: string | null;
  departure: string | null;
  arrival: string | null;
  duration: string;
  stops: number;
  cashPriceMin: number;
  cashPriceMax: number;
  cashPriceMid: number;
  pointsOption: boolean;
  pointsNeeded: number;
  pointsPartner: string;
  pointsSaving: number;
  canAfford: boolean;
  whyBest: string;
  // Real cached-fare fields (present only on the #1 card when a live fare exists)
  dataSource?: 'live' | 'estimated';
  airlineCode?: string;
  sampleDate?: string | null;
  source?: string;
  liveBookingLink?: string;
  urls: { kayak: string; mmt: string; googleFlights: string; easemytrip?: string; goibibo?: string };
}

interface HotelOption {
  rank: number;
  badge?: string;
  name: string;
  chain: string;
  stars: number;
  area: string;
  includes: string;
  cashPricePerNight: number;
  cashPriceTotal: number;
  pointsOption: boolean;
  pointsPerNight: number;
  pointsPartner: string;
  whyBest: string;
  urls: { booking: string; mmt: string };
}

interface CompareData {
  origin: string;
  destination: string;
  nights: number;
  cabin: string;
  priceNote: string;
  liveFare?: { price: number; airlineName: string; sampleDate: string | null; source: string } | null;
  flights: FlightOption[];
  hotels: HotelOption[];
  tripSummary: {
    cheapestTotal: number;
    bestValueTotal: number;
    pointsCoveragePercent: number;
    recommendedStrategy: string;
  };
}

// Cached fare from /api/fares (cron-populated cached_fares). `stale` = TP's
// expires_at is in the past; the UI demotes stale fares to estimates (no badge).
interface CachedFare {
  price_inr: number;
  airline: string | null;
  airlineName: string;
  flight_number: string | null;
  depart_date: string;
  return_date: string | null;
  found_at: string;
  source: string;
  expires_at: string | null;
  stale: boolean;
}

// "updated 6h ago" from an ISO timestamp — the freshness anchor for cached fares.
function relTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return 'recently';
  const mins = Math.max(1, Math.round((Date.now() - then) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

interface TripComparisonProps {
  destination: string;
  origin?: string;
  nights?: number;
  cabin?: string;
  userPoints?: number;
  cardBank?: string;
}

const GOLD = '#C9972E';
const NAVY = '#1B3A5C';

function Stars({ count }: { count: number }) {
  return (
    <span style={{ color: GOLD, fontSize: 11 }}>
      {''.repeat(count)}{''.repeat(5 - count)}
    </span>
  );
}

function PriceRange({ min, max }: { min: number; max: number }) {
  return (
    <span style={{ fontSize: 13, color: 'var(--text-muted, #64748b)' }}>
      Rs.{min.toLocaleString('en-IN')} - {max.toLocaleString('en-IN')}
    </span>
  );
}

export function TripComparison({ destination, origin = 'Bangalore', nights = 3, cabin = 'economy', userPoints = 0, cardBank = 'HDFC' }: TripComparisonProps) {
  const [data, setData] = useState<CompareData | null>(null);
  const [fares, setFares] = useState<CachedFare[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'flights' | 'hotels'>('flights');

  useEffect(() => {
    if (!destination) return;
    setLoading(true);
    setError('');
    authedFetch('/api/trip-compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination, origin, nights, cabin, userPoints, cardBank }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch(() => setError('Could not load comparison. Try again.'))
      .finally(() => setLoading(false));
  }, [destination, origin, nights, userPoints, cardBank]);

  // Parallel, independent read of the cron-cached real fares. Never blocks the
  // page: a miss/empty just means every card falls back to an estimate.
  useEffect(() => {
    if (!destination) return;
    setFares(null);
    const params = new URLSearchParams({ origin, destination });
    fetch(`/api/fares?${params.toString()}`)
      .then(r => r.json())
      .then(d => setFares(Array.isArray(d?.fares) ? d.fares : []))
      .catch(() => setFares([]));
  }, [destination, origin]);

  if (!destination) return null;

  const card: React.CSSProperties = {
    background: 'var(--bg-card, #fff)',
    border: '1px solid var(--border, #e2e8f0)',
    borderRadius: 16,
    padding: '16px 18px',
    marginBottom: 10,
  };

  const bestCard: React.CSSProperties = {
    ...card,
    border: `2px solid rgba(201,151,46,0.5)`,
    boxShadow: '0 2px 12px rgba(201,151,46,0.08)',
  };

  const badge: React.CSSProperties = {
    display: 'inline-block',
    fontSize: 9,
    fontWeight: 700,
    color: GOLD,
    background: 'rgba(201,151,46,0.1)',
    border: '1px solid rgba(201,151,46,0.3)',
    padding: '2px 8px',
    borderRadius: 100,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 8,
  };

  const platformBtn = (url: string, label: string, primary = false): React.ReactElement => (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '7px 14px',
        background: primary ? GOLD : 'var(--bg-surface, #f8fafc)',
        color: primary ? '#0a0a0a' : 'var(--text, #0f172a)',
        border: primary ? 'none' : '1px solid var(--border, #e2e8f0)',
        borderRadius: 8, fontSize: 12, fontWeight: 700,
        textDecoration: 'none', cursor: 'pointer',
      }}
    >
      {label} 
    </a>
  );

  // Honest loader: a real spinner that resolves when the trip-compare request
  // returns. No simulated "checking Kayak / scanning Booking.com" theatre.
  if (loading) return (
    <div style={{ marginTop: 24, textAlign: 'center' as const, padding: '40px 24px', background: 'var(--bg-card, #fff)', border: '1px solid var(--border, #e2e8f0)', borderRadius: 16 }}>
      <style>{`@keyframes ciqspin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ width: 28, height: 28, border: '3px solid var(--border, #e2e8f0)', borderTopColor: GOLD, borderRadius: '50%', display: 'inline-block', animation: 'ciqspin 0.8s linear infinite', marginBottom: 14 }} />
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text, #0f172a)' }}>Finding fares{'…'}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted, #64748b)', marginTop: 4 }}>{origin} {'->'} {destination} {'·'} {nights} nights</div>
    </div>
  );

  if (error) return (
    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', color: '#dc2626', fontSize: 13 }}>
      {error}
    </div>
  );

  if (!data) return null;

  // Real fare = cheapest FRESH cached fare (expired ones are demoted, never
  // badged). Overlaid on the #1 flight card only; everything else stays estimated.
  const realFare = (fares || []).find(f => !f.stale) || null;
  const hasLive = !!realFare;

  return (
    <div style={{ marginTop: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' as const, gap: 8 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 1.5, textTransform: 'uppercase' as const, marginBottom: 4 }}>
            Trip price comparison
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text, #0f172a)' }}>
            {data.origin} {'->'} {data.destination} . {data.nights} nights
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted, #64748b)', maxWidth: 210, textAlign: 'right' as const, lineHeight: 1.4 }}>
          {activeTab === 'hotels'
            ? 'Estimated typical rates'
            : hasLive
              ? 'Top fare is a real cached price . others are estimated ranges'
              : 'Estimated ranges . click to see live rates'}
        </div>
      </div>

      {/* Summary strip */}
      {data.tripSummary && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 10, marginBottom: 20,
          background: `linear-gradient(135deg, ${NAVY}, #0d2240)`,
          borderRadius: 16, padding: '16px 20px',
        }}>
          {[
            { label: 'Cheapest total', val: `Rs.${data.tripSummary.cheapestTotal.toLocaleString('en-IN')}` },
            { label: 'Best value total', val: `Rs.${data.tripSummary.bestValueTotal.toLocaleString('en-IN')}` },
            { label: 'Points can cover', val: `${data.tripSummary.pointsCoveragePercent}%` },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: 1 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: i === 2 ? '#4ade80' : '#fff' }}>{s.val}</div>
            </div>
          ))}
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Strategy</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{data.tripSummary.recommendedStrategy}</div>
          </div>
        </div>
      )}

      {/* Points vs Cash guide */}
      <div className="compare-guide-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <div style={{ background: 'rgba(201,151,46,0.07)', border: '1px solid rgba(201,151,46,0.2)', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#C9972E', letterSpacing: 1.5, textTransform: 'uppercase' as const, marginBottom: 8 }}>
            Redeem with points
          </div>
          {[
            { n: '1', text: 'Transfer ' + cardBank + ' points to loyalty program (HDFC SmartBuy)' },
            { n: '2', text: 'Search & book on KrisFlyer / Air India' },
            { n: '3', text: 'Use transferred miles to pay at checkout' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#C9972E', color: '#0a0a0a', fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{s.n}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted, #64748b)', lineHeight: 1.4 }}>{s.text}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, fontSize: 11, color: '#C9972E', fontWeight: 600 }}>
            Best value . up to 3x more than cashback
          </div>
        </div>
        <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', letterSpacing: 1.5, textTransform: 'uppercase' as const, marginBottom: 8 }}>
            Book with cash
          </div>
          {[
            { n: '1', text: 'Click "Search on Kayak" or "MakeMyTrip" below' },
            { n: '2', text: 'Destination is pre-filled  --  just pick dates' },
            { n: '3', text: 'Pay with your credit card to earn reward points' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#3b82f6', color: '#fff', fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{s.n}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted, #64748b)', lineHeight: 1.4 }}>{s.text}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, fontSize: 11, color: '#3b82f6', fontWeight: 600 }}>
            Instant . earn points on every booking
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['flights', 'hotels'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px', borderRadius: 100,
              border: activeTab === tab ? 'none' : '1px solid var(--border, #e2e8f0)',
              background: activeTab === tab ? GOLD : 'var(--bg-card, #fff)',
              color: activeTab === tab ? '#0a0a0a' : 'var(--text, #0f172a)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {tab === 'flights' ? ' Flights' : '🏨 Hotels'}
          </button>
        ))}
      </div>

      {/* Flights */}
      {activeTab === 'flights' && data.flights?.map((f, i) => {
        const isLive = i === 0 && !!realFare;
        return (
        <div key={i} style={i === 0 ? bestCard : card}>
          {f.badge && <div style={badge}>{f.badge}</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: 12 }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' as const }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted, #94a3b8)', background: 'var(--bg-surface, #f8fafc)', padding: '2px 8px', borderRadius: 100 }}>
                  #{f.rank}
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text, #0f172a)' }}>
                  {isLive && realFare ? realFare.airlineName : f.airline}
                </span>
                {(isLive && realFare?.flight_number)
                  ? <span style={{ fontSize: 12, color: 'var(--text-muted, #64748b)' }}>{realFare.flight_number}</span>
                  : (f.flightNo && <span style={{ fontSize: 12, color: 'var(--text-muted, #64748b)' }}>{f.flightNo}</span>)}
                {isLive && realFare && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase' as const, color: GOLD, background: 'rgba(201,151,46,0.12)', border: '1px solid rgba(201,151,46,0.35)', padding: '2px 8px', borderRadius: 100 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD }} /> Cached . updated {relTime(realFare.found_at)}
                  </span>
                )}
              </div>
              {f.departure && f.arrival && (
                <div style={{ fontSize: 13, color: 'var(--text-muted, #64748b)', marginBottom: 6 }}>
                  {f.departure} {'->'} {f.arrival} {'.'} {f.duration} {'.'} {f.stops === 0 ? 'Non-stop' : `${f.stops} stop`}
                </div>
              )}
              {f.pointsOption && (
                <div style={{ fontSize: 12, color: f.canAfford ? '#16a34a' : '#f59e0b', marginBottom: 8 }}>
                  {f.canAfford ? '(ok)' : '(!!)'} {f.pointsNeeded.toLocaleString('en-IN')} {cardBank} pts via {f.pointsPartner}
                  {f.pointsSaving > 0 && <span style={{ color: '#16a34a' }}> . Save Rs.{f.pointsSaving.toLocaleString('en-IN')}</span>}
                </div>
              )}
              <div style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', marginBottom: 12, fontStyle: 'italic' as const }}>
                {f.whyBest}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                {f.liveBookingLink && platformBtn(f.liveBookingLink, 'View fare', true)}
                {platformBtn(f.urls.kayak, 'Kayak', !f.liveBookingLink)}
                {platformBtn(f.urls.mmt, 'MakeMyTrip')}
                {platformBtn(f.urls.easemytrip || 'https://www.easemytrip.com', 'EaseMyTrip')}
                {platformBtn(f.urls.goibibo || 'https://www.goibibo.com', 'Goibibo')}
                {platformBtn(f.urls.googleFlights, 'Google Flights')}
              </div>
              {f.pointsOption && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(201,151,46,0.08)', border: '1px solid rgba(201,151,46,0.2)', borderRadius: 8, fontSize: 11, color: '#C9972E' }}>
                  To redeem {f.pointsNeeded.toLocaleString('en-IN')} pts: transfer from {cardBank} SmartBuy to {f.pointsPartner}, then book directly on {f.pointsPartner} site
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' as const, minWidth: 130 }}>
              {isLive && realFare ? (
                <>
                  <div style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', marginBottom: 4 }}>Round-trip fare</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text, #0f172a)' }}>
                    Rs.{realFare.price_inr.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted, #94a3b8)', marginTop: 4, lineHeight: 1.4, maxWidth: 160, marginLeft: 'auto' }}>
                    Cached cheapest via Travelpayouts . updated {relTime(realFare.found_at)}{realFare.depart_date ? ` . sample ${realFare.depart_date}` : ''} . not your exact dates
                  </div>
                </>
              ) : (
                <>
                  <span style={{ display: 'inline-block', fontSize: 9, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase' as const, color: '#8A857B', background: 'rgba(138,133,123,0.12)', border: '1px solid rgba(138,133,123,0.3)', padding: '2px 8px', borderRadius: 100, marginBottom: 4 }}>
                    Estimated
                  </span>
                  <div style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', marginBottom: 4 }}>Return price range</div>
                  <PriceRange min={f.cashPriceMin * 2} max={f.cashPriceMax * 2} />
                </>
              )}
              {f.pointsOption && (
                <div style={{ fontSize: 12, color: GOLD, marginTop: 4, fontWeight: 700 }}>
                  or {f.pointsNeeded.toLocaleString('en-IN')} pts
                </div>
              )}
            </div>
          </div>
        </div>
        );
      })}

      {/* Hotels */}
      {activeTab === 'hotels' && (
        <div style={{ fontSize: 11, color: 'var(--text-muted, #64748b)', marginBottom: 12 }}>
          Hotel prices are <strong>estimated typical rates</strong> {'—'} not live quotes.
        </div>
      )}
      {activeTab === 'hotels' && data.hotels?.map((h, i) => (
        <div key={i} style={i === 0 ? bestCard : card}>
          {h.badge && <div style={badge}>{h.badge}</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' as const }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted, #94a3b8)', background: 'var(--bg-surface, #f8fafc)', padding: '2px 8px', borderRadius: 100 }}>
                  #{h.rank}
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text, #0f172a)' }}>{h.name}</span>
                <Stars count={h.stars} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted, #64748b)', marginBottom: 4 }}>
                {h.chain} {'.'} {h.area}
              </div>
              {h.includes && (
                <div style={{ fontSize: 12, color: '#16a34a', marginBottom: 4 }}>(ok) {h.includes}</div>
              )}
              {h.pointsOption && (
                <div style={{ fontSize: 12, color: GOLD, marginBottom: 8 }}>
                  {h.pointsPerNight.toLocaleString('en-IN')} pts/night via {h.pointsPartner}
                </div>
              )}
              <div style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', marginBottom: 12, fontStyle: 'italic' as const }}>
                {h.whyBest}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                {platformBtn(h.urls.booking, 'Book on Booking.com', true)}
                {platformBtn(h.urls.mmt, 'MakeMyTrip Hotels')}
              </div>
            </div>
            <div style={{ textAlign: 'right' as const, minWidth: 130 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', marginBottom: 4 }}>Per night</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text, #0f172a)' }}>
                Rs.{h.cashPricePerNight.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted, #64748b)', marginTop: 2 }}>
                Rs.{h.cashPriceTotal.toLocaleString('en-IN')} total
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Disclaimer */}
      <div style={{
        marginTop: 16, padding: '10px 14px',
        background: 'rgba(201,151,46,0.06)',
        border: '1px solid rgba(201,151,46,0.15)',
        borderRadius: 10, fontSize: 11,
        color: 'var(--text-muted, #64748b)', lineHeight: 1.5,
      }}>
        {hasLive && realFare
          ? `The top flight is a real cached cheapest fare from Travelpayouts${realFare.depart_date ? ` (sample date ${realFare.depart_date})` : ''}, updated ${relTime(realFare.found_at)} — for that sample date, not your exact dates. Other flights and all hotels are estimated ranges based on typical fares. Click any platform button for real-time pricing. Points calculations use standard transfer ratios and may vary.`
          : `Prices are estimated ranges based on typical fares for this route — not live quotes. Click any platform button to see real-time pricing. Points calculations use standard transfer ratios and may vary.`}
      </div>
    </div>
  );
}
