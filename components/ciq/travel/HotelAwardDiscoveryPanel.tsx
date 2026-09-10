'use client'

import { useEffect, useMemo, useState } from 'react'
import { authedFetch } from '@/lib/authed-fetch'
import { hotelProgrammeBooking } from '@/lib/data/hotel-programme-booking'
import { WalletRailMatrix } from './WalletRailMatrix'

type Search = {
  destination: string
  checkInDate: string
  checkOutDate: string
}

type Property = {
  providerPropertyId: string
  programmeId: string
  name: string
  brand: string | null
  subBrand: string | null
  formattedAddress: string | null
  imageUrl: string | null
  awardAvailabilityPercent: number | null
  observedPointsMin: number | null
  observedPointsMedian: number | null
  observedPointsMax: number | null
  updatedAt: string | null
}

type Response = {
  status?: string
  pricingAuthority?: string
  provider?: string
  freshness?: string
  properties?: Property[]
  reason?: string
  error?: string
}

const PROGRAMME_NAMES: Record<string, string> = {
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
  'club-itc': 'Club ITC',
  'orchid-rewards': 'Royal Orchid / Regenta',
  'postcard-sunshine-club': 'The Postcard Sunshine Club',
  'choice-privileges': 'Choice Privileges',
  'i-prefer': 'I Prefer',
}

function points(value: number | null) {
  return value != null && Number.isFinite(value) ? `${Math.round(value).toLocaleString('en-IN')} pts` : 'Check live'
}

function programmeName(id: string) {
  return PROGRAMME_NAMES[id] || id.replaceAll('-', ' ')
}

export function HotelAwardDiscoveryPanel({ search }: { search: Search | null }) {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')
  const [programmeFilter, setProgrammeFilter] = useState<string>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!search) {
      setProperties([])
      setMessage('')
      setStatus('')
      setProgrammeFilter('all')
      setSelectedId(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setMessage('')
    setSelectedId(null)
    setProgrammeFilter('all')
    void authedFetch('/api/hotels/award-discovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination: search.destination }),
    })
      .then(async response => {
        const data = await response.json().catch(() => ({})) as Response
        if (!response.ok && response.status !== 503) throw new Error(data.error || 'award discovery failed')
        if (cancelled) return
        const next = Array.isArray(data.properties) ? data.properties : []
        setProperties(next)
        setSelectedId(next[0] ? `${next[0].programmeId}:${next[0].providerPropertyId}` : null)
        setStatus(data.pricingAuthority || data.status || '')
        setMessage(data.reason || '')
      })
      .catch(error => {
        if (!cancelled) setMessage(error instanceof Error ? error.message : 'Award discovery unavailable')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [search?.destination, search?.checkInDate, search?.checkOutDate])

  const programmeIds = useMemo(() => [...new Set(properties.map(property => property.programmeId))], [properties])
  const visibleProperties = useMemo(() => programmeFilter === 'all'
    ? properties
    : properties.filter(property => property.programmeId === programmeFilter), [properties, programmeFilter])
  const selected = useMemo(() => {
    const all = properties
    return all.find(property => `${property.programmeId}:${property.providerPropertyId}` === selectedId)
      ?? visibleProperties[0]
      ?? null
  }, [properties, visibleProperties, selectedId])

  useEffect(() => {
    if (!visibleProperties.length) return setSelectedId(null)
    if (!selected || !visibleProperties.includes(selected)) {
      const first = visibleProperties[0]
      setSelectedId(`${first.programmeId}:${first.providerPropertyId}`)
    }
  }, [programmeFilter, visibleProperties, selected])

  if (!search) return null

  const booking = selected ? hotelProgrammeBooking(selected.programmeId) : null

  return (
    <section className="hotel-award-discovery" style={{ marginTop: 18, border: '1px solid var(--line)', borderRadius: 18, background: 'var(--surface)', overflow: 'hidden', boxShadow: '0 16px 42px rgba(18,27,45,.05)' }}>
      <div className="hotel-award-discovery-head" style={{ padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 12, borderBottom: '1px solid var(--line)' }}>
        <div>
          <div className="ciq-editorial-kicker">Loyalty hotel results · {search.destination}</div>
          <h2 style={{ margin: '4px 0 3px', fontSize: 19 }}>Choose an actual property, then see how your wallet can book it.</h2>
          <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 10.5, maxWidth: 760 }}>Property-level loyalty discovery comes first. CreditIQ then maps that hotel to Marriott, Hilton, IHG, Hyatt, Wyndham, Accor and other supported programmes and shows only the transfer routes available from your cards.</p>
        </div>
        <span style={{ color: status === 'DISCOVERY_ONLY' ? 'var(--copper)' : 'var(--ink-3)', fontSize: 9, fontWeight: 850, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{loading ? 'Finding loyalty hotels…' : properties.length ? `${properties.length} properties` : status || 'Unavailable'}</span>
      </div>

      {loading ? (
        <div style={{ padding: 28, color: 'var(--ink-3)', fontSize: 11, textAlign: 'center' }}>Finding loyalty properties in {search.destination}…</div>
      ) : properties.length ? (
        <>
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', padding: '10px 14px', borderBottom: '1px solid var(--line)', background: 'var(--surface-2)' }}>
            <button onClick={() => setProgrammeFilter('all')} style={{ border: '1px solid var(--line)', borderRadius: 999, padding: '7px 11px', background: programmeFilter === 'all' ? 'var(--ink)' : 'var(--surface)', color: programmeFilter === 'all' ? 'var(--surface)' : 'var(--ink)', fontSize: 9, fontWeight: 800, whiteSpace: 'nowrap', cursor: 'pointer' }}>All · {properties.length}</button>
            {programmeIds.map(id => {
              const count = properties.filter(property => property.programmeId === id).length
              const active = programmeFilter === id
              return <button key={id} onClick={() => setProgrammeFilter(id)} style={{ border: '1px solid var(--line)', borderRadius: 999, padding: '7px 11px', background: active ? 'var(--ink)' : 'var(--surface)', color: active ? 'var(--surface)' : 'var(--ink)', fontSize: 9, fontWeight: 800, whiteSpace: 'nowrap', cursor: 'pointer' }}>{programmeName(id)} · {count}</button>
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(330px,.72fr)', alignItems: 'start' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))' }}>
              {visibleProperties.slice(0, 36).map(property => {
                const key = `${property.programmeId}:${property.providerPropertyId}`
                const active = selected && key === `${selected.programmeId}:${selected.providerPropertyId}`
                return (
                  <button key={key} onClick={() => setSelectedId(key)} style={{ appearance: 'none', border: 0, borderRight: '1px solid var(--line)', borderBottom: '1px solid var(--line)', borderLeft: active ? '3px solid var(--copper)' : '3px solid transparent', background: active ? 'color-mix(in srgb,var(--copper) 6%,var(--surface))' : 'var(--surface)', textAlign: 'left', padding: 14, minHeight: 150, cursor: 'pointer', color: 'inherit' }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ width: 56, height: 56, flex: '0 0 56px', borderRadius: 11, overflow: 'hidden', background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}>{property.imageUrl ? <img src={property.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <b>{property.name.slice(0, 1)}</b>}</div>
                      <div style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', color: 'var(--copper)', fontSize: 8, textTransform: 'uppercase', fontWeight: 850, letterSpacing: '.06em' }}>{programmeName(property.programmeId)}</span>
                        <b style={{ display: 'block', fontSize: 12, lineHeight: 1.3, marginTop: 3 }}>{property.name}</b>
                        <small style={{ display: 'block', marginTop: 4, color: 'var(--ink-3)', fontSize: 8.5 }}>{property.subBrand || property.brand || 'Loyalty property'}</small>
                      </div>
                    </div>
                    <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                      <div><small style={{ color: 'var(--ink-3)', fontSize: 8 }}>Observed from</small><b style={{ display: 'block', marginTop: 2, fontSize: 12 }}>{points(property.observedPointsMin)}</b></div>
                      <div><small style={{ color: 'var(--ink-3)', fontSize: 8 }}>Typical observed</small><b style={{ display: 'block', marginTop: 2, fontSize: 12 }}>{points(property.observedPointsMedian)}</b></div>
                    </div>
                    <p style={{ margin: '9px 0 0', color: 'var(--ink-3)', fontSize: 8.5, lineHeight: 1.4 }}>{property.formattedAddress || `${search.destination} · verify exact address`}</p>
                  </button>
                )
              })}
            </div>

            <aside style={{ position: 'sticky', top: 92, borderLeft: '1px solid var(--line)', background: 'var(--surface)', minHeight: 320 }}>
              {selected && (
                <>
                  <div style={{ padding: 16, borderBottom: '1px solid var(--line)', background: 'linear-gradient(135deg,color-mix(in srgb,var(--copper) 7%,var(--surface)),var(--surface))' }}>
                    <small style={{ color: 'var(--copper)', textTransform: 'uppercase', fontSize: 8, fontWeight: 850 }}>Selected loyalty property</small>
                    <h3 style={{ margin: '5px 0 2px', fontSize: 17 }}>{selected.name}</h3>
                    <span style={{ color: 'var(--ink-3)', fontSize: 9 }}>{programmeName(selected.programmeId)} · {search.checkInDate} → {search.checkOutDate}</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                      <div style={{ padding: 9, border: '1px solid var(--line)', borderRadius: 10, background: 'var(--surface)' }}><small style={{ color: 'var(--ink-3)', fontSize: 8 }}>Observed low</small><b style={{ display: 'block', marginTop: 2 }}>{points(selected.observedPointsMin)}</b></div>
                      <div style={{ padding: 9, border: '1px solid var(--line)', borderRadius: 10, background: 'var(--surface)' }}><small style={{ color: 'var(--ink-3)', fontSize: 8 }}>Observed median</small><b style={{ display: 'block', marginTop: 2 }}>{points(selected.observedPointsMedian)}</b></div>
                    </div>
                    {booking?.bookingUrl && <a href={booking.bookingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'var(--ink)', color: 'var(--surface)', textDecoration: 'none', textAlign: 'center', fontSize: 9, fontWeight: 850 }}>Check live points &amp; book on {booking.programmeName} ↗</a>}
                  </div>
                  <div style={{ padding: 12 }}>
                    <WalletRailMatrix travelKind="hotel" programmeId={selected.programmeId} programmePointsRequired={selected.observedPointsMin} />
                  </div>
                </>
              )}
            </aside>
          </div>
        </>
      ) : (
        <div style={{ padding: 18, color: 'var(--ink-3)', fontSize: 11 }}>{message || 'No cached loyalty properties were returned for this destination. Direct programme search remains the verification source.'}</div>
      )}

      <div style={{ padding: '10px 14px', color: 'var(--ink-3)', fontSize: 9.5, lineHeight: 1.45, borderTop: '1px solid var(--line)' }}><b>Availability gate:</b> property names are genuine loyalty-property discovery, while cached points ranges are historical observations. The direct hotel programme remains the final source for the selected dates before CreditIQ recommends an irreversible bank-points transfer.</div>
    </section>
  )
}
