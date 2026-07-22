'use client';

import { useState, useEffect, Suspense, Fragment } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LiveAwardRow from '@/components/ciq/LiveAwardRow';
import { DesignFooter } from '@/components/design/Footer';
import { getApplyUrl } from '@/lib/affiliate';
import { BookingModal } from '@/components/BookingModal';
import { TripComparison } from '@/components/TripComparison';
import { SavePromptBanner } from '@/components/design/SavePromptBanner';
import FlightSearch, { detectIataFromText, buildKayakUrl, buildMMTUrl, INDIRECT_ROUTES } from '@/components/design/FlightSearch';
import { ProGate } from '@/components/design/ProGate';
import { createBrowserClient } from '@supabase/ssr';
import { authedFetch } from '@/lib/authed-fetch';

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
    mmtUrl?: string;
    connectionHub?: string;
    connectionAirline?: string;
    totalFlightTime?: string;
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
  { label: 'London 5 nights', emoji: '\u{1F1EC}\u{1F1E7}', query: 'Business trip to London for 5 nights next month' },
  { label: 'Dubai weekend', emoji: '\u{1F1E6}\u{1F1EA}', query: 'Weekend trip to Dubai 3 nights this month' },
  { label: 'Singapore 4 nights', emoji: '\u{1F1F8}\u{1F1EC}', query: 'Holiday in Singapore for 4 nights next month' },
  { label: 'Bangkok 5 nights', emoji: '\u{1F1F9}\u{1F1ED}', query: 'Leisure trip Bangkok 5 nights' },
  { label: 'Goa long weekend', emoji: '\u{1F3D6}\u{FE0F}', query: 'Domestic trip Goa 3 nights long weekend' },
  { label: 'New York 7 nights', emoji: '\u{1F1FA}\u{1F1F8}', query: 'Business trip New York 7 nights premium travel' },
];

const BANKS = ['HDFC', 'Axis', 'SBI', 'ICICI', 'IDFC', 'Amex', 'Kotak', 'AU', 'None'];

// --- Inspire-me destination cards ---
const IMG = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=70`;

interface Dest {
  city: string; flag: string; region: 'india' | 'international';
  miles: number; flightTime: string; image: string; nights: number; iata: string;
}

const DESTS: Dest[] = [
  // International
  { city: 'Singapore',    flag: '\u{1F1F8}\u{1F1EC}', region: 'international', miles: 14000, flightTime: '4h 35m', nights: 4, iata: 'SIN', image: IMG('photo-1525625293386-3f8f99389edd') },
  { city: 'Dubai',        flag: '\u{1F1E6}\u{1F1EA}', region: 'international', miles: 24000, flightTime: '4h 00m', nights: 3, iata: 'DXB', image: IMG('photo-1512453979798-5ea266f8880c') },
  { city: 'Bangkok',      flag: '\u{1F1F9}\u{1F1ED}', region: 'international', miles: 18000, flightTime: '4h 20m', nights: 5, iata: 'BKK', image: IMG('photo-1508009603885-50cf7c579365') },
  { city: 'Tokyo',        flag: '\u{1F1EF}\u{1F1F5}', region: 'international', miles: 35000, flightTime: '9h 30m', nights: 6, iata: 'NRT', image: IMG('photo-1540959733332-eab4deabeeaf') },
  { city: 'London',       flag: '\u{1F1EC}\u{1F1E7}', region: 'international', miles: 28000, flightTime: '10h 45m', nights: 5, iata: 'LHR', image: IMG('photo-1513635269975-59663e0ac1ad') },
  { city: 'Paris',        flag: '\u{1F1EB}\u{1F1F7}', region: 'international', miles: 33000, flightTime: '10h 30m', nights: 5, iata: 'CDG', image: IMG('photo-1502602898657-3e91760cbb34') },
  { city: 'Hong Kong',    flag: '\u{1F1ED}\u{1F1F0}', region: 'international', miles: 13000, flightTime: '6h 00m', nights: 4, iata: 'HKG', image: IMG('photo-1536599018102-9f803c140fc1') },
  { city: 'Kuala Lumpur', flag: '\u{1F1F2}\u{1F1FE}', region: 'international', miles: 22000, flightTime: '4h 30m', nights: 4, iata: 'KUL', image: IMG('photo-1596422846543-75c6fc197f07') },
  { city: 'Colombo',      flag: '\u{1F1F1}\u{1F1F0}', region: 'international', miles: 12000, flightTime: '1h 30m', nights: 3, iata: 'CMB', image: IMG('photo-1566296314736-6eaac1ca0cb9') },
  { city: 'Denpasar',     flag: '\u{1F1EE}\u{1F1E9}', region: 'international', miles: 35000, flightTime: '6h 45m', nights: 5, iata: 'DPS', image: IMG('photo-1537996194471-e657df975ab4') },
  { city: 'Seoul',        flag: '\u{1F1F0}\u{1F1F7}', region: 'international', miles: 20000, flightTime: '8h 40m', nights: 5, iata: 'ICN', image: IMG('photo-1538485399081-7191377e8241') },
  { city: 'Istanbul',     flag: '\u{1F1F9}\u{1F1F7}', region: 'international', miles: 31000, flightTime: '8h 15m', nights: 4, iata: 'IST', image: IMG('photo-1524231757912-21f4fe3a7200') },
  { city: 'Rome',         flag: '\u{1F1EE}\u{1F1F9}', region: 'international', miles: 33000, flightTime: '9h 45m', nights: 5, iata: 'FCO', image: IMG('photo-1552832230-c0197dd311b5') },
  { city: 'Abu Dhabi',    flag: '\u{1F1E6}\u{1F1EA}', region: 'international', miles: 26000, flightTime: '4h 05m', nights: 3, iata: 'AUH', image: IMG('photo-1512632578888-169bbbc64f33') },
  // India
  { city: 'Delhi',      flag: '\u{1F1EE}\u{1F1F3}', region: 'india', miles: 16000, flightTime: '2h 45m', nights: 3, iata: 'DEL', image: IMG('photo-1587474260584-136574528ed5') },
  { city: 'Mumbai',     flag: '\u{1F1EE}\u{1F1F3}', region: 'india', miles: 15000, flightTime: '1h 40m', nights: 3, iata: 'BOM', image: IMG('photo-1566552881560-0be862a7c445') },
  { city: 'Goa',        flag: '\u{1F1EE}\u{1F1F3}', region: 'india', miles: 12000, flightTime: '1h 15m', nights: 3, iata: 'GOI', image: IMG('photo-1512343879784-a960bf40e7f2') },
  { city: 'Jaipur',     flag: '\u{1F1EE}\u{1F1F3}', region: 'india', miles: 15000, flightTime: '2h 20m', nights: 3, iata: 'JAI', image: IMG('photo-1477587458883-47145ed94245') },
  { city: 'Kolkata',    flag: '\u{1F1EE}\u{1F1F3}', region: 'india', miles: 16000, flightTime: '2h 30m', nights: 3, iata: 'CCU', image: IMG('photo-1558431382-27e303142255') },
  { city: 'Kochi',      flag: '\u{1F1EE}\u{1F1F3}', region: 'india', miles: 11000, flightTime: '1h 20m', nights: 3, iata: 'COK', image: IMG('photo-1602216056096-3b40cc0c9944') },
  { city: 'Udaipur',    flag: '\u{1F1EE}\u{1F1F3}', region: 'india', miles: 15000, flightTime: '2h 15m', nights: 3, iata: 'UDR', image: IMG('photo-1590050752117-238cb0fb12b1') },
  { city: 'Srinagar',   flag: '\u{1F1EE}\u{1F1F3}', region: 'india', miles: 18000, flightTime: '3h 20m', nights: 4, iata: 'SXR', image: IMG('photo-1566837945700-30057527ade9') },
];

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
          authedFetch('/api/user-cards'),
          authedFetch('/api/manual-cards'),
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
  const [detectedDestIata, setDetectedDestIata] = useState<string>('');
  const [inspireRegion, setInspireRegion] = useState<'india' | 'international'>('international');
  const [expandedCity, setExpandedCity] = useState<string | null>(null);

  const plan = async (overrideQuery?: string) => {
    const tripQuery = overrideQuery ?? query;
    if (!tripQuery.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await authedFetch('/api/trip-planner', {
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
      if (data.ok === false || data.error) throw new Error(data.reason || data.error);
      setResult(data);
      const detectedIata = detectIataFromText(tripQuery);
      if (detectedIata) setDetectedDestIata(detectedIata);
    } catch {
      setError('Couldn’t plan this trip right now — try again in a minute.');
    } finally {
      setLoading(false);
    }
  };

  const LABEL: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #64748b)',
    textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #f8f9fc)' }}>
      <main style={{ maxWidth: 880, margin: '0 auto', padding: '32px 20px 100px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(201,151,46,0.12)', border: '1px solid rgba(201,151,46,0.3)', borderRadius: 100, padding: '5px 16px', marginBottom: 16 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9972E', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#C9972E', letterSpacing: 1.5, textTransform: 'uppercase' }}>AI Trip Planner</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, color: 'var(--text, #0f172a)', margin: '0 0 10px', letterSpacing: -1, lineHeight: 1.1 }}>
            Where are you going?
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-muted, #64748b)', margin: 0, lineHeight: 1.6, maxWidth: 500, marginInline: 'auto' }}>
            Tell us your trip. We&rsquo;ll find the smartest way to pay with your credit&#8209;card points &mdash; flights, hotels, everything.
          </p>
        </div>

        {/* Input card */}
        <div style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border, #e2e8f0)', borderRadius: 20, padding: 24, marginBottom: 20, boxShadow: '0 4px 24px rgba(15,23,42,0.06)' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={LABEL}>Describe your trip</label>
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
                outline: 'none', resize: 'none',
                fontFamily: 'inherit', lineHeight: 1.5,
                boxSizing: 'border-box',
                position: 'relative', zIndex: 1,
              }}
            />
          </div>

          <div className="trip-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ ...LABEL, display: 'flex', alignItems: 'center', gap: 8 }}>
                Your points balance
                {pointsLoaded && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#16a34a', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', padding: '2px 8px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Auto-loaded
                  </span>
                )}
              </label>
              <input
                type="text"
                value={points}
                onChange={e => setPoints(e.target.value)}
                placeholder={pointsLoaded ? '' : 'e.g. 52,164'}
                style={{
                  width: '100%', height: 44, padding: '0 14px',
                  background: 'var(--bg-surface, #f8fafc)',
                  border: '1.5px solid var(--border, #e2e8f0)',
                  borderRadius: 10, fontSize: 14,
                  color: 'var(--text, #0f172a)', outline: 'none',
                  boxSizing: 'border-box',
                  WebkitAppearance: 'none',
                }}
              />
            </div>
            <div>
              <label style={LABEL}>Your primary card bank</label>
              <select
                value={cardBank}
                onChange={e => setCardBank(e.target.value)}
                style={{
                  width: '100%', height: 44, padding: '0 14px',
                  background: 'var(--bg-surface, #f8fafc)',
                  border: '1.5px solid var(--border, #e2e8f0)',
                  borderRadius: 10, fontSize: 14,
                  color: 'var(--text, #0f172a)', outline: 'none',
                  cursor: 'pointer', boxSizing: 'border-box',
                }}
              >
                {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          {/* Origin city */}
          {showOriginPrompt && (
            <div style={{ marginBottom: 16, padding: '12px 14px', background: 'rgba(201,151,46,0.08)', border: '1px solid rgba(201,151,46,0.2)', borderRadius: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#C9972E', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
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
                We&rsquo;ll remember this for all your trip plans
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
              transition: 'transform 0.12s, box-shadow 0.2s',
              boxShadow: loading || !query.trim() ? 'none' : '0 6px 20px rgba(201,151,46,0.28)',
            }}
          >
            {loading ? 'Planning your trip\u2026' : 'Plan my trip with points \u2192'}
          </button>
        </div>

        {/* Quick chips */}
        {!result && !loading && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Quick ideas</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {QUICK_TRIPS.map((trip, i) => (
                <button key={i} onClick={() => { setQuery(trip.query); plan(trip.query); }} style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px',
                  background: 'var(--bg-card, #fff)', border: '1px solid var(--border, #e2e8f0)',
                  borderRadius: 100, fontSize: 13, fontWeight: 600,
                  color: 'var(--text, #0f172a)', cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
                }}>
                  <span style={{ fontSize: 15 }}>{trip.emoji}</span><span>{trip.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Inspire-me destination cards (empty state only) */}
        {!result && !loading && (
          <div style={{ marginTop: 44 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text, #0f172a)', letterSpacing: -0.3 }}>
                {'\u2726'} Or get inspired
              </div>
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <div onClick={() => setInspireRegion('international')} style={{
                  padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  border: inspireRegion === 'international' ? 'none' : '1px solid var(--border, #e2e8f0)',
                  background: inspireRegion === 'international' ? 'var(--ink, #142950)' : 'var(--bg-card, #fff)',
                  color: inspireRegion === 'international' ? '#fff' : 'var(--text, #0f172a)',
                }}>{'\u{1F30F}'} International</div>
                <div onClick={() => setInspireRegion('india')} style={{
                  padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  border: inspireRegion === 'india' ? 'none' : '1px solid var(--border, #e2e8f0)',
                  background: inspireRegion === 'india' ? 'var(--ink, #142950)' : 'var(--bg-card, #fff)',
                  color: inspireRegion === 'india' ? '#fff' : 'var(--text, #0f172a)',
                }}>{'\u{1F1EE}\u{1F1F3}'} India</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {DESTS.filter(d => d.region === inspireRegion).map((d) => (
                <Fragment key={d.city}>
                <div
                  onClick={() => setExpandedCity(prev => (prev === d.city ? null : d.city))}
                  aria-expanded={expandedCity === d.city}
                  style={{
                    position: 'relative', borderRadius: 16, overflow: 'hidden',
                    aspectRatio: '4 / 3', boxShadow: '0 4px 16px rgba(15,23,42,0.10)',
                    cursor: 'pointer', background: '#1e293b',
                  }}
                >
                  <img src={d.image} alt={d.city} loading="lazy"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.12) 45%, rgba(0,0,0,0.05) 100%)' }} />
                  <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100 }}>
                    {d.flightTime}
                  </div>
                  <div style={{ position: 'absolute', left: 14, bottom: 46, fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>
                    From Bangalore (BLR)
                  </div>
                  <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 16 }}>{d.flag}</span>
                      <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>{d.city}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>from</div>
                      <div style={{ fontSize: 17, fontWeight: 900, color: '#E8B84B', lineHeight: 1 }}>{Math.round(d.miles / 1000)}K</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>points</div>
                    </div>
                  </div>
                </div>
                {expandedCity === d.city && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <LiveAwardRow
                      destination={d.iata}
                      destinationCity={d.city}
                      defaultOrigin="BLR"
                      onPlanFullTrip={() => {
                        const q = `Trip to ${d.city} for ${d.nights} nights`;
                        setQuery(q);
                        plan(q);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    />
                  </div>
                )}
                </Fragment>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)', marginTop: 16, textAlign: 'center' }}>
              Tap any destination to instantly plan your trip with points.
            </p>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            {/* Infinity-path flight loader (pure CSS/SVG; falls back to a pulse
                when the user prefers reduced motion). Decorative -> aria-hidden. */}
            <style>{`
              @keyframes ttpFly { from { offset-distance: 0%; } to { offset-distance: 100%; } }
              @keyframes ttpPulse {
                0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.9); }
                50%      { opacity: 1;   transform: translate(-50%, -50%) scale(1.08); }
              }
              .ttp-loader { position: relative; width: 100px; height: 60px; margin: 0 auto 16px; }
              .ttp-loader__track { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
              .ttp-loader__plane {
                position: absolute; top: 0; left: 0; width: 20px; height: 20px; line-height: 0; color: #C9972E;
                offset-path: path('M50,30 C50,15 25,15 25,30 C25,45 50,45 50,30 C50,15 75,15 75,30 C75,45 50,45 50,30 Z');
                offset-rotate: auto;
                animation: ttpFly 2.6s linear infinite;
              }
              @media (prefers-reduced-motion: reduce) {
                .ttp-loader__plane {
                  offset-path: none; top: 50%; left: 50%;
                  animation: ttpPulse 1.6s ease-in-out infinite;
                }
              }
            `}</style>
            <div className="ttp-loader" aria-hidden="true">
              <svg className="ttp-loader__track" viewBox="0 0 100 60" fill="none">
                <path
                  d="M50,30 C50,15 25,15 25,30 C25,45 50,45 50,30 C50,15 75,15 75,30 C75,45 50,45 50,30 Z"
                  stroke="rgba(201,151,46,0.22)" strokeWidth="1.5" strokeDasharray="3 4" strokeLinecap="round"
                />
              </svg>
              <span className="ttp-loader__plane">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                  <path d="M2 4 L22 12 L2 20 L7 12 Z" />
                </svg>
              </span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text, #0f172a)', marginBottom: 8 }}>Finding the best options&hellip;</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted, #64748b)' }}>Checking flights, hotels, transfer partners and pricing</div>
          </div>
        )}

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 18px', color: '#dc2626', fontSize: 14, marginBottom: 20 }}>{error}</div>
        )}

        {result && (
          <div style={{ marginTop: 8 }}>
            {/* Summary (FREE) */}
            <div style={{ background: 'linear-gradient(135deg, #1B3A5C, #0d2240)', borderRadius: 20, padding: '28px', marginBottom: 20, border: '1px solid rgba(201,151,46,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
                    {result.destination} &middot; {result.duration} &middot; {result.tripType}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4, lineHeight: 1.4 }}>{result.summary}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{result.dates}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>You save vs cash</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#22c55e' }}>&#8377;{result.totalSaving.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div style={{ background: result.canAfford ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${result.canAfford ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: result.canAfford ? '#22c55e' : '#ef4444' }}>
                    {result.canAfford ? '\u2713 Your points cover this trip' : `Need ${result.pointsGap.toLocaleString('en-IN')} more points`}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                    Need {result.totalPointsNeeded.toLocaleString('en-IN')} pts &middot; You have {(parseInt(points.replace(/,/g, '')) || 0).toLocaleString('en-IN')} pts
                  </div>
                </div>
                {!result.canAfford && (
                  <Link href={`/cards/${result.bestCardId}`} style={{ padding: '8px 16px', background: '#C9972E', color: '#0a0a0a', borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                    Get {result.bestCard} &rarr;
                  </Link>
                )}
              </div>

              {result.proTip && <div style={{ marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, fontStyle: 'italic' }}>&ldquo;{result.proTip}&rdquo;</div>}
            </div>

            <SavePromptBanner feature='trip' />

            {/* Live flight results (PRO-gated) */}
            <ProGate
              title="Unlock live flight results & booking"
              subtitle="See real-time award seats, live fares across every platform, and one-tap booking with your points."
            >
              {/* Live Flight Search */}
              <div style={{ marginTop: 32, marginBottom: 32 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', marginBottom: 16 }}>Search flights</div>
                <FlightSearch defaultFrom={originIata || 'BLR'} defaultTo={detectedDestIata || (result?.destination ? result.destination.substring(0, 3).toUpperCase() : '')} pointsBalance={parseInt((points || '0').replace(/,/g, '')) || 0} bank={cardBank || 'HDFC'} />
              </div>

              {/* Live price comparison across platforms */}
              <TripComparison
                destination={result.destination}
                origin={originCity}
                nights={parseInt(result.duration?.replace(/\D/g, '')) || 3}
                cabin={result.flights?.[0]?.class?.toLowerCase() || 'economy'}
                userPoints={parseInt((points || '0').replace(/,/g, '')) || 0}
                cardBank={cardBank}
              />

              {/* Points redemption CTA */}
              {result.flights?.[0] && (
                <div style={{ background: 'rgba(201,151,46,0.06)', border: '1px solid rgba(201,151,46,0.15)', borderRadius: 16, padding: '16px 20px', marginTop: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#C9972E', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
                    Redeem your points
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text, #0f172a)', marginBottom: 2 }}>
                        {result.flights[0].airline} via {result.flights[0].transferPartner}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted, #64748b)' }}>
                        {result.flights[0].pointsNeeded.toLocaleString('en-IN')} pts needed &middot; Best card: {result.flights[0].cardNeeded}
                      </div>
                    </div>
                    <button
                      onClick={() => { setModalFlight(result.flights[0]); setModalHotel(result.hotels[0] || null); setModalOpen(true); }}
                      style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #C9972E, #E8B84B)', color: '#0a0a0a', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      How to redeem points
                    </button>
                  </div>
                </div>
              )}
            </ProGate>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
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
