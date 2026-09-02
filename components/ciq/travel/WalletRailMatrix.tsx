'use client'

import { useEffect, useMemo, useState } from 'react'
import { authedFetch } from '@/lib/authed-fetch'
import type { RedemptionRailDefinition, TravelKind } from '@/lib/redemption-rails/types'
import type { WalletRailMatrix as Matrix } from '@/lib/redemption-rails/matrix'
import './wallet-rail-matrix.css'

type Response = { matrix?: Matrix; walletCount?: number; error?: string }

function visibleRails(rails: RedemptionRailDefinition[], programmeId: string | null) {
  return rails.filter((rail) => {
    if (rail.type !== 'LOYALTY_TRANSFER') return true
    return !!programmeId && rail.transfer?.programmeId === programmeId
  })
}

function displayStatus(rails: RedemptionRailDefinition[]) {
  if (rails.some((r) => r.executionState === 'EXECUTABLE')) return 'EXECUTABLE'
  if (rails.some((r) => r.executionState === 'RATIO_ONLY' || r.executionState === 'CHECKOUT_REQUIRED')) return 'VERIFICATION_REQUIRED'
  if (rails.some((r) => r.executionState === 'DISCOVERY_ONLY')) return 'DISCOVERY_ONLY'
  return 'NO_VERIFIED_REDEMPTION_RAIL'
}

function railLabel(rail: RedemptionRailDefinition) {
  if (rail.type === 'LOYALTY_TRANSFER' && rail.transfer) {
    const { fromUnits, toUnits } = rail.transfer.ratio
    return `Transfer → ${rail.transfer.programmeName} · ${fromUnits}:${toUnits}`
  }
  if (rail.portal) return `${rail.portal.portalName}${rail.portal.supportsPointsPlusCash ? ' · Points + Cash' : ''}`
  if (rail.voucher) return `${rail.voucher.merchant} travel voucher`
  if (rail.type === 'COBRAND_NATIVE') return `Native points → ${rail.bookingDestination ?? 'loyalty programme'}`
  return rail.bookingDestination ?? rail.type.replaceAll('_', ' ')
}

function railStateLabel(rail: RedemptionRailDefinition) {
  if (rail.executionState === 'EXECUTABLE') return 'Executable'
  if (rail.executionState === 'RATIO_ONLY') return 'Ratio sourced · exact step withheld'
  if (rail.executionState === 'CHECKOUT_REQUIRED') return 'Checkout verification'
  return 'Discovery only'
}

export function WalletRailMatrix({
  travelKind,
  programmeId,
}: {
  travelKind: TravelKind
  programmeId: string | null
}) {
  const [matrix, setMatrix] = useState<Matrix | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    authedFetch('/api/travel/redemption-rails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ travelKind, programmeId }),
    })
      .then(async (res) => {
        const data = await res.json() as Response
        if (!res.ok) throw new Error(data.error || 'rail matrix unavailable')
        if (!cancelled) setMatrix(data.matrix ?? null)
      })
      .catch(() => {
        if (!cancelled) {
          setMatrix(null)
          setError('Couldn’t load your wallet redemption rails.')
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [travelKind, programmeId])

  const cards = useMemo(() => (matrix?.cards ?? []).map((card) => {
    const rails = visibleRails(card.rails, programmeId)
    return { ...card, rails, displayStatus: displayStatus(rails) }
  }), [matrix, programmeId])

  const counts = useMemo(() => ({
    usable: cards.filter((c) => c.displayStatus === 'EXECUTABLE' || c.displayStatus === 'VERIFICATION_REQUIRED').length,
    discovery: cards.filter((c) => c.displayStatus === 'DISCOVERY_ONLY').length,
    unsupported: cards.filter((c) => c.displayStatus === 'NO_VERIFIED_REDEMPTION_RAIL').length,
  }), [cards])

  return (
    <section className="wrm-root" aria-label="Wallet redemption paths">
      <div className="wrm-head">
        <div><b>All redemption paths in your wallet</b><span>{loading ? 'Comparing your cards…' : `${cards.length} cards compared · ${counts.usable} usable/verification paths · ${counts.discovery} discovery · ${counts.unsupported} unmapped`}</span></div>
        {programmeId && <small>{programmeId}</small>}
      </div>

      {loading && <div className="wrm-loading">Loading card-specific rails…</div>}
      {error && !loading && <div className="wrm-error">{error}</div>}
      {!loading && !error && cards.length === 0 && <div className="wrm-empty">No cards are connected to your decision wallet yet. Cash remains available.</div>}

      {!loading && !error && cards.map((card) => (
        <div className="wrm-card" key={card.walletKey}>
          <div className="wrm-card-head">
            <div><b>{card.cardName}</b><span>{card.bank}{card.pointsBalance != null ? ` · ${card.pointsBalance.toLocaleString('en-IN')} points` : ''}</span></div>
            <div className={`wrm-state ${card.displayStatus.toLowerCase()}`}>{card.displayStatus === 'VERIFICATION_REQUIRED' ? 'Needs verification' : card.displayStatus === 'NO_VERIFIED_REDEMPTION_RAIL' ? 'No sourced rail' : card.displayStatus === 'DISCOVERY_ONLY' ? 'Discovery only' : 'Executable'}</div>
          </div>
          <div className="wrm-provenance">Balance: {card.balanceVerified ? 'verified/connected source' : 'self-entered or unverified'}{card.cardId ? ` · exact product: ${card.cardId}` : ' · exact product not safely resolved'}</div>
          {card.rails.length ? (
            <div className="wrm-rails">
              {card.rails.map((rail) => (
                <div className="wrm-rail" key={rail.id}>
                  <div><b>{railLabel(rail)}</b><span>{rail.type.replaceAll('_', ' ')}</span></div>
                  <small>{railStateLabel(rail)}</small>
                </div>
              ))}
            </div>
          ) : <p className="wrm-none">The card remains in the comparison, but CreditIQ has no sourced redemption rail for this selected programme/property yet.</p>}
        </div>
      ))}

      {!loading && !error && <div className="wrm-cash"><b>Cash + retain points</b><span>Always available · selected booking provider</span><em>Executable</em></div>}
      <div className="wrm-foot">This panel enumerates sourced rails only. It does not perform irreversible transfer arithmetic; the redemption engine and final checkout verification remain authoritative.</div>
    </section>
  )
}
