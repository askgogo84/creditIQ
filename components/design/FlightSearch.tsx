'use client'

import { useState } from 'react'
import Link from 'next/link'

type Flight = {
  id: string
  price: number
  airline: string
  from: string
  to: string
  departure: string
  arrival: string
  duration: number
  stops: number
  bookingLink: string
}

const AIRPORTS = [
  { code: 'DEL', name: 'Delhi (IGI)' },
  { code: 'BOM', name: 'Mumbai (CSIA)' },
  { code: 'BLR', name: 'Bengaluru (KIA)' },
  { code: 'MAA', name: 'Chennai' },
  { code: 'CCU', name: 'Kolkata' },
  { code: 'HYD', name: 'Hyderabad' },
  { code: 'GOI', name: 'Goa' },
  { code: 'COK', name: 'Kochi' },
  { code: 'SIN', name: 'Singapore' },
  { code: 'DXB', name: 'Dubai' },
  { code: 'BKK', name: 'Bangkok' },
  { code: 'LHR', name: 'London' },
  { code: 'NRT', name: 'Tokyo' },
  { code: 'JFK', name: 'New York' },
]


const CITY_TO_IATA: Record<string, string> = {
  'goa': 'GOI', 'mumbai': 'BOM', 'bombay': 'BOM', 'delhi': 'DEL',
  'new delhi': 'DEL', 'bangalore': 'BLR', 'bengaluru': 'BLR',
  'chennai': 'MAA', 'madras': 'MAA', 'kolkata': 'CCU', 'calcutta': 'CCU',
  'hyderabad': 'HYD', 'kochi': 'COK', 'cochin': 'COK', 'pune': 'PNQ',
  'ahmedabad': 'AMD', 'jaipur': 'JAI', 'lucknow': 'LKO', 'chandigarh': 'IXC',
  'singapore': 'SIN', 'dubai': 'DXB', 'bangkok': 'BKK', 'london': 'LHR',
  'tokyo': 'NRT', 'new york': 'JFK', 'paris': 'CDG', 'sydney': 'SYD',
}

function cityToIata(city: string): string {
  return CITY_TO_IATA[city.toLowerCase().trim()] || city.substring(0, 3).toUpperCase()
}

const POINTS_VALUE: Record<string, number> = {
  'HDFC': 1.80,
  'AXIS': 0.80,
  'AMEX': 1.20,
  'SBI': 0.25,
  'ICICI': 0.35,
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function FlightCard({ flight, pointsBalance, bank }: { flight: Flight; pointsBalance: number; bank: string }) {
  const ptValue = POINTS_VALUE[bank] || 0.5
  const pointsNeeded = Math.round(flight.price / ptValue)
  const canUsePoints = pointsBalance >= pointsNeeded
  const pointsSaving = canUsePoints ? flight.price - (pointsNeeded * ptValue) : 0

  return (
    <div style={{ padding: '20px 24px', borderRadius: 20, background: 'var(--surface,#fff)', border: '1px solid var(--line,rgba(20,41,80,0.08))', transition: 'all 0.2s' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(20,41,80,0.08)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink,#142950)', letterSpacing: '-0.02em' }}>{formatTime(flight.departure)}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3,#5A6A8A)', marginTop: 2 }}>{flight.from}</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3,#5A6A8A)', marginBottom: 4 }}>{flight.duration}h · {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}</div>
              <div style={{ height: 1, background: 'var(--line,rgba(20,41,80,0.12))', position: 'relative' }}>
                <div style={{ position: 'absolute', right: -4, top: -3, width: 7, height: 7, borderRadius: '50%', border: '1px solid var(--line,rgba(20,41,80,0.2))' }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink-3,#5A6A8A)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{flight.airline}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink,#142950)', letterSpacing: '-0.02em' }}>{formatTime(flight.arrival)}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3,#5A6A8A)', marginTop: 2 }}>{flight.to} · {formatDate(flight.arrival)}</div>
            </div>
          </div>
          {flight.stops === 0 && (
            <span style={{ padding: '3px 8px', borderRadius: 999, background: 'rgba(79,140,88,0.10)', color: 'var(--green,#4F8C58)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em' }}>DIRECT</span>
          )}
        </div>
        <div style={{ textAlign: 'right', minWidth: 140 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink,#142950)', letterSpacing: '-0.03em' }}>
            ₹{flight.price.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3,#5A6A8A)', marginBottom: 10 }}>per person</div>
          <a href={flight.bookingLink} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-block', padding: '10px 18px', borderRadius: 999, background: 'var(--copper-3,#D89B2A)', color: 'var(--ink,#142950)', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            Book now →
          </a>
        </div>
      </div>

      {/* Points vs Cash comparison */}
      {pointsBalance > 0 && (
        <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 12, background: canUsePoints ? 'rgba(79,140,88,0.06)' : 'var(--bg-2,#EFE7D8)', border: `1px solid ${canUsePoints ? 'rgba(79,140,88,0.20)' : 'var(--line,rgba(20,41,80,0.08))'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: canUsePoints ? 'var(--green,#4F8C58)' : 'var(--ink-3,#5A6A8A)', marginBottom: 3 }}>
                {canUsePoints ? '✦ USE YOUR POINTS' : 'NEED MORE POINTS'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink,#142950)' }}>
                {canUsePoints
                  ? `Redeem ${pointsNeeded.toLocaleString('en-IN')} ${bank} points — save ₹${flight.price.toLocaleString('en-IN')}`
                  : `Need ${pointsNeeded.toLocaleString('en-IN')} pts · You have ${pointsBalance.toLocaleString('en-IN')}`}
              </div>
            </div>
            {canUsePoints && (
              <Link href="/points-optimizer" style={{ padding: '8px 14px', borderRadius: 999, background: 'var(--green,#4F8C58)', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                Optimize →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function FlightSearch({ defaultFrom = 'DEL', defaultTo = '', pointsBalance = 0, bank = 'HDFC' }: { defaultFrom?: string; defaultTo?: string; pointsBalance?: number; bank?: string }) {
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo ? cityToIata(defaultTo) : '')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [flights, setFlights] = useState<Flight[]>([])
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const search = async () => {
    if (!to || !dateFrom) return
    setLoading(true)
    setError('')
    setFlights([])
    try {
      const params = new URLSearchParams({ from, to, date_from: dateFrom, date_to: dateTo || dateFrom })
      const res = await fetch(`/api/flights/search?${params}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setFlights(data.flights || [])
      setSearched(true)
    } catch (err: any) {
      setError(err.message || 'Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div>
      {/* Search bar */}
      <div style={{ padding: 24, borderRadius: 20, background: 'var(--paper,#FAF5EB)', border: '1px solid var(--line,rgba(20,41,80,0.08))', marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }} className="grid-1-mobile">
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', display: 'block', marginBottom: 6 }}>FROM</label>
            <select value={from} onChange={e => setFrom(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--line,rgba(20,41,80,0.12))', background: 'var(--surface,#fff)', color: 'var(--ink,#142950)', fontSize: 14, fontFamily: 'inherit' }}>
              {AIRPORTS.map(a => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', display: 'block', marginBottom: 6 }}>TO</label>
            <select value={to} onChange={e => setTo(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--line,rgba(20,41,80,0.12))', background: 'var(--surface,#fff)', color: 'var(--ink,#142950)', fontSize: 14, fontFamily: 'inherit' }}>
              <option value="">Select destination</option>
              {AIRPORTS.filter(a => a.code !== from).map(a => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', display: 'block', marginBottom: 6 }}>DEPARTURE</label>
            <input type="date" value={dateFrom} min={today} onChange={e => setDateFrom(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--line,rgba(20,41,80,0.12))', background: 'var(--surface,#fff)', color: 'var(--ink,#142950)', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', display: 'block', marginBottom: 6 }}>RETURN (OPT)</label>
            <input type="date" value={dateTo} min={dateFrom || today} onChange={e => setDateTo(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--line,rgba(20,41,80,0.12))', background: 'var(--surface,#fff)', color: 'var(--ink,#142950)', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <button onClick={search} disabled={!to || !dateFrom || loading}
            style={{ padding: '12px 24px', borderRadius: 12, background: 'var(--ink,#142950)', color: 'var(--bg,#F5EFE6)', border: 'none', fontSize: 14, fontWeight: 700, cursor: !to || !dateFrom || loading ? 'not-allowed' : 'pointer', opacity: !to || !dateFrom ? 0.5 : 1, whiteSpace: 'nowrap', height: 46 }}>
            {loading ? 'Searching...' : 'Search flights'}
          </button>
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink-3,#5A6A8A)' }}>
          <div style={{ fontSize: 32, fontFamily: 'var(--font-serif,Georgia,serif)', fontStyle: 'italic', color: 'var(--copper-3,#D89B2A)', marginBottom: 12 }}>...</div>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono,monospace)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>SCANNING 500+ AIRLINES AND OTAs</div>
        </div>
      )}

      {error && (
        <div style={{ padding: '16px 20px', borderRadius: 14, background: 'rgba(184,66,48,0.08)', border: '1px solid rgba(184,66,48,0.20)', color: '#B84230', fontSize: 14 }}>
          {error}
        </div>
      )}

      {searched && flights.length === 0 && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink-3,#5A6A8A)' }}>
          <p style={{ fontSize: 16 }}>No flights found for this route and date.</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>Try different dates or check nearby airports.</p>
        </div>
      )}

      {flights.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)' }}>
              {flights.length} FLIGHTS FOUND · SORTED BY PRICE
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3,#5A6A8A)' }}>
              Powered by Kiwi.com · Live prices
            </div>
          </div>
          {flights.map(f => (
            <FlightCard key={f.id} flight={f} pointsBalance={pointsBalance} bank={bank} />
          ))}
          <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: 'var(--ink-3,#5A6A8A)' }}>
            Prices shown are indicative. Final price confirmed at booking.
          </div>
        </div>
      )}
    </div>
  )
}
