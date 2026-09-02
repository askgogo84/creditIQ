'use client'

import { useEffect, useMemo, useState } from 'react'
import { authedFetch } from '@/lib/authed-fetch'
import { joinHotelAwardRates } from '@/lib/award-inventory/hotel-join'
import type { AwardWalletHotelAwardRate } from '@/lib/award-inventory/providers/awardwallet'
import { WalletRailMatrix } from './WalletRailMatrix'
import './hotel-award-join.css'

type AwardSearchResponse = {
  status?: 'SUCCESS' | 'DIRECT_REQUIRED' | 'PENDING' | 'PROVIDER_ERROR'
  programmeId?: string
  provider?: { code: string; displayName: string; shortName: string; loginRequired: boolean } | null
  rates?: AwardWalletHotelAwardRate[]
  fetchedAt?: string
  reason?: string
  error?: string
}

export interface HotelAwardJoinOffer {
  id: string
  hotelName: string
  chainName: string | null
  latitude: number | null
  longitude: number | null
  currency: string
  totalPrice: number
}

function moneyMinor(value: number | null, currency: string | null) {
  if (value == null || !currency) return null
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency, maximumFractionDigits: 0,
    }).format(value / 100)
  } catch {
    return `${currency} ${(value / 100).toLocaleString('en-IN')}`
  }
}

export function HotelAwardJoinPanel({
  offer,
  programmeId,
  destination,
  checkInDate,
  checkOutDate,
  adults,
}: {
  offer: HotelAwardJoinOffer
  programmeId: string | null
  destination: string
  checkInDate: string
  checkOutDate: string
  adults: number
}) {
  const [response, setResponse] = useState<AwardSearchResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setResponse(null)
    if (!programmeId) return () => { cancelled = true }

    setLoading(true)
    authedFetch('/api/hotels/award-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        programmeId,
        destination,
        checkInDate,
        checkOutDate,
        numberOfRooms: 1,
        numberOfAdults: Math.max(1, Math.min(4, adults)),
        numberOfKids: 0,
      }),
    })
      .then(async (res) => {
        const data = await res.json() as AwardSearchResponse
        if (!cancelled) setResponse(data)
      })
      .catch(() => {
        if (!cancelled) setResponse({ status: 'PROVIDER_ERROR', rates: [], reason: 'Award inventory request failed.' })
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [programmeId, destination, checkInDate, checkOutDate, adults])

  const join = useMemo(() => {
    if (response?.status !== 'SUCCESS' || !response.rates?.length) return null
    return joinHotelAwardRates({
      id: offer.id,
      hotelName: offer.hotelName,
      chainName: offer.chainName,
      latitude: offer.latitude,
      longitude: offer.longitude,
    }, response.rates)
  }, [response, offer])

  const bestRate = join?.rates[0] ?? null
  const cashPriceMinor = Number.isFinite(offer.totalPrice) ? Math.round(offer.totalPrice * 100) : null

  if (!programmeId) {
    return (
      <div className="haj-root">
        <div className="haj-status neutral"><b>No loyalty programme safely mapped</b><span>Cash and generic portal/voucher rails remain visible. CreditIQ does not invent a hotel programme.</span></div>
        <WalletRailMatrix travelKind="hotel" programmeId={null} cashPriceMinor={cashPriceMinor} cashCurrency={offer.currency} />
      </div>
    )
  }

  return (
    <div className="haj-root">
      {loading && <div className="haj-status loading"><b>Checking hotel award inventory…</b><span>{programmeId} · {checkInDate} → {checkOutDate}</span></div>}

      {!loading && response?.status === 'DIRECT_REQUIRED' && (
        <div className="haj-status direct"><b>Direct programme check required</b><span>{response.reason || 'This programme is not available through a guest-capable award provider yet.'}</span></div>
      )}

      {!loading && response?.status === 'PENDING' && (
        <div className="haj-status pending"><b>Award search is still processing</b><span>{response.reason || 'Retry this selected hotel shortly.'}</span></div>
      )}

      {!loading && response?.status === 'PROVIDER_ERROR' && (
        <div className="haj-status error"><b>Award provider unavailable</b><span>{response.reason || response.error || 'Cash inventory remains usable.'}</span></div>
      )}

      {!loading && response?.status === 'SUCCESS' && !join && (
        <div className="haj-status nojoin"><b>Award inventory returned, but this property was not safely joined</b><span>CreditIQ found no exact/high-confidence match for {offer.hotelName}. The award price is deliberately not attached.</span></div>
      )}

      {!loading && join && bestRate && (
        <div className="haj-joined">
          <div className="haj-joined-head"><div><small>Cash + award joined</small><b>{join.awardHotelName}</b><span>{join.confidence} property match · {join.rates.length} award rate{join.rates.length === 1 ? '' : 's'} returned</span></div><em>{bestRate.source} · {bestRate.freshness}</em></div>
          <div className="haj-price-grid">
            <div><small>Lowest points option found</small><b>{bestRate.totalPoints.toLocaleString('en-IN')} pts</b><span>{bestRate.pointsPerNight.toLocaleString('en-IN')} / night · {bestRate.numberOfNights} nights</span></div>
            <div><small>Award cash component</small><b>{moneyMinor(bestRate.totalCashMinor, bestRate.cashCurrency) ?? 'None returned'}</b><span>{bestRate.rateName || bestRate.roomName || 'Award rate'}</span></div>
            <div><small>Cash benchmark</small><b>{offer.currency} {Math.round(offer.totalPrice).toLocaleString('en-IN')}</b><span>Selected live cash provider</span></div>
          </div>
          <p>Discovery evidence only. Direct programme checkout must reconfirm room/rate, availability and cash component before any irreversible points transfer.</p>
        </div>
      )}

      <WalletRailMatrix
        travelKind="hotel"
        programmeId={programmeId}
        programmePointsRequired={bestRate?.totalPoints ?? null}
        awardTaxesMinor={bestRate?.totalCashMinor ?? null}
        awardTaxesCurrency={bestRate?.cashCurrency ?? null}
        cashPriceMinor={cashPriceMinor}
        cashCurrency={offer.currency}
      />
    </div>
  )
}
