'use client'

import { useEffect, useMemo, useState } from 'react'
import { authedFetch } from '@/lib/authed-fetch'
import { ConciergeRequestButton, type ConciergeRequest } from '@/components/ciq/concierge/ConciergeRequestButton'
import { programmeIdForHotelChain } from '@/lib/redemption-rails/programme-resolver'
import { HotelAwardJoinPanel } from './HotelAwardJoinPanel'
import { HotelAwardDiscoveryPanel } from './HotelAwardDiscoveryPanel'
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
  source: 'skyscanner-hotels-live' | 'booking-demand' | 'hotelbeds-hbx'
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
  next_page?: string | null
  status?: string
  fetched_at: string | null
  note?: string
}

type ProviderAttempt = {
  provider: string
  ok: boolean
  loaded: number
  note: string
}

type SearchPage = {
  sessionToken?: string
  offers?: HotelOffer[]
  hotels?: HotelOffer[]
  coverage?: Coverage
  attempts?: ProviderAttempt[]
  error?: string
}

type SubmittedHotelSearch = {
  destination: string
  checkInDate: string
  checkOutDate: string
}

function plusDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
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
    sourceRef: `${offer.source}:${offer.id}`,
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
      instruction_state: 'LIVE_CASH_INVENTORY_AWARD_JOIN_REQUIRES_VERIFICATION',
    },
    sourceSnapshot: {
      cash_rate: { state: 'LIVE_PROVIDER_RETURNED', source: offer.source },
      loyalty_mapping: { state: offer.chainName ? 'CHAIN_RETURNED_AWARD_JOIN_ATTEMPTED' : 'UNMAPPED' },
    },
    expectedCashMinor,
    currency: offer.currency,
    contactChannel: 'BOTH',
  }
}

function providerLabel(provider: string) {
  if (provider === 'booking-demand') return 'Booking.com Demand'
  if (provider === 'skyscanner-hotels-live') return 'Skyscanner Hotels Live'
  if (provider === 'hotelbeds-hbx') return 'HBX Hotelbeds'
  return provider
}

export function GlobalHotelWorkspace() {
  const [destination, setDestination] = useState('Bangkok')
  const [checkin, setCheckin] = useState(plusDays(7))
  const [checkout, setCheckout] = useState(plusDays(10))
  const [adults, setAdults] = useState(2)
  const [offers, setOffers] = useState<HotelOffer[]>([])
  const [coverage, setCoverage] = useState<Coverage | null>(null)
  const [attempts, setAttempts] = useState<ProviderAttempt[]>([])
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [submittedSearch, setSubmittedSearch] = useState<SubmittedHotelSearch | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  const selected = useMemo(() => offers.find((o) => o.id === selectedId) ?? offers[0] ?? null, [offers, selectedId])

  useEffect(() => {
    if (!offers.length) return setSelectedId(null)
    if (!selectedId || !offers.some((o) => o.id === selectedId)) setSelectedId(offers[0].id)
  }, [offers, selectedId])

  async function runSearch() {
    if (!destination.trim() || !checkin || !checkout || checkout <= checkin) return
    const boundedDestination = destination.trim()
    setSubmittedSearch({ destination: boundedDestination, checkInDate: checkin, checkOutDate: checkout })
    setLoading(true)
    setError('')
    setOffers([])
    setCoverage(null)
    setAttempts([])
    setSessionToken(null)
    setSelectedId(null)
    try {
      const res = await authedFetch('/api/hotels/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: boundedDestination, checkin, checkout, adults, rooms: 1, limit: 50 }),
      })
      const data = await res.json() as SearchPage
      setAttempts(data.attempts ?? [])
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
    if (!sessionToken || !coverage?.has_more) return
    if (coverage.provider === 'skyscanner-hotels-live' && (coverage.next_offset == null || !coverage.entityId)) return
    setLoadingMore(true)
    setError('')
    try {
      const res = await authedFetch('/api/hotels/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: coverage.provider,
          sessionToken,
          destination: coverage.destination || destination,
          entityId: coverage.entityId,
          offset: coverage.next_offset ?? 0,
          limit: coverage.limit ?? 50,
          checkin,
          checkout,
          adults,
          rooms: 1,
        }),
      })
      const data = await res.json() as SearchPage
      setAttempts(data.attempts ?? attempts)
      if (!res.ok) throw new Error(data.error || 'could not load next hotel page')
      setOffers((current) => dedupeOffers(current, data.offers ?? data.hotels ?? []))
      setCoverage(data.coverage ?? coverage)
      setSessionToken(data.sessionToken ?? null)
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
          <div className="ghw-eyebrow">Property first · redemption intelligence second</div>
          <h1>Find the hotel. <em>Then crack the points.</em></h1>
          <p>Search a destination once. CreditIQ first surfaces real loyalty properties in that place, then tells you which cards can reach each programme, the transfer ratio, and where to book.</p>
        </div>
        <div className="ghw-honesty">Actual properties · card-exact transfer paths</div>
      </div>

      <div className="ghw-search">
        <label><span>Destination</span><input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Bangkok, Dubai, Goa, Singapore, London…" /></label>
        <label><span>Check-in</span><input type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} /></label>
        <label><span>Check-out</span><input type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)} /></label>
        <label><span>Guests</span><input type="number" min={1} max={9} value={adults} onChange={(e) => setAdults(Math.max(1, Math.min(9, Number(e.target.value) || 1)))} /></label>
        <button onClick={runSearch} disabled={loading || !destination.trim() || checkout <= checkin}>{loading ? 'Searching…' : 'Search hotels'}</button>
      </div>

      <div className="ghw-demo-link">
        <span>Search → choose an actual Marriott / Hilton / IHG / Accor / Taj / other loyalty property → compare wallet transfer paths → verify live points → book direct or use Concierge.</span>
      </div>

      {/* Loyalty properties are the primary result surface. This intentionally renders
          before the cash-provider benchmark so HBX/Booking/Skyscanner can never gate
          whether Marriott/Accor/Hilton/etc. appear. */}
      <HotelAwardDiscoveryPanel search={submittedSearch} />

      {(loading || coverage || error || offers.length > 0) && (
        <section className="ghw-cash-benchmark" aria-label="Cash hotel benchmark">
          <div className="ghw-coverage" style={{ marginTop: 20 }}>
            <div><b>Cash benchmark</b><span>Secondary comparison layer · never the source of loyalty-programme eligibility</span></div>
            {coverage?.fetched_at && <small>Fetched {new Date(coverage.fetched_at).toLocaleTimeString()}</small>}
          </div>

          {coverage && <div className="ghw-coverage"><div><b>{totalLabel}</b><span>{providerLabel(coverage.provider)} · {coverage.mode}{coverage.status ? ` · ${coverage.status}` : ''}</span></div></div>}

          {error && (
            <div className="ghw-error">
              <b>Cash inventory is unavailable for this comparison.</b>
              <span>{error}</span>
              {attempts.length > 0 && (
                <div className="ghw-provider-attempts" aria-label="Live hotel provider status">
                  {attempts.map((attempt) => <small key={attempt.provider}><b>{providerLabel(attempt.provider)}:</b> {attempt.ok ? `${attempt.loaded} live offers` : attempt.note}</small>)}
                </div>
              )}
              <small>The loyalty-property and redemption path above remains usable. CreditIQ does not turn a cash-provider failure into “no hotel redemption”.</small>
            </div>
          )}

          {loading && <div className="ghw-loading">Loading cash benchmark for {destination}…</div>}

          {!loading && offers.length > 0 && (
            <div className="ghw-workspace">
              <div className="ghw-left">
                <div className="ghw-list" role="listbox" aria-label="Cash hotel offers">
                  {offers.map((offer) => {
                    const programmeId = programmeIdForHotelChain(offer.chainName)
                    return (
                      <button key={offer.id} className={`ghw-row${selected?.id === offer.id ? ' active' : ''}`} onClick={() => setSelectedId(offer.id)} role="option" aria-selected={selected?.id === offer.id}>
                        <div className="ghw-thumb">{offer.imageUrl ? <img src={offer.imageUrl} alt="" /> : <span>{offer.hotelName.slice(0, 1)}</span>}</div>
                        <div className="ghw-main"><b>{offer.hotelName}</b><span>{[offer.chainName, offer.stars ? `${offer.stars} star` : null, offer.roomName || offer.roomType].filter(Boolean).join(' · ')}</span><small>{[offer.cancellationPolicy, offer.mealPlan, offer.agentName].filter(Boolean).join(' · ') || 'Rate-plan details returned by provider'}</small></div>
                        <div className="ghw-price"><b>{money(offer.totalPrice, offer.currency)}</b><span>cash provider total</span>{offer.taxesAndFees != null && <small>tax/fee separation {money(offer.taxesAndFees, offer.currency)}</small>}</div>
                        <div className="ghw-path"><b>{offer.chainName || 'Cash hotel'}</b><span>{programmeId ? 'loyalty join available' : 'cash benchmark only'}</span></div>
                      </button>
                    )
                  })}
                </div>
                {coverage?.has_more && <button className="ghw-load" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading next cash page…' : `Load more · ${offers.length.toLocaleString('en-IN')} loaded${coverage.provider_total != null ? ` / ${coverage.provider_total.toLocaleString('en-IN')}` : ''}`}</button>}
              </div>
              <HotelOfferPanel offer={selected} destination={destination} checkin={checkin} checkout={checkout} adults={adults} />
            </div>
          )}

          {!loading && !error && coverage && offers.length === 0 && <div className="ghw-empty">The connected cash provider returned no hotel offers for this destination and date range.</div>}
        </section>
      )}
    </div>
  )
}

function HotelOfferPanel({ offer, destination, checkin, checkout, adults }: { offer: HotelOffer | null; destination: string; checkin: string; checkout: string; adults: number }) {
  if (!offer) return <aside className="ghw-panel empty">Select a cash hotel to inspect its live rate and loyalty join.</aside>
  const request = hotelConciergeRequest(offer, destination, checkin, checkout)
  const programmeId = programmeIdForHotelChain(offer.chainName)

  return (
    <aside className="ghw-panel">
      <div className="ghw-panel-head"><span>Selected cash benchmark</span><h2>{offer.hotelName}</h2><p>{[offer.chainName, offer.roomName || offer.roomType, offer.agentName].filter(Boolean).join(' · ')}</p><strong>{money(offer.totalPrice, offer.currency)}</strong></div>
      <div className="ghw-breakdown">
        <div><span>Base price</span><b>{offer.basePrice != null ? money(offer.basePrice, offer.currency) : 'Not separated'}</b></div>
        <div><span>Taxes & fees</span><b>{offer.taxesAndFees != null ? money(offer.taxesAndFees, offer.currency) : 'Not separated'}</b></div>
        <div><span>Cancellation</span><b>{offer.cancellationPolicy || 'Provider did not label it'}</b></div>
        <div><span>Meal plan</span><b>{offer.mealPlan || 'Not labelled'}</b></div>
      </div>
      <div className={`ghw-mapping${programmeId ? ' mapped' : ''}`}>
        <b>{programmeId ? `Loyalty programme mapped: ${programmeId}` : 'No safe loyalty mapping from this cash result'}</b>
        <p>{programmeId ? 'CreditIQ compares this same property with its loyalty programme and exact wallet transfer routes.' : 'This cash result remains a benchmark only. Loyalty properties are discovered independently above.'}</p>
      </div>
      <HotelAwardJoinPanel offer={offer} programmeId={programmeId} destination={destination} checkInDate={checkin} checkOutDate={checkout} adults={adults} />
      <div className="ghw-actions">{offer.deeplink ? <a href={offer.deeplink} target="_blank" rel="noopener noreferrer">Check provider offer →</a> : <span /> }<ConciergeRequestButton request={request} /></div>
      <div className="ghw-source">Cash source: {providerLabel(offer.source)}. Loyalty-property discovery and final programme checkout are independently sourced.</div>
    </aside>
  )
}
