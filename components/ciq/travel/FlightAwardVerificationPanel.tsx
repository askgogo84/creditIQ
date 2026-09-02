'use client'

import { useEffect, useMemo, useState } from 'react'
import { authedFetch } from '@/lib/authed-fetch'
import type { FlightAwardOption } from '@/lib/award-inventory/types'
import { WalletRailMatrix } from './WalletRailMatrix'
import './flight-award-verification.css'

type Attempt = { source: string; configured: boolean; state: string; freshness: string | null; reason: string }
type Response = {
  status?: string
  options?: FlightAwardOption[]
  attempts?: Attempt[]
  pricingAuthority?: string
  reason?: string
  error?: string
}

export function FlightAwardVerificationPanel({
  programmeId,
  programmeName,
  origin,
  destination,
  date,
  cabin,
  cachedMiles,
  cachedTaxesMinor,
  cachedTaxesCurrency,
  cashPriceMinor,
  cashCurrency,
}: {
  programmeId: string | null
  programmeName: string
  origin: string
  destination: string
  date: string
  cabin: 'economy' | 'premium-economy' | 'business' | 'first'
  cachedMiles: number
  cachedTaxesMinor: number | null
  cachedTaxesCurrency: string | null
  cashPriceMinor: number | null
  cashCurrency: string | null
}) {
  const [response, setResponse] = useState<Response | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setResponse(null)
    if (!programmeId) return () => { cancelled = true }
    setLoading(true)
    authedFetch('/api/flights/award-search', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, date, cabin, adults: 1, programmeId }),
    })
      .then(async (res) => {
        const data = await res.json() as Response
        if (!cancelled) setResponse(data)
      })
      .catch(() => { if (!cancelled) setResponse({ status: 'PROVIDER_UNAVAILABLE', reason: 'Live award verification request failed.', attempts: [] }) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [programmeId, origin, destination, date, cabin])

  const live = useMemo(() => {
    if (response?.status !== 'SUCCESS_LIVE_VERIFIED' || !response.options?.length) return null
    return [...response.options].sort((a, b) => a.miles - b.miles)[0]
  }, [response])

  const points = live?.miles ?? cachedMiles
  const taxesMinor = live?.taxesMinor ?? cachedTaxesMinor
  const taxesCurrency = live?.taxesCurrency ?? cachedTaxesCurrency
  const authority = live ? 'LIVE VERIFIED' : 'CACHED DISCOVERY'

  return (
    <div className="fav-root">
      <div className={`fav-status${live ? ' live' : ''}`}>
        <div><small>Award pricing authority</small><b>{authority}</b><span>{programmeName} · {points.toLocaleString('en-IN')} miles{live ? ' · live selected-programme result' : ' · broad cached discovery result'}</span></div>
        {loading ? <em>Verifying…</em> : <em>{response?.status ?? 'cached'}</em>}
      </div>

      {!!response?.attempts?.length && <div className="fav-attempts">{response.attempts.map((a, i) => (
        <div className="fav-attempt" key={`${a.source}-${i}`}><b>{a.source}</b><span>{a.state}{a.freshness ? ` · ${a.freshness}` : ''}</span><small>{a.reason}</small></div>
      ))}</div>}

      {!loading && response?.reason && !live && <div className="fav-note">{response.reason} Cached discovery remains visible; CreditIQ does not convert provider failure into “no award seats”.</div>}

      <WalletRailMatrix
        travelKind="flight"
        programmeId={programmeId}
        programmePointsRequired={points}
        awardTaxesMinor={taxesMinor}
        awardTaxesCurrency={taxesCurrency}
        cashPriceMinor={cashPriceMinor}
        cashCurrency={cashCurrency}
      />
      <div className="fav-foot">Direct airline/programme checkout remains the final verification boundary immediately before any irreversible transfer or booking.</div>
    </div>
  )
}
