'use client';

import { useState, useEffect } from 'react';

interface FlightOption {
  rank: number;
  badge?: string;
  airline: string;
  flightNo: string;
  departure: string;
  arrival: string;
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
  urls: { kayak: string; mmt: string; googleFlights: string };
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
  flights: FlightOption[];
  hotels: HotelOption[];
  tripSummary: {
    cheapestTotal: number;
    bestValueTotal: number;
    pointsCoveragePercent: number;
    recommendedStrategy: string;
  };
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'flights' | 'hotels'>('flights');

  useEffect(() => {
    if (!destination) return;
    setLoading(true);
    setError('');
    fetch('/api/trip-compare', {
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

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted, #64748b)', fontSize: 14 }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}></div>
      Comparing prices across platforms...
    </div>
  );

  if (error) return (
    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', color: '#dc2626', fontSize: 13 }}>
      {error}
    </div>
  );

  if (!data) return null;

  return (
    <div style={{ marginTop: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' as const, gap: 8 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 1.5, textTransform: 'uppercase' as const, marginBottom: 4 }}>
            Live price comparison
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text, #0f172a)' }}>
            {data.origin} {'->'} {data.destination} · {data.nights} nights
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted, #64748b)', maxWidth: 200, textAlign: 'right' as const, lineHeight: 1.4 }}>
          Estimated ranges . click to see live rates
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
      {activeTab === 'flights' && data.flights?.map((f, i) => (
        <div key={i} style={i === 0 ? bestCard : card}>
          {f.badge && <div style={badge}>{f.badge}</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted, #94a3b8)', background: 'var(--bg-surface, #f8fafc)', padding: '2px 8px', borderRadius: 100 }}>
                  #{f.rank}
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text, #0f172a)' }}>
                  {f.airline}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted, #64748b)' }}>{f.flightNo}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted, #64748b)', marginBottom: 6 }}>
                {f.departure} -> {f.arrival} . {f.duration} . {f.stops === 0 ? 'Non-stop' : `${f.stops} stop`}
              </div>
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
                {platformBtn(f.urls.kayak, 'Kayak', true)}
                {platformBtn(f.urls.mmt, 'MakeMyTrip')}
                {platformBtn(f.urls.googleFlights, 'Google Flights')}
              </div>
            </div>
            <div style={{ textAlign: 'right' as const, minWidth: 120 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', marginBottom: 4 }}>Return price range</div>
              <PriceRange min={f.cashPriceMin * 2} max={f.cashPriceMax * 2} />
              {f.pointsOption && (
                <div style={{ fontSize: 12, color: GOLD, marginTop: 4, fontWeight: 700 }}>
                  or {f.pointsNeeded.toLocaleString('en-IN')} pts
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Hotels */}
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
                {h.chain} . {h.area}
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
                {platformBtn(h.urls.booking, 'Booking.com', true)}
                {platformBtn(h.urls.mmt, 'MMT Hotels')}
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
        Prices are estimated ranges based on typical fares for this route  --  not live quotes. Click any platform button to see real-time pricing. Points calculations use standard transfer ratios and may vary.
      </div>
    </div>
  );
}
