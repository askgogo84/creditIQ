'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import { getApplyUrl } from '@/lib/affiliate';
import { BookingModal } from '@/components/BookingModal';
import { TripComparison } from '@/components/TripComparison';
import { FlightSearch } from '@/components/design/FlightSearch';
import { createBrowserClient } from '@supabase/ssr';

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
  const [pointsLoaded, setPointsLoaded] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const loadUserPoints = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const [stmtRes, manualRes] = await Promise.all([
          fetch('/api/user-cards?userId=' + user.id),
          fetch('/api/manual-cards?userId=' + user.id),
        ]);
        let total = 0;
        if (stmtRes.ok) {
          const d = await stmtRes.json();
          const arr = Array.isArray(d) ? d : (d.cards || []);
          for (const c of arr) total += Number(c.points_balance) || 0;
        }
        if (manualRes.ok) {
          const d = await manualRes.json();
          const arr = Array.isArray(d) ? d : (d.cards || []);
          for (const c of arr) total += Number(c.points_balance) || 0;
        }
        if (total > 0) {
          setPoints(total.toLocaleString('en-IN'));
          setPointsLoaded(true);
        }
      } catch {
        // silently fail
      }
    };
    loadUserPoints();
  }, []);

  // Load user home city from profile/statement on mount
  useEffect(() => {
    const loadOriginCity = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setShowOriginPrompt(true); return; }
        const res = await fetch('/api/user-city?userId=' + user.id);
        if (res.ok) {
          const d = await res.json();
          if (d.city) { setOriginCity(d.city); setOriginIata(d.iata || 'BLR'); }
          else setShowOriginPrompt(true);
        }
      } catch { setShowOriginPrompt(true); }
    };
    loadOriginCity();
  }, []);

  useEffect(() => {
    const urlPoints = searchParams.get('points');
    const urlBank = searchParams.get('bank');
    if (urlPoints) { setPoints(urlPoints); setPointsLoaded(false); }
    if (urlBank) setCardBank(urlBank);
  }, [searchParams]);

  const [cardBank, setCardBank] = useState('HDFC');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TripResult | null>(null);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [originCity, setOriginCity] = useState('Bangalore');
  const [originIata, setOriginIata] = useState('BLR');
  const [showOriginPrompt, setShowOriginPrompt] = useState(false);
  const [modalFlight, setModalFlight] = useState<TripResult['flights'][0] | null>(null);
  const [modalHotel, setModalHotel] = useState<TripResult['hotels'][0] | null>(null);

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
          origin: originCity,
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

          <div className="trip-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' as const, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                Your points balance
                {pointsLoaded && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#16a34a', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', padding: '2px 8px', borderRadius: 100, textTransform: 'uppercase' as const, letterSpacing: 1 }}>
                    Auto-loaded
                  </span>
                )}
              </label>
              <input
                type="text"
                value={points}
                onChange={e => setPoints(e.target.value)}
                placeholder={pointsLoaded ? "" : "e.g. 52,164"}
                style={{
                  width: '100%', height: 44, padding: '0 14px',
                  background: 'var(--bg-surface, #f8fafc)',
                  border: '1.5px solid var(--border, #e2e8f0)',
                  borderRadius: 10, fontSize: 14,
                  color: 'var(--text, #0f172a)', outline: 'none',
                  boxSizing: 'border-box' as const,
                  WebkitAppearance: 'none' as const,
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

          {/* Origin city - smart or user input */}
          {showOriginPrompt && (
            <div style={{ marginBottom: 16, padding: '12px 14px', background: 'rgba(201,151,46,0.08)', border: '1px solid rgba(201,151,46,0.2)', borderRadius: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#C9972E', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: 1 }}>
                Where do you usually fly from?
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={originCity}
                  onChange={e => setOriginCity(e.target.value)}
                  placeholder="e.g. Bangalore, Mumbai, Delhi..."
                  style={{
                    flex: 1, height: 40, padding: '0 12px',
                    background: 'var(--bg-surface, #f8fafc)',
                    border: '1.5px solid var(--border, #e2e8f0)',
                    borderRadius: 8, fontSize: 13,
                    color: 'var(--text, #0f172a)', outline: 'none',
                  }}
                />
                <button
                  onClick={async () => {
                    try {
                      const supabase = createBrowserClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                      );
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user) {
                        await fetch('/api/user-city', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId: user.id, city: originCity }),
                        });
                      }
                      setShowOriginPrompt(false);
                    } catch { setShowOriginPrompt(false); }
                  }}
                  style={{
                    padding: '0 16px', height: 40, borderRadius: 8,
                    background: '#C9972E', color: '#0a0a0a',
                    border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Save
                </button>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(201,151,46,0.7)', marginTop: 6 }}>
                We'll remember this for all your trip plans
              </div>
            </div>
          )}
          {!showOriginPrompt && (
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted, #64748b)' }}>Flying from:</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text, #0f172a)' }}>{originCity}</span>
              <button
                onClick={() => setShowOriginPrompt(true)}
                style={{ fontSize: 11, color: '#C9972E', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Change
              </button>
            </div>
          )}

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
            {/* Live Flight Search */}
            <div style={{ marginTop: 32, marginBottom: 32 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', marginBottom: 16 }}>SEARCH FLIGHTS</div>
              <FlightSearch defaultFrom={originIata || 'BLR'} defaultTo={result?.destination ? result.destination.substring(0,3).toUpperCase() : ''} pointsBalance={parseInt((points || '0').replace(/,/g, '')) || 0} bank={cardBank || 'HDFC'} />
            </div>



            {/* Live price comparison across platforms */}
            <TripComparison
              destination={result.destination}
              origin={originCity}
              nights={parseInt(result.duration?.replace(/\D/g,'')) || 3}
              cabin={result.flights?.[0]?.class?.toLowerCase() || 'economy'}
              userPoints={parseInt((points || '0').replace(/,/g, '')) || 0}
              cardBank={cardBank}
            />

            {/* Flights */}
            {/* Points redemption - compact version */}
            {result.flights?.[0] && (
              <div style={{ background: 'rgba(201,151,46,0.06)', border: '1px solid rgba(201,151,46,0.15)', borderRadius: 16, padding: '16px 20px', marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#C9972E', letterSpacing: 1.5, textTransform: 'uppercase' as const, marginBottom: 10 }}>
                  Redeem your points
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text, #0f172a)', marginBottom: 2 }}>
                      {result.flights[0].airline} via {result.flights[0].transferPartner}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted, #64748b)' }}>
                      {result.flights[0].pointsNeeded.toLocaleString('en-IN')} pts needed . Best card: {result.flights[0].cardNeeded}
                    </div>
                  </div>
                  <button
                    onClick={() => { setModalFlight(result.flights[0]); setModalHotel(result.hotels[0] || null); setModalOpen(true); }}
                    style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #C9972E, #E8B84B)', color: '#0a0a0a', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' as const }}
                  >
                    How to redeem points
                  </button>
                </div>
              </div>
            )}

            <div style={{ textAlign: 'center' }}>
              <button onClick={() => { setResult(null); setQuery(''); }} style={{ padding: '12px 28px', background: 'var(--bg-card, #fff)', border: '1px solid var(--border, #e2e8f0)', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'var(--text, #0f172a)', cursor: 'pointer' }}>
                Plan another trip
              </button>
            </div>
          </div>
        )}
      </main>
      <BookingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        destination={result?.destination || ''}
        flight={modalFlight}
        hotel={modalHotel}
        userPoints={parseInt((points || '0').replace(/,/g, '')) || 0}
        cardBank={cardBank}
      />
      <DesignFooter />
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


