'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getApplyUrl } from '@/lib/affiliate';

interface TripResult {
  destination: string;
  dates: string;
  duration: string;
  tripType: string;
  summary: string;
  proTip: string;
  totalPointsNeeded: number;
  totalCashPrice: number;
  totalPointsValue: number;
  totalSaving: number;
  bestCard: string;
  bestCardId: string;
  userPoints: number;
  pointsGap: number;
  canAfford: boolean;
  flights: {
    option: string;
    airline: string;
    class: string;
    pointsNeeded: number;
    cashPrice: number;
    pointsValue: number;
    saving: number;
    cardNeeded: string;
    cardId: string;
    transferPartner: string;
    bookingUrl: string;
    available: boolean;
  }[];
  hotels: {
    name: string;
    chain: string;
    pointsNeeded: number;
    cashPrice: number;
    pointsValue: number;
    saving: number;
    cardNeeded: string;
    cardId: string;
    nights: number;
    available: boolean;
  }[];
}

const QUICK_TRIPS = [
  { label: 'London 5 nights', icon: '', query: 'Business trip to London for 5 nights next month' },
  { label: 'Dubai weekend', icon: '', query: 'Weekend trip to Dubai 3 nights this month' },
  { label: 'Singapore 4 nights', icon: '', query: 'Holiday in Singapore for 4 nights next month' },
  { label: 'Bangkok 5 nights', icon: '', query: 'Leisure trip Bangkok 5 nights' },
  { label: 'Goa long weekend', icon: '', query: 'Domestic trip Goa 3 nights long weekend' },
  { label: 'New York 7 nights', icon: '', query: 'Business trip New York 7 nights premium travel' },
];

const BANKS = ['HDFC', 'Axis', 'SBI', 'ICICI', 'IDFC', 'Amex', 'Kotak', 'AU', 'None'];

function TripPlannerPageInner() {
  const [query, setQuery] = useState('');
  const [points, setPoints] = useState('');
  const searchParams = useSearchParams();
  useEffect(() => {
    const urlPoints = searchParams.get('points');
    const urlBank = searchParams.get('bank');
    if (urlPoints) setPoints(urlPoints);
    if (urlBank) setCardBank(urlBank);
  }, [searchParams]);
  const [cardBank, setCardBank] = useState('HDFC');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TripResult | null>(null);
  const [error, setError] = useState('');

  const plan = async (overrideQuery?: string) => {
    const tripQuery = overrideQuery ?? query;
    if (!tripQuery.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/trip-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: tripQuery,
          userPoints: parseInt(points.replace(/,/g, '')) || 0,
          cardBank,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch {
      setError('Could not plan your trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #f8f9fc)' }}>
      <Header />
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px 100px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(201,151,46,0.12)', border: '1px solid rgba(201,151,46,0.3)', borderRadius: 100, padding: '5px 16px', marginBottom: 16 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9972E', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#C9972E', letterSpacing: 1.5, textTransform: 'uppercase' as const }}>AI Trip Planner</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, color: 'var(--text, #0f172a)', margin: '0 0 10px', letterSpacing: -1, lineHeight: 1.1 }}>
            Where are you going?
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-muted, #64748b)', margin: 0, lineHeight: 1.6, maxWidth: 480, marginInline: 'auto' }}>
            Tell us your trip. We'll find the best way to pay using your credit card points "" flights, hotels, everything.
          </p>
        </div>

        {/* Input card */}
        <div style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border, #e2e8f0)', borderRadius: 20, padding: 24, marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' as const, letterSpacing: 1, display: 'block', marginBottom: 8 }}>
              Describe your trip
            </label>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. Business trip to London for 5 nights next month, prefer business class..."
              rows={3}
              style={{
                width: '100%', padding: '12px 14px',
                background: 'var(--bg-surface, #f8fafc)',
                border: '1.5px solid var(--border, #e2e8f0)',
                borderRadius: 12, fontSize: 14,
                color: 'var(--text, #0f172a)',
                outline: 'none', resize: 'none' as const,
                fontFamily: 'inherit', lineHeight: 1.5,
                boxSizing: 'border-box' as const,
                position: 'relative', zIndex: 1,
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' as const, letterSpacing: 1, display: 'block', marginBottom: 8 }}>
                Your points balance
              </label>
              <input
                type="text"
                value={points}
                onChange={e => setPoints(e.target.value)}
                placeholder="e.g. 52,164"
                style={{
                  width: '100%', height: 44, padding: '0 14px',
                  background: 'var(--bg-surface, #f8fafc)',
                  border: '1.5px solid var(--border, #e2e8f0)',
                  borderRadius: 10, fontSize: 14,
                  color: 'var(--text, #0f172a)', outline: 'none',
                  boxSizing: 'border-box' as const,
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' as const, letterSpacing: 1, display: 'block', marginBottom: 8 }}>
                Your primary card bank
              </label>
              <select
                value={cardBank}
                onChange={e => setCardBank(e.target.value)}
                style={{
                  width: '100%', height: 44, padding: '0 14px',
                  background: 'var(--bg-surface, #f8fafc)',
                  border: '1.5px solid var(--border, #e2e8f0)',
                  borderRadius: 10, fontSize: 14,
                  color: 'var(--text, #0f172a)', outline: 'none',
                  cursor: 'pointer', boxSizing: 'border-box' as const,
                }}
              >
                {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={() => plan()}
            disabled={loading || !query.trim()}
            style={{
              width: '100%', height: 52,
              background: loading || !query.trim() ? '#cbd5e1' : 'linear-gradient(135deg, #C9972E, #E8B84B)',
              color: loading || !query.trim() ? '#94a3b8' : '#0a0a0a',
              border: 'none', borderRadius: 14,
              fontSize: 15, fontWeight: 800,
              cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? ' Planning your trip...' : ' Plan my trip with points ->'}
          </button>
        </div>

        {/* Quick chips */}
        {!result && !loading && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 12 }}>Quick ideas</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'center' }}>
              {QUICK_TRIPS.map((trip, i) => (
                <button key={i} onClick={() => { setQuery(trip.query); plan(trip.query); }} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                  background: 'var(--bg-card, #fff)', border: '1px solid var(--border, #e2e8f0)',
                  borderRadius: 100, fontSize: 13, fontWeight: 600,
                  color: 'var(--text, #0f172a)', cursor: 'pointer',
                }}>
                  <span>{trip.icon}</span><span>{trip.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}></div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text, #0f172a)', marginBottom: 8 }}>Finding the best options...</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted, #64748b)' }}>Checking flights, hotels, transfer partners and pricing</div>
          </div>
        )}

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 18px', color: '#dc2626', fontSize: 14, marginBottom: 20 }}>{error}</div>
        )}

        {result && (
          <div style={{ marginTop: 8 }}>
            {/* Summary */}
            <div style={{ background: 'linear-gradient(135deg, #1B3A5C, #0d2240)', borderRadius: 20, padding: '28px', marginBottom: 20, border: '1px solid rgba(201,151,46,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 6 }}>
                     {result.destination} . {result.duration} . {result.tripType}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{result.summary}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{result.dates}</div>
                </div>
                <div style={{ textAlign: 'right' as const }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>You save vs cash</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#22c55e' }}>Rs.{result.totalSaving.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div style={{ background: result.canAfford ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${result.canAfford ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: result.canAfford ? '#22c55e' : '#ef4444' }}>
                    {result.canAfford ? '" Your points cover this trip' : `  Need ${result.pointsGap.toLocaleString('en-IN')} more points`}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                    Need {result.totalPointsNeeded.toLocaleString('en-IN')} pts . You have {(parseInt(points.replace(/,/g, '')) || 0).toLocaleString('en-IN')} pts
                  </div>
                </div>
                {!result.canAfford && (
                  <Link href={`/cards/${result.bestCardId}`} style={{ padding: '8px 16px', background: '#C9972E', color: '#0a0a0a', borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                    Get {result.bestCard} '
                  </Link>
                )}
              </div>

              {result.proTip && <div style={{ marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, fontStyle: 'italic' as const }}>' {result.proTip}</div>}
            </div>

            {/* Flights */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 12 }}> Flight options</div>
              {result.flights.map((flight, i) => {
                const { url, label } = getApplyUrl(flight.cardId);
                return (
                  <div key={i} style={{ background: 'var(--bg-card, #fff)', border: i === 0 ? '2px solid rgba(201,151,46,0.4)' : '1px solid var(--border, #e2e8f0)', borderRadius: 16, padding: '18px 20px', marginBottom: 10, boxShadow: i === 0 ? '0 4px 16px rgba(201,151,46,0.1)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          {i === 0 && <span style={{ fontSize: 9, fontWeight: 700, color: '#C9972E', background: 'rgba(201,151,46,0.1)', border: '1px solid rgba(201,151,46,0.3)', padding: '2px 8px', borderRadius: 100, textTransform: 'uppercase' as const }}>Best value</span>}
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text, #0f172a)' }}>{flight.airline} . {flight.class}</span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted, #64748b)', marginBottom: 12 }}>{flight.option} via {flight.transferPartner}</div>
                        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' as const }}>
                          {[
                            { lbl: 'Points needed', val: flight.pointsNeeded.toLocaleString('en-IN'), col: '#C9972E' },
                            { lbl: 'Cash price', val: `Rs.${flight.cashPrice.toLocaleString('en-IN')}`, col: 'var(--text-muted, #94a3b8)', line: true },
                            { lbl: 'You save', val: `Rs.${flight.saving.toLocaleString('en-IN')}`, col: '#16a34a' },
                          ].map((s, j) => (
                            <div key={j}>
                              <div style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)' }}>{s.lbl}</div>
                              <div style={{ fontSize: 16, fontWeight: 800, color: s.col, textDecoration: s.line ? 'line-through' : 'none' }}>{s.val}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, minWidth: 130 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted, #64748b)', textAlign: 'center' as const }}>Best card: <strong>{flight.cardNeeded}</strong></div>
                        <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center' as const, padding: '10px', background: 'linear-gradient(135deg, #C9972E, #E8B84B)', color: '#0a0a0a', borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>{label}</a>
                        {flight.bookingUrl && <a href={flight.bookingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center' as const, padding: '8px', background: 'var(--bg-surface, #f8fafc)', color: 'var(--text, #0f172a)', borderRadius: 10, fontSize: 11, fontWeight: 600, textDecoration: 'none', border: '1px solid var(--border, #e2e8f0)' }}>Book on {flight.transferPartner}</a>}
                        <a href={`https://www.makemytrip.com/flights/`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', background: '#fff0f0', color: '#E8122D', borderRadius: 10, fontSize: 11, fontWeight: 700, textDecoration: 'none', border: '1px solid #fecaca', marginTop: 4 }}>
                          Search MakeMyTrip
                        </a>
                        <a href={`https://www.google.com/flights?q=flights+to+${encodeURIComponent(result.destination)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', background: '#f0f4ff', color: '#4285F4', borderRadius: 10, fontSize: 11, fontWeight: 700, textDecoration: 'none', border: '1px solid #c7d2fe', marginTop: 4 }}>
                          Google Flights
                        </a>
                        <a href={`https://www.makemytrip.com/flights/`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', background: '#fff0f0', color: '#E8122D', borderRadius: 10, fontSize: 11, fontWeight: 700, textDecoration: 'none', border: '1px solid #fecaca', marginTop: 4 }}>
                          Search MakeMyTrip
                        </a>
                        <a href={`https://www.google.com/flights?q=flights+to+${encodeURIComponent(result.destination)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', background: '#f0f4ff', color: '#4285F4', borderRadius: 10, fontSize: 11, fontWeight: 700, textDecoration: 'none', border: '1px solid #c7d2fe', marginTop: 4 }}>
                          Google Flights
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hotels */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 12 }}> Hotel options</div>
              {result.hotels.map((hotel, i) => {
                const { url, label } = getApplyUrl(hotel.cardId);
                return (
                  <div key={i} style={{ background: 'var(--bg-card, #fff)', border: i === 0 ? '2px solid rgba(34,197,94,0.3)' : '1px solid var(--border, #e2e8f0)', borderRadius: 16, padding: '18px 20px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          {i === 0 && <span style={{ fontSize: 9, fontWeight: 700, color: '#16a34a', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', padding: '2px 8px', borderRadius: 100, textTransform: 'uppercase' as const }}>Best value</span>}
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text, #0f172a)' }}>{hotel.name}</span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted, #64748b)', marginBottom: 12 }}>{hotel.chain} . {hotel.nights} nights</div>
                        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' as const }}>
                          {[
                            { lbl: 'Points needed', val: hotel.pointsNeeded.toLocaleString('en-IN'), col: '#C9972E' },
                            { lbl: 'Cash price', val: `Rs.${hotel.cashPrice.toLocaleString('en-IN')}`, col: 'var(--text-muted, #94a3b8)', line: true },
                            { lbl: 'You save', val: `Rs.${hotel.saving.toLocaleString('en-IN')}`, col: '#16a34a' },
                          ].map((s, j) => (
                            <div key={j}>
                              <div style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)' }}>{s.lbl}</div>
                              <div style={{ fontSize: 16, fontWeight: 800, color: s.col, textDecoration: s.line ? 'line-through' : 'none' }}>{s.val}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, minWidth: 130 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted, #64748b)', textAlign: 'center' as const }}>Best card: <strong>{hotel.cardNeeded}</strong></div>
                        <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center' as const, padding: '10px', background: 'linear-gradient(135deg, #C9972E, #E8B84B)', color: '#0a0a0a', borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>{label}</a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: 'center' }}>
              <button onClick={() => { setResult(null); setQuery(''); }} style={{ padding: '12px 28px', background: 'var(--bg-card, #fff)', border: '1px solid var(--border, #e2e8f0)', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'var(--text, #0f172a)', cursor: 'pointer' }}>
                Plan another trip
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function TripPlannerPage() {
  return (
    <Suspense fallback={<div />}>
      <TripPlannerPageInner />
    </Suspense>
  );
}
