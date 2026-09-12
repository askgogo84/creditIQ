'use client'

import { useEffect, useState } from 'react'
import { authedFetch } from '@/lib/authed-fetch'

type Detail = {
  hotelId: string
  name: string | null
  imageUrls: string[]
  stars: number | null
  deeplink: string | null
}

export function HotelProviderGallery({
  provider,
  hotelId,
  fallbackImageUrl,
  hotelName,
}: {
  provider: string | null | undefined
  hotelId: string | null | undefined
  fallbackImageUrl?: string | null
  hotelName: string
}) {
  const [detail, setDetail] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setDetail(null)
    if (provider !== 'booking-demand' || !hotelId) return () => { cancelled = true }
    setLoading(true)
    authedFetch(`/api/hotels/details?provider=booking-demand&hotelId=${encodeURIComponent(hotelId)}`)
      .then(async res => {
        if (!res.ok) return null
        const json = await res.json().catch(() => null)
        return (json?.detail ?? null) as Detail | null
      })
      .then(next => { if (!cancelled && next) setDetail(next) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [provider, hotelId])

  const images = detail?.imageUrls?.length
    ? detail.imageUrls
    : fallbackImageUrl
      ? [fallbackImageUrl]
      : []

  if (!images.length && !loading) return null

  return (
    <section aria-label={`${hotelName} photos`} style={{ margin: '0 0 14px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 7 }}>
        <b style={{ fontSize: 11 }}>Property photos</b>
        <small style={{ color: 'var(--ink-3)', fontSize: 9 }}>
          {loading ? 'Loading provider gallery…' : `${images.length} provider image${images.length === 1 ? '' : 's'}`}
        </small>
      </div>
      {loading && !images.length ? (
        <div style={{ minHeight: 118, borderRadius: 12, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: 'var(--ink-3)', fontSize: 10 }}>Loading hotel photos…</div>
      ) : (
        <div style={{ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'minmax(145px, 62%)', gap: 7, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 3 }}>
          {images.map((src, index) => (
            <div key={`${src}-${index}`} style={{ minHeight: 118, borderRadius: 12, overflow: 'hidden', background: 'var(--surface-2)', scrollSnapAlign: 'start' }}>
              {/* Provider-returned content URL; plain img avoids requiring every provider host in Next image config. */}
              <img src={src} alt={`${hotelName} · photo ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} style={{ width: '100%', height: 118, objectFit: 'cover', display: 'block' }} />
            </div>
          ))}
        </div>
      )}
      <small style={{ display: 'block', marginTop: 5, color: 'var(--ink-3)', fontSize: 8.5 }}>Images are shown only when returned by the selected hotel/content provider. CreditIQ does not substitute another property&apos;s photos.</small>
    </section>
  )
}
