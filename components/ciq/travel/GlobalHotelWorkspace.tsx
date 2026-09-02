'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { authedFetch } from '@/lib/authed-fetch'
import { ConciergeRequestButton, type ConciergeRequest } from '@/components/ciq/concierge/ConciergeRequestButton'
import './global-hotel-workspace.css'

type HotelOffer = {
  id: string
  hotelId: string
  hotelName: string
  chainName: string | null
  stars: number | null
  latitude: number | null
  longitude: number | null
  imageUrl: string | null
  roomName: string | null
  roomType: string | null
  cancellationPolicy: string | null
  mealPlan: string | null
  paymentType: string | null
  currency: string
  totalPrice: number
  basePrice: number | null
  taxesAndFees: number | null
  agentName: string | null
  deeplink: string | null
  source: 'skyscanner-hotels-live'
}

type Coverage = {
  provider: string
  mode: string
  destination?: string
  entityId?: string
  loaded: number
  provider_total: number | null
  offset?: number
  limit?: number
  has_more: boolean
  next_offset?: number | null
  status?: string
  fetched_at: string | null
  note?: string
}

type SearchPage = {
  sessionToken?: string
  offers?: HotelOffer[]
  hotels?: HotelOffer[]
  coverage?: Coverage
  error?: string
}

function plusDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currency} ${Math.round(value).toLocaleString('en-IN')}`
  }
}

function dedupeOffers(existing: HotelOffer[], incoming: HotelOffer[]) {
  const seen = new Set(existing.map((o) => o.id))
  return [...existing, ...incoming.filter((o) => !seen.has(o.id))]
}

function hotelConciergeRequest(offer: HotelOffer, destination: string, checkin: string, checkout: string): ConciergeRequest {
  const expectedCashMinor = offer.currency === 'INR' && Number.isFinite(offer.totalPrice)
    ? Math.round(offer.totalPrice * 100)
    : null

  return {
    context: 'HNI',
    sourceType: 'HOTEL',
    sourceRef: `skyscanner:${offer.id}`,
    title: `${offer.hotelName} · ${destination}`,
    selection: {
      hotel_name: offer.hotelName,
      hotel_id: offer.hotelId,
      chain_name: offer.chainName,
      destination,
      checkin,
      checkout,
      stars: offer.stars,
      room_name: offer.roomName,
      room_type: offer.roomType,
      cancellation_policy: offer.cancellationPolicy,
      meal_plan: offer.mealPlan,
      payment_type: offer.paymentType,
      total_price: offer.totalPrice,
      currency: offer.currency,
      agent: offer.agentName,
      deeplink: offer.deeplink,
    },
    redemptionSnapshot: {
      recommended_path: null,
      instruction_state: 'LIVE_INVENTORY_LOYALTY_MAPPING_PENDING',
    },
    sourceSnapshot: {
      cash_rate: {
        state: 'LIVE_PROVIDER_RETURNED',
        source: offer.source,
      },
      loyalty_mapping: {
        state: offer.chainName ? 'CHAIN_RETURNED_MAPPING_NOT_YET_EXECUTED' : 'UNMAPPED',
      },
    },
    expectedCashMinor,
    currency: offer.currency,
    contactChannel: 'BOTH',
  }
}

export function GlobalHotelWorkspace() {
  const [destination, setDestination] = useState('Bangkok')
  const [checkin, setCheckin] = useState(plusDays(21))
  const [checkout, setCheckout] = useState(plusDays(24))
  const [adults, setAdults] = useState(2)
  const [offers, setOffers] = useState<HotelOffer[]>([])
  const [coverage, setCoverage] = useState<Coverage | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  const selected = useMemo(
    () => offers.find((o) => o.id === selectedId) ?? offers[0] ?? null,
    [offers, selectedId],
  )

  useEffect(() => {
    if (!offers.length) return setSelectedId(null)
    if (!selectedId || !offers.some((o) => o.id === selectedId)) setSelectedId(offers[0].id)
  }, [offers, selectedId])

  async function runSearch() {
    if (!destination.trim() || !checkin || !checkout || checkout <= checkin) return
    setLoading(true)
    setError('')
    setOffers([])
    setCoverage(null)
    setSessionToken(null)
    setSelectedId(null)
    try {
      const res = await authedFetch('/api/hotels/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: destination.trim(), checkin, checkout, adults, rooms: 1, limit: 50 }),
      })
      const data = await res.json() as SearchPage
      if (!res.ok) {
        setCoverage(data.coverage ?? null)
        throw new Error(data.error || 'hotel search failed')
      }
      setOffers(data.offers ?? data.hotels ?? [])
      setCoverage(data.coverage ?? null)
      setSessionToken(data.sessionToken ?? null)
    } catch (e: any) {
      setError(e?.message || 'Couldn’t complete the live hotel search.')
    } finally {
      setLoading(false)
    }
  }

  async function loadMore() {
    if (!sessionToken || !coverage?.has_more || coverage.next_offset == null || !coverage.entityId) return
    setLoadingMore(true)
    setError('')
    try {
      const res = await authedFetch('/api/hotels/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken,
          destination: coverage.destination || destination,
          entityId: coverage.entityId,
          offset: coverage.next_offset,
          limit: coverage.limit ?? 50,
        }),
      })
      const data = await res.json() as SearchPage
      if (!res.ok) throw new Error(data.error || 'could not load next hotel page')
      setOffers((current) => dedupeOffers(current, data.offers ?? data.hotels ?? []))
      setCoverage(data.coverage ?? coverage)
    } catch (e: any) {
      setError(e?.message || 'Couldn’t load more hotels.')
    } finally {
      setLoadingMore(false)
    }
  }

  const totalLabel = coverage?.provider_total != null
    ? `${offers.length.toLocaleString('en-IN')} loaded of ${coverage.provider_total.toLocaleString('en-IN')} provider properties`
    : `${offers.length.toLocaleString('en-IN')} provider offers loaded${coverage?.has_more ? ' · more available' : ''}`

  return (
    <div className="ghw-root">
      <div className="ghw-title-row">
        <div>
          <h1>Any destination. Live hotel inventory first.</h1>
          <p>Search Indian or international cities. CreditIQ keeps every provider-returned offer accessible, then layers loyalty/redemption intelligence on top when that programme is mapped.</p>
        </div>
        <div className="ghw-honesty">No Bangkok substitution · pageable provider coverage</div>
      </div>

      <div className="ghw-search">
        <label><span>Destination</span><input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Delhi, Dubai, Paris, New York…" /></label>
        <label><span>Check-in</span><input type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} /></label>
        <label><span>Check-out</span><input type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)} /></label>
        <label><span>Guests</span><input type="number" min={1} max={9} value={adults} onChange={(e) => setAdults(Math.max(1, Math.min(9, Number(e.target.value) || 1)))} /></label>
        <button onClick={runSearch} disabled={loading || !destination.trim() || checkout <= checkin}>{loading ? 'Searching…' : 'Search'}</button>
      </div>

      <div className="ghw-demo-link">
        <span>The previous Accor Bangkok work remains a clearly labelled redemption-engine fixture.</span>
        <Link href="/stay-on-points?demo=accor">Open captured Accor redemption demo →</Link>
      </div>

      {coverage && (
        <div className="ghw-coverage">
          <div><b>{totalLabel}</b><span>{coverage.provider} · {coverage.mode}{coverage.status ? ` · ${coverage.status}` : ''}</span></div>
          {coverage.fetched_at && <small>Fetched {new Date(coverage.fetched_at).toLocaleTimeString()}</small>}
        </div>
      )}

      {error && (
        <div className="ghw-error">
          <b>Live hotel inventory is unavailable for this preview.</b>
          <span>{error}</span>
          <small>CreditIQ will not replace this search with captured Bangkok rates. The live provider requires its partner API key to be configured.</small>
        </div>
      )}

      {loading && <div className="ghw-loading">Starting the live provider session for {destination}…</div>}

      {!loading && offers.length > 0 && (
        <div className="ghw-workspace">
          <div className="ghw-left">
            <div className="ghw-list" role="listbox" aria-label="Hotel offers">
              {offers.map((offer) => (
                <button key={offer.id} className={`ghw-row${selected?.id === offer.id ? ' active' : ''}`} onClick={() => setSelectedId(offer.id)} role="option" aria-selected={selected?.id === offer.id}>
                  <div className="ghw-thumb">{offer.imageUrl ? <img src={offer.imageUrl} alt="" /> : <span>{offer.hotelName.slice(0, 1)}</span>}</div>
                  <div className="ghw-main"><b>{offer.hotelName}</b><span>{[offer.chainName, offer.stars ? `${offer.stars} star` : null, offer.roomName || offer.roomType].filter(Boolean).join(' · ')}</span><small>{[offer.cancellationPolicy, offer.mealPlan, offer.agentName].filter(Boolean).join(' · ') || 'Rate-plan details returned by provider'}</small></div>
                  <div className="ghw-price"><b>{money(offer.totalPrice, offer.currency)}</b><span>provider total</span>{offer.taxesAndFees != null && <small>tax/fee lines {money(offer.taxesAndFees, offer.currency)}</small>}</div>
                  <div className="ghw-path"><b>{offer.chainName || 'Unmapped hotel'}</b><span>{offer.chainName ? 'loyalty mapping can be evaluated' : 'cash path visible'}</span></div>
                </button>
              ))}
            </div>
            {coverage?.has_more && <button className="ghw-load" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading next provider page…' : `Load more · ${offers.length.toLocaleString('en-IN')} loaded${coverage.provider_total != null ? ` / ${coverage.provider_total.toLocaleString('en-IN')}` : ''}`}</button>}
          </div>
          <HotelOfferPanel offer={selected} destination={destination} checkin={checkin} checkout={checkout} />
        </div>
      )}

      {!loading && !error && coverage && offers.length === 0 && <div className="ghw-empty">The connected provider returned no hotel offers for this destination and date range.</div>}
    </div>
  )
}

function HotelOfferPanel({ offer, destination, checkin, checkout }: { offer: HotelOffer | null; destination: string; checkin: string; checkout: string }) {
  if (!offer) return <aside className="ghw-panel empty">Select a hotel to inspect its live rate and mapping state.</aside>
  const request = hotelConciergeRequest(offer, destination, checkin, checkout)
  const explicitlyAccor = /accor/i.test(offer.chainName || '')

  return (
    <aside className="ghw-panel">
      <div className="ghw-panel-head"><span>Selected live hotel</span><h2>{offer.hotelName}</h2><p>{[offer.chainName, offer.roomName || offer.roomType, offer.agentName].filter(Boolean).join(' · ')}</p><strong>{money(offer.totalPrice, offer.currency)}</strong></div>
      <div className="ghw-breakdown">
        <div><span>Base price</span><b>{offer.basePrice != null ? money(offer.basePrice, offer.currency) : 'Not separated'}</b></div>
        <div><span>Taxes & fees</span><b>{offer.taxesAndFees != null ? money(offer.taxesAndFees, offer.currency) : 'Not separated'}</b></div>
        <div><span>Cancellation</span><b>{offer.cancellationPolicy || 'Provider did not label it'}</b></div>
        <div><span>Meal plan</span><b>{offer.mealPlan || 'Not labelled'}</b></div>
      </div>
      <div className={`ghw-mapping${explicitlyAccor ? ' mapped' : ''}`}>
        <b>{explicitlyAccor ? 'Accor chain returned by provider' : 'Loyalty programme not yet safely mapped'}</b>
        <p>{explicitlyAccor ? 'This live offer can be routed into the Accor v3.1 redemption layer next, while exact transfer instructions remain subject to the same eligibility/minimum/increment gates.' : 'CreditIQ keeps the hotel searchable and bookable but does not invent a hotel-points programme or transfer path.'}</p>
      </div>
      <div className="ghw-actions">{offer.deeplink ? <a href={offer.deeplink} target="_blank" rel="noopener noreferrer">Check provider offer →</a> : <span /> }<ConciergeRequestButton request={request} /></div>
      <div className="ghw-source">Source: {offer.source}. Live inventory and redemption confidence are separate facts.</div>
    </aside>
  )
}
