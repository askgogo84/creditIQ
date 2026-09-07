'use client'

import { useEffect, useState } from 'react'
import { authedFetch } from '@/lib/authed-fetch'

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

function points(value: number | null) {
  return value != null && Number.isFinite(value) ? `${Math.round(value).toLocaleString('en-IN')} pts` : 'Not observed'
}

export function HotelAwardDiscoveryPanel({ search }: { search: Search | null }) {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!search) {
      setProperties([])
      setMessage('')
      setStatus('')
      return
    }

    let cancelled = false
    setLoading(true)
    setMessage('')
    void authedFetch('/api/hotels/award-discovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination: search.destination }),
    })
      .then(async response => {
        const data = await response.json().catch(() => ({})) as Response
        if (!response.ok && response.status !== 503) throw new Error(data.error || 'award discovery failed')
        if (cancelled) return
        setProperties(Array.isArray(data.properties) ? data.properties : [])
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

  if (!search) return null

  return (
    <section style={{ marginTop: 16, border: '1px solid var(--line)', borderRadius: 14, background: 'var(--surface)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 12, borderBottom: '1px solid var(--line)' }}>
        <div>
          <div className="ciq-editorial-kicker">Points-stay discovery</div>
          <h2 style={{ margin: '4px 0 3px', fontSize: 17 }}>Award properties around {search.destination}</h2>
          <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 10.5 }}>AwardTool cached discovery is shown even when a live cash-hotel provider is unavailable. It does not prove a room exists for {search.checkInDate} → {search.checkOutDate}.</p>
        </div>
        <span style={{ color: status === 'DISCOVERY_ONLY' ? 'var(--copper)' : 'var(--ink-3)', fontSize: 9, fontWeight: 850, textTransform: 'uppercase' }}>{loading ? 'Searching…' : status || 'Unavailable'}</span>
      </div>

      {loading ? (
        <div style={{ padding: 18, color: 'var(--ink-3)', fontSize: 11 }}>Loading cached hotel award discovery…</div>
      ) : properties.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(235px,1fr))', gap: 0 }}>
          {properties.slice(0, 18).map(property => (
            <article key={`${property.programmeId}:${property.providerPropertyId}`} style={{ padding: 14, borderRight: '1px solid var(--line)', borderBottom: '1px solid var(--line)', minHeight: 150 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 48, height: 48, flex: '0 0 48px', borderRadius: 9, overflow: 'hidden', background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}>{property.imageUrl ? <img src={property.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <b>{property.name.slice(0, 1)}</b>}</div>
                <div style={{ minWidth: 0 }}><b style={{ display: 'block', fontSize: 11.5 }}>{property.name}</b><span style={{ display: 'block', marginTop: 3, color: 'var(--ink-3)', fontSize: 9 }}>{property.programmeId}{property.subBrand ? ` · ${property.subBrand}` : ''}</span></div>
              </div>
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                <div><small style={{ color: 'var(--ink-3)' }}>Observed low</small><b style={{ display: 'block', marginTop: 2, fontSize: 12 }}>{points(property.observedPointsMin)}</b></div>
                <div><small style={{ color: 'var(--ink-3)' }}>Observed median</small><b style={{ display: 'block', marginTop: 2, fontSize: 12 }}>{points(property.observedPointsMedian)}</b></div>
              </div>
              <p style={{ margin: '10px 0 0', color: 'var(--ink-3)', fontSize: 9, lineHeight: 1.4 }}>{property.formattedAddress || 'Address not returned'}{property.awardAvailabilityPercent != null ? ` · observed award availability ${Math.round(property.awardAvailabilityPercent)}%` : ''}</p>
            </article>
          ))}
        </div>
      ) : (
        <div style={{ padding: 18, color: 'var(--ink-3)', fontSize: 11 }}>{message || 'No cached points properties were returned for this destination.'}</div>
      )}

      <div style={{ padding: '10px 14px', color: 'var(--ink-3)', fontSize: 9.5, lineHeight: 1.45 }}><b>Safety boundary:</b> these are historical/cached award observations. CreditIQ will not use them as a date-specific price, rank them as a bookable room, or tell a user to transfer points until a live programme check succeeds.</div>
    </section>
  )
}
