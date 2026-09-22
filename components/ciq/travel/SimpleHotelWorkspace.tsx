'use client'

import { useState } from 'react'
import { ArrowRight, BedDouble, CheckCircle2, ShieldCheck } from 'lucide-react'
import { authedFetch } from '@/lib/authed-fetch'

type CashOffer = {
  id: string
  hotelName: string
  chainName?: string | null
  stars?: number | null
  roomName?: string | null
  roomType?: string | null
  currency: string
  totalPrice: number
  deeplink?: string | null
  source: string
}

type HotelVerdict = {
  action: 'BOOK_CASH' | 'USE_HOTEL_POINTS' | 'VERIFY_LOYALTY_AVAILABILITY' | 'COMPARE_LIVE_OPTIONS' | 'WAIT'
  confidence: number | null
  source: 'jev' | 'deterministic-fallback'
  verificationRequired: boolean
  reason: string
  latencyMs: number
  error?: string | null
}

type LoyaltyProperty = {
  providerPropertyId: string
  programmeId: string
  name: string
  brand?: string | null
  formattedAddress?: string | null
  imageUrl?: string | null
  observedPointsMin?: number | null
  observedPointsMedian?: number | null
  source?: 'FIRST_PARTY' | 'CACHED_INDEX'
  sourceName?: string | null
  sourceUrl?: string | null
}

const PROGRAMMES: Record<string, string> = {
  'marriott-bonvoy': 'Marriott Bonvoy',
  'hilton-honors': 'Hilton Honors',
  'ihg-one': 'IHG One Rewards',
  'world-of-hyatt': 'World of Hyatt',
  'wyndham-rewards': 'Wyndham Rewards',
  'accor-all': 'ALL Accor',
  'radisson-rewards': 'Radisson Rewards',
  'shangri-la-circle': 'Shangri-La Circle',
  'jumeirah-one': 'Jumeirah One',
  'taj-neupass': 'Taj / NeuPass',
  'club-itc': 'Club ITC / Fortune',
}

function plusDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function cash(value: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
  } catch {
    return `${currency} ${Math.round(value).toLocaleString('en-IN')}`
  }
}

function programme(id: string) {
  return PROGRAMMES[id] || id.replaceAll('-', ' ').replace(/\b\w/g, m => m.toUpperCase())
}

function observedPoints(p: LoyaltyProperty) {
  const value = p.observedPointsMedian ?? p.observedPointsMin
  return value != null ? `~${Math.round(value).toLocaleString('en-IN')} pts observed` : 'Live points check required'
}

export function SimpleHotelWorkspace() {
  const [destination, setDestination] = useState('Goa')
  const [checkin, setCheckin] = useState(plusDays(7))
  const [checkout, setCheckout] = useState(plusDays(10))
  const [mode, setMode] = useState<'points' | 'cash'>('points')
  const [loyalty, setLoyalty] = useState<LoyaltyProperty[]>([])
  const [cashOffers, setCashOffers] = useState<CashOffer[]>([])
  const [cashSource, setCashSource] = useState('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')
  const [verifyId, setVerifyId] = useState<string | null>(null)
  const [verifyMessage, setVerifyMessage] = useState<Record<string, string>>({})
  const [hotelVerdict, setHotelVerdict] = useState<HotelVerdict | null>(null)

  function cheapestCash(rows: CashOffer[]) {
    return [...rows].filter(row => Number.isFinite(row.totalPrice) && row.totalPrice >= 0).sort((a, b) => a.totalPrice - b.totalPrice)[0] || null
  }

  async function requestHotelVerdict(
    cashRows: CashOffer[],
    loyaltyProperty: LoyaltyProperty | null,
    liveResult?: any,
  ) {
    const bestCash = cheapestCash(cashRows)
    const liveRate = Array.isArray(liveResult?.rates) ? liveResult.rates[0] : null
    const pricingAuthority = liveResult?.pricingAuthority
      || (loyaltyProperty ? 'DISCOVERY_ONLY' : 'NONE')

    try {
      const res = await authedFetch('/api/hotels/verdict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: destination.trim(),
          cash: {
            amountMinor: bestCash ? Math.round(bestCash.totalPrice * 100) : null,
            currency: bestCash?.currency || null,
            source: bestCash?.source || cashSource || null,
            live: Boolean(bestCash),
          },
          loyalty: {
            programmeId: liveResult?.programmeId || loyaltyProperty?.programmeId || null,
            propertyName: liveRate?.hotelName || loyaltyProperty?.name || null,
            pointsRequired: liveRate?.totalPoints
              ?? loyaltyProperty?.observedPointsMedian
              ?? loyaltyProperty?.observedPointsMin
              ?? null,
            cashComponentMinor: liveRate?.totalCashMinor ?? null,
            cashCurrency: liveRate?.cashCurrency ?? null,
            status: liveResult?.status || (loyaltyProperty ? 'DISCOVERY' : null),
            pricingAuthority,
          },
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.verdict) setHotelVerdict(data.verdict)
    } catch {
      // Search remains usable even when the decision service is unavailable.
    }
  }

  async function search() {
    if (!destination.trim() || !checkin || !checkout || checkout <= checkin) return
    setLoading(true)
    setSearched(true)
    setError('')
    setLoyalty([])
    setCashOffers([])
    setCashSource('')
    setHotelVerdict(null)

    const payload = { destination: destination.trim(), checkin, checkout, adults: 2, rooms: 1, limit: 30 }
    const loyaltyPayload = { destination: destination.trim(), checkInDate: checkin, checkOutDate: checkout, adults: 2 }

    const [cashResult, loyaltyResult] = await Promise.allSettled([
      authedFetch('/api/hotels/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(async res => ({ res, data: await res.json().catch(() => ({})) })),
      authedFetch('/api/hotels/award-discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loyaltyPayload),
      }).then(async res => ({ res, data: await res.json().catch(() => ({})) })),
    ])

    let loyaltyRows: LoyaltyProperty[] = []
    let cashRows: CashOffer[] = []
    let resolvedCashSource = ''

    if (loyaltyResult.status === 'fulfilled') {
      const { res, data } = loyaltyResult.value
      if (res.ok || res.status === 503) {
        loyaltyRows = Array.isArray(data.properties) ? data.properties : []
        setLoyalty(loyaltyRows)
      }
    }

    if (cashResult.status === 'fulfilled') {
      const { res, data } = cashResult.value
      if (res.ok) {
        cashRows = Array.isArray(data.offers) ? data.offers : Array.isArray(data.hotels) ? data.hotels : []
        resolvedCashSource = data.coverage?.provider || ''
        setCashOffers(cashRows)
        setCashSource(resolvedCashSource)
      }
    }

    if (cashRows.length || loyaltyRows.length) {
      await requestHotelVerdict(cashRows, loyaltyRows[0] || null)
    }

    const loyaltyFailed = loyaltyResult.status === 'rejected' || (loyaltyResult.status === 'fulfilled' && !loyaltyResult.value.res.ok && loyaltyResult.value.res.status !== 503)
    const cashFailed = cashResult.status === 'rejected' || (cashResult.status === 'fulfilled' && !cashResult.value.res.ok)
    if (loyaltyFailed && cashFailed) setError('Hotel search could not be completed. Please try again.')
    setLoading(false)
  }

  async function verify(property: LoyaltyProperty) {
    const key = `${property.programmeId}:${property.providerPropertyId}`
    setVerifyId(key)
    setVerifyMessage(current => ({ ...current, [key]: '' }))
    try {
      const res = await authedFetch('/api/hotels/award-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programmeId: property.programmeId,
          destination: destination.trim(),
          checkInDate: checkin,
          checkOutDate: checkout,
          numberOfRooms: 1,
          numberOfAdults: 2,
          numberOfKids: 0,
        }),
      })
      const data = await res.json().catch(() => ({}))
      const message = data.reason || data.note || (
        data.status === 'SUCCESS'
          ? 'Programme availability returned. Open the programme and match this exact property before transferring points.'
          : data.status === 'PENDING'
            ? 'The live programme check is still processing. Do not transfer points yet.'
            : 'Direct programme verification is required for these dates.'
      )
      setVerifyMessage(current => ({ ...current, [key]: message }))
      await requestHotelVerdict(cashOffers, property, data)
    } catch {
      setVerifyMessage(current => ({ ...current, [key]: 'Live programme verification is unavailable right now. Keep your points until you can check directly.' }))
    } finally {
      setVerifyId(null)
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '22px 18px 60px' }}>
      <div style={{ marginBottom: 18 }}>
        <div className="ciq-editorial-kicker">Hotels</div>
        <h1 style={{ margin: '5px 0 6px', fontSize: 30 }}>Pick the hotel first. Then decide cash or points.</h1>
        <p style={{ margin: 0, color: 'var(--ink-2)', maxWidth: 760 }}>CreditIQ keeps loyalty hotels and live cash prices separate so a test provider or missing cash feed can never create a fake redemption answer.</p>
      </div>

      <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 160px 160px auto', gap: 9, alignItems: 'end', padding: 14, border: '1px solid var(--line)', borderRadius: 18, background: 'var(--surface)' }}>
        <label><small>Destination</small><input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Goa, Dubai, Singapore…" style={{ width: '100%', height: 42, border: '1px solid var(--line)', borderRadius: 10, padding: '0 11px', background: 'var(--surface)' }} /></label>
        <label><small>Check-in</small><input type="date" value={checkin} onChange={e => setCheckin(e.target.value)} style={{ width: '100%', height: 42, border: '1px solid var(--line)', borderRadius: 10, padding: '0 9px', background: 'var(--surface)' }} /></label>
        <label><small>Check-out</small><input type="date" value={checkout} onChange={e => setCheckout(e.target.value)} style={{ width: '100%', height: 42, border: '1px solid var(--line)', borderRadius: 10, padding: '0 9px', background: 'var(--surface)' }} /></label>
        <button onClick={search} disabled={loading} style={{ height: 42, border: 0, borderRadius: 10, padding: '0 18px', background: 'var(--copper)', color: '#fff', fontWeight: 800 }}>{loading ? 'Searching…' : 'Search hotels'}</button>
      </section>

      <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
        <button onClick={() => setMode('points')} style={{ border: '1px solid var(--line)', borderRadius: 999, padding: '9px 14px', background: mode === 'points' ? 'var(--ink)' : 'var(--surface)', color: mode === 'points' ? 'var(--surface)' : 'var(--ink)', fontWeight: 800 }}>Use points {loyalty.length ? `· ${loyalty.length}` : ''}</button>
        <button onClick={() => setMode('cash')} style={{ border: '1px solid var(--line)', borderRadius: 999, padding: '9px 14px', background: mode === 'cash' ? 'var(--ink)' : 'var(--surface)', color: mode === 'cash' ? 'var(--surface)' : 'var(--ink)', fontWeight: 800 }}>Pay cash {cashOffers.length ? `· ${cashOffers.length}` : ''}</button>
      </div>

      <div style={{ marginTop: 12, padding: '11px 13px', borderRadius: 12, background: 'var(--surface-2)', display: 'flex', gap: 9, alignItems: 'center', color: 'var(--ink-2)', fontSize: 11.5 }}>
        <ShieldCheck size={17} />
        <span><b>No test inventory:</b> HBX evaluation data is now excluded from customer results. If no production cash provider responds, CreditIQ will say so instead of showing unrelated hotels.</span>
      </div>

      {hotelVerdict && (
        <div style={{ marginTop: 12, padding: 14, borderRadius: 14, border: '1px solid var(--line)', background: '#f8f6ef' }}>
          <small style={{ color: 'var(--copper)', fontWeight: 850, letterSpacing: '.06em' }}>
            {hotelVerdict.source === 'jev' ? 'JEV HOTEL VERDICT' : 'CREDITIQ SAFE FALLBACK'}
          </small>
          <strong style={{ display: 'block', marginTop: 5, fontSize: 16 }}>
            {hotelVerdict.action === 'BOOK_CASH' ? 'Book cash'
              : hotelVerdict.action === 'USE_HOTEL_POINTS' ? 'Use hotel points'
              : hotelVerdict.action === 'VERIFY_LOYALTY_AVAILABILITY' ? 'Verify loyalty availability first'
              : hotelVerdict.action === 'COMPARE_LIVE_OPTIONS' ? 'Compare live cash vs points'
              : 'Wait · evidence incomplete'}
          </strong>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 5, fontSize: 10.5, color: 'var(--ink-3)' }}>
            {hotelVerdict.confidence != null && <span>Confidence {Math.round(hotelVerdict.confidence * 100)}%</span>}
            {hotelVerdict.verificationRequired && <span style={{ color: '#9A6700', fontWeight: 750 }}>Verification required</span>}
          </div>
          <p style={{ margin: '7px 0 0', fontSize: 11.5, lineHeight: 1.5, color: 'var(--ink-2)' }}>{hotelVerdict.reason}</p>
        </div>
      )}

      {error && <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#fff1ee', color: '#8a2e1d' }}>{error}</div>}
      {loading && <div style={{ padding: 42, textAlign: 'center', color: 'var(--ink-3)' }}><BedDouble size={26} style={{ marginBottom: 8 }} /><div>Finding real properties and redemption options…</div></div>}

      {!loading && searched && mode === 'points' && (
        <section style={{ marginTop: 18 }}>
          <div style={{ marginBottom: 10 }}><strong style={{ fontSize: 18 }}>Hotels with a loyalty path</strong><span style={{ display: 'block', color: 'var(--ink-3)', fontSize: 11, marginTop: 2 }}>Observed points are guidance only. Check live before transferring.</span></div>
          {loyalty.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 10 }}>
              {loyalty.slice(0, 18).map(property => {
                const key = `${property.programmeId}:${property.providerPropertyId}`
                return (
                  <article key={key} style={{ border: '1px solid var(--line)', borderRadius: 16, background: 'var(--surface)', padding: 14 }}>
                    <div style={{ display: 'flex', gap: 11 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 11, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', overflow: 'hidden', flex: '0 0 48px' }}>{property.imageUrl ? <img src={property.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <b>{property.name.slice(0,1)}</b>}</div>
                      <div style={{ minWidth: 0 }}>
                        <small style={{ color: 'var(--copper)', fontWeight: 800 }}>{programme(property.programmeId)}</small>
                        <strong style={{ display: 'block', fontSize: 14, marginTop: 3 }}>{property.name}</strong>
                        {property.formattedAddress && <span style={{ display: 'block', color: 'var(--ink-3)', fontSize: 10.5, marginTop: 3 }}>{property.formattedAddress}</span>}
                      </div>
                    </div>
                    <div style={{ marginTop: 12, padding: 10, borderRadius: 10, background: 'var(--surface-2)' }}>
                      <small style={{ color: 'var(--ink-3)' }}>Points guide</small>
                      <b style={{ display: 'block', marginTop: 3 }}>{observedPoints(property)}</b>
                      <span style={{ display: 'block', marginTop: 3, fontSize: 10.5, color: property.source === 'FIRST_PARTY' ? '#166534' : '#9A6700' }}>{property.source === 'FIRST_PARTY' ? 'Official property identity' : 'Cached discovery'}</span>
                    </div>
                    <button onClick={() => verify(property)} disabled={verifyId === key} style={{ width: '100%', marginTop: 10, minHeight: 39, border: 0, borderRadius: 10, background: '#0E3B3C', color: '#fff', fontWeight: 800 }}>{verifyId === key ? 'Checking…' : 'Check programme for these dates'}</button>
                    {verifyMessage[key] && <div style={{ marginTop: 9, fontSize: 11.5, lineHeight: 1.5, color: 'var(--ink-2)' }}>{verifyMessage[key]}</div>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      {property.sourceUrl && <a href={property.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink)', fontSize: 11.5, fontWeight: 750 }}>Open hotel programme ↗</a>}
                      <a href={`/cira?q=${encodeURIComponent(`Help me book ${property.name} in ${destination} with points`)}`} style={{ marginLeft: 'auto', color: 'var(--copper)', fontSize: 11.5, fontWeight: 800, textDecoration: 'none' }}>Ask CIRA <ArrowRight size={12} style={{ verticalAlign: 'middle' }} /></a>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : <div style={{ padding: 22, border: '1px solid var(--line)', borderRadius: 14, background: 'var(--surface)' }}>No loyalty hotel was discovered for this destination. Try the cash tab or another destination.</div>}
        </section>
      )}

      {!loading && searched && mode === 'cash' && (
        <section style={{ marginTop: 18 }}>
          <div style={{ marginBottom: 10 }}><strong style={{ fontSize: 18 }}>Live cash hotels</strong><span style={{ display: 'block', color: 'var(--ink-3)', fontSize: 11, marginTop: 2 }}>{cashSource ? `Source: ${cashSource}` : 'No production cash provider returned inventory.'}</span></div>
          {cashOffers.length ? (
            <div style={{ display: 'grid', gap: 8 }}>
              {cashOffers.slice(0, 18).map(offer => (
                <article key={offer.id} style={{ border: '1px solid var(--line)', borderRadius: 14, background: 'var(--surface)', padding: 13, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 150px auto', gap: 14, alignItems: 'center' }}>
                  <div><strong style={{ display: 'block', fontSize: 14 }}>{offer.hotelName}</strong><span style={{ display: 'block', marginTop: 3, fontSize: 11, color: 'var(--ink-2)' }}>{[offer.chainName, offer.stars ? `${offer.stars} star` : null, offer.roomName || offer.roomType].filter(Boolean).join(' · ')}</span></div>
                  <div><small style={{ color: 'var(--ink-3)' }}>Total</small><b style={{ display: 'block', fontSize: 17, marginTop: 2 }}>{cash(offer.totalPrice, offer.currency)}</b></div>
                  {offer.deeplink ? <a href={offer.deeplink} target="_blank" rel="noopener noreferrer" style={{ padding: '9px 12px', borderRadius: 9, background: 'var(--ink)', color: 'var(--surface)', textDecoration: 'none', fontWeight: 800, fontSize: 11.5 }}>Open offer</a> : <CheckCircle2 size={18} color="#166534" />}
                </article>
              ))}
            </div>
          ) : <div style={{ padding: 22, border: '1px solid var(--line)', borderRadius: 14, background: 'var(--surface)' }}>No production cash inventory is available right now. The points tab remains usable.</div>}
        </section>
      )}
    </div>
  )
}
