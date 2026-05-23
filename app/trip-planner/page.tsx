'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getApplyUrl } from '@/lib/affiliate';

interface TripResult {
  destination: string;
  dates: string;
  duration: string;
  tripType: string;
  flights: {
    option: string;
    airline: string;
    pointsNeeded: number;
    cashPrice: number;
    pointsValue: number;
    saving: number;
    cardNeeded: string;
    cardId: string;
    transferPartner: string;
    bookingUrl: string;
    class: string;
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
  totalPointsNeeded: number;
  totalCashPrice: number;
  totalPointsValue: number;
  totalSaving: number;
  bestCard: string;
  bestCardId: string;
  summary: string;
  proTip: string;
  userPoints: number;
  pointsGap: number;
  canAfford: boolean;
}

const QUICK_TRIPS = [
  { label: 'London 5 nights', icon: '🇬🇧', query: 'Business trip to London for 5 nights next month' },
  { label: 'Dubai weekend', icon: '🇦🇪', query: 'Weekend trip to Dubai 3 nights this month' },
  { label: 'Singapore 4 nights', icon: '🇸🇬', query: 'Holiday in Singapore for 4 nights next month' },
  { label: 'Bangkok 5 nights', icon: '🇹🇭', query: 'Leisure trip Bangkok 5 nights budget travel' },
  { label: 'Goa long weekend', icon: '🌴', query: 'Domestic trip Goa 3 nights long weekend' },
  { label: 'New York 7 nights', icon: '🇺🇸', query: 'Business trip New York 7 nights premium travel' },
];

export default function TripPlannerPage() {
  const [query, setQuery] = useState('');
  const [points, setPoints] = useState('');
  const [cardBank, setCardBank] = useState('HDFC');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TripResult | null>(null);
  const [error, setError] = useState('');

  const plan = async (q?: string) => {
    const tripQuery = q || query;
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
    } catch (err: any) {
      setError('Could not plan your trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const BANKS = ['HDFC', 'Axis', 'SBI', 'ICICI', 'IDFC', 'Amex', 'Kotak', 'AU', 'None'];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #08080E)' }}>
      <Header />

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 100px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(201,151,46,0.1)', border: '1px solid rgba(201,151,46,0.25)',
            borderRadius: 100, padding: '5px 16px', marginBottom: 16,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9972E', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#C9972E', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              AI Trip Planner
            </span>
          </div>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 900,
            color: 'var(--text, #f0f0ff)', margin: '0 0 12px',
            letterSpacing: -1, lineHeight: 1.1,
          }}>
            Where are you going?
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-muted, #8888AA)', margin: 0, lineHeight: 1.6, maxWidth: 500, marginInline: 'auto' }}>
            Tell us your trip. We'll find the best way to pay using your credit card points — flights, hotels, everything.
          </p>
        </div>

        {/* Input card */}
        <div style={{
          background: 'var(--bg-card, #111118)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: 24, marginBottom: 20,
        }}>
          {/* Trip query */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #8888AA)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>
              Describe your trip
            </label>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. Business trip to London for 5 nights next month, prefer business class..."
              rows={3}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); plan(); } }}
              style={{
                width: '100%', padding: '14px 16px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, fontSize: 15,
                color: 'var(--text, #f0f0ff)',
                outline: 'none', resize: 'none',
                fontFamily: 'inherit', lineHeight: 1.5,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Points + bank */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #8888AA)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>
                Your points balance (optional)
              </label>
              <input
                type="text"
                value={points}
                onChange={e => setPoints(e.target.value)}
                placeholder="e.g. 52,164"
                style={{
                  width: '100%', height: 44, padding: '0 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, fontSize: 14,
                  color: 'var(--text, #f0f0ff)', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #8888AA)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>
                Your primary card bank
              </label>
              <select
                value={cardBank}
                onChange={e => setCardBank(e.target.value)}
                style={{
                  width: '100%', height: 44, padding: '0 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, fontSize: 14,
                  color: 'var(--text, #f0f0ff)', outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {BANKS.map(b => <option key={b} value={b} style={{ background: '#111' }}>{b}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={() => plan()}
            disabled={loading || !query.trim()}
            style={{
              width: '100%', height: 52,
              background: loading || !query.trim() ? 'rgba(201,151,46,0.3)' : 'linear-gradient(135deg, #C9972E, #E8B84B)',
              color: loading || !query.trim() ? 'rgba(255,255,255,0.4)' : '#0a0a0a',
              border: 'none', borderRadius: 14,
              fontSize: 15, fontWeight: 800,
              cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', letterSpacing: 0.3,
            }}
          >
            {loading ? '✈️ Planning your trip...' : '✈️ Plan my trip with points →'}
          </button>
        </div>

        {/* Quick trip chips */}
        {!result && !loading && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #8888AA)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, textAlign: 'center' }}>
              Quick ideas
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {QUICK_TRIPS.map((trip, i) => (
                <button key={i} onClick={() => { setQuery(trip.query); plan(trip.query); }} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 100, fontSize: 13, fontWeight: 600,
                  color: 'var(--text, #f0f0ff)', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}>
                  <span>{trip.icon}</span>
                  <span>{trip.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16, animation: 'pulse 1.5s infinite' }}>✈️</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text, #f0f0ff)', marginBottom: 8 }}>
              Finding the best options for your trip...
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted, #8888AA)' }}>
              Checking flights, hotels, transfer partners and live pricing
            </div>
            <style>{`@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }`}</style>
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '14px 18px', color: '#ef4444', fontSize: 14, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ marginTop: 8 }}>

            {/* Summary banner */}
            <div style={{
              background: 'linear-gradient(135deg, #1B3A5C, #0d2240)',
              borderRadius: 20, padding: '28px 28px',
              marginBottom: 20,
              border: '1px solid rgba(201,151,46,0.2)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
                    ✈️ {result.destination} · {result.duration} · {result.tripType}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{result.summary}</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>{result.dates}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>You save</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: '#22c55e' }}>
                    Rs.{result.totalSaving.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>vs paying cash</div>
                </div>
              </div>

              {/* Points affordability */}
              <div style={{
                background: result.canAfford ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                border: `1px solid ${result.canAfford ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                borderRadius: 12, padding: '12px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: result.canAfford ? '#22c55e' : '#ef4444' }}>
                    {result.canAfford ? '✓ Your points cover this trip' : `⚠️ You need ${result.pointsGap.toLocaleString('en-IN')} more points`}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                    Need {result.totalPointsNeeded.toLocaleString('en-IN')} pts · You have {result.userPoints.toLocaleString('en-IN')} pts
                  </div>
                </div>
                {!result.canAfford && (
                  <Link href={`/cards/${result.bestCardId}`} style={{
                    padding: '8px 16px', background: '#C9972E', color: '#0a0a0a',
                    borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
                  }}>
                    Get {result.bestCard} →
                  </Link>
                )}
              </div>

              {/* Pro tip */}
              {result.proTip && (
                <div style={{ marginTop: 14, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, fontStyle: 'italic' }}>
                  💡 {result.proTip}
                </div>
              )}
            </div>

            {/* Flights */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #8888AA)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                ✈️ Flight options
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {result.flights.map((flight, i) => {
                  const { url, label } = getApplyUrl(flight.cardId);
                  return (
                    <div key={i} style={{
                      background: 'var(--bg-card, #111118)',
                      border: i === 0 ? '1px solid rgba(201,151,46,0.3)' : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 16, padding: '18px 20px',
                      opacity: flight.available ? 1 : 0.6,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            {i === 0 && <span style={{ fontSize: 9, fontWeight: 700, color: '#C9972E', background: 'rgba(201,151,46,0.15)', border: '1px solid rgba(201,151,46,0.3)', padding: '2px 8px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: 0.5 }}>Best value</span>}
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text, #f0f0ff)' }}>{flight.airline} · {flight.class}</span>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted, #8888AA)', marginBottom: 8 }}>
                            {flight.option} via {flight.transferPartner}
                          </div>
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted, #8888AA)' }}>Points needed</div>
                              <div style={{ fontSize: 16, fontWeight: 800, color: '#C9972E' }}>{flight.pointsNeeded.toLocaleString('en-IN')}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted, #8888AA)' }}>Cash price</div>
                              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text, #f0f0ff)', textDecoration: 'line-through', opacity: 0.5 }}>Rs.{flight.cashPrice.toLocaleString('en-IN')}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted, #8888AA)' }}>Points value</div>
                              <div style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>Rs.{flight.pointsValue.toLocaleString('en-IN')}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted, #8888AA)' }}>You save</div>
                              <div style={{ fontSize: 16, fontWeight: 800, color: '#22c55e' }}>Rs.{flight.saving.toLocaleString('en-IN')}</div>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 140 }}>
                          <div style={{ fontSize: 12, color: 'var(--text-muted, #8888AA)', textAlign: 'center' }}>
                            Best card: <strong style={{ color: 'var(--text, #f0f0ff)' }}>{flight.cardNeeded}</strong>
                          </div>
                          <a href={url} target="_blank" rel="noopener noreferrer" style={{
                            display: 'block', textAlign: 'center', padding: '10px 16px',
                            background: 'linear-gradient(135deg, #C9972E, #E8B84B)',
                            color: '#0a0a0a', borderRadius: 10, fontSize: 13, fontWeight: 700,
                            textDecoration: 'none',
                          }}>{label}</a>
                          {flight.bookingUrl && (
                            <a href={flight.bookingUrl} target="_blank" rel="noopener noreferrer" style={{
                              display: 'block', textAlign: 'center', padding: '8px 16px',
                              background: 'rgba(255,255,255,0.06)',
                              color: 'var(--text, #f0f0ff)', borderRadius: 10, fontSize: 12, fontWeight: 600,
                              textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)',
                            }}>Book on {flight.transferPartner}</a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hotels */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #8888AA)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                🏨 Hotel options
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {result.hotels.map((hotel, i) => {
                  const { url, label } = getApplyUrl(hotel.cardId);
                  return (
                    <div key={i} style={{
                      background: 'var(--bg-card, #111118)',
                      border: i === 0 ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 16, padding: '18px 20px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            {i === 0 && <span style={{ fontSize: 9, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', padding: '2px 8px', borderRadius: 100, textTransform: 'uppercase' }}>Best value</span>}
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text, #f0f0ff)' }}>{hotel.name}</span>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted, #8888AA)', marginBottom: 8 }}>
                            {hotel.chain} · {hotel.nights} nights
                          </div>
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted, #8888AA)' }}>Points needed</div>
                              <div style={{ fontSize: 16, fontWeight: 800, color: '#C9972E' }}>{hotel.pointsNeeded.toLocaleString('en-IN')}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted, #8888AA)' }}>Cash price</div>
                              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text, #f0f0ff)', textDecoration: 'line-through', opacity: 0.5 }}>Rs.{hotel.cashPrice.toLocaleString('en-IN')}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted, #8888AA)' }}>You save</div>
                              <div style={{ fontSize: 16, fontWeight: 800, color: '#22c55e' }}>Rs.{hotel.saving.toLocaleString('en-IN')}</div>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 140 }}>
                          <div style={{ fontSize: 12, color: 'var(--text-muted, #8888AA)', textAlign: 'center' }}>
                            Best card: <strong style={{ color: 'var(--text, #f0f0ff)' }}>{hotel.cardNeeded}</strong>
                          </div>
                          <a href={url} target="_blank" rel="noopener noreferrer" style={{
                            display: 'block', textAlign: 'center', padding: '10px 16px',
                            background: 'linear-gradient(135deg, #C9972E, #E8B84B)',
                            color: '#0a0a0a', borderRadius: 10, fontSize: 13, fontWeight: 700,
                            textDecoration: 'none',
                          }}>{label}</a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Try another trip */}
            <div style={{ textAlign: 'center', paddingTop: 12 }}>
              <button onClick={() => { setResult(null); setQuery(''); }} style={{
                padding: '12px 28px', background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, fontSize: 14, fontWeight: 600,
                color: 'var(--text, #f0f0ff)', cursor: 'pointer',
              }}>
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
