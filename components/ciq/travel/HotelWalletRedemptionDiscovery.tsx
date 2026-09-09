'use client'

import { useEffect, useState } from 'react'
import { authedFetch } from '@/lib/authed-fetch'
import type { WalletRailMatrix } from '@/lib/redemption-rails/matrix'
import type { RedemptionRailDefinition } from '@/lib/redemption-rails/types'
import './wallet-rail-matrix.css'

type Response = { matrix?: WalletRailMatrix; error?: string }

function railLabel(rail: RedemptionRailDefinition) {
  if (rail.type === 'LOYALTY_TRANSFER' && rail.transfer) {
    const ratio = `${rail.transfer.ratio.fromUnits}:${rail.transfer.ratio.toUnits}`
    return {
      title: `Transfer → ${rail.transfer.programmeName}`,
      detail: `${ratio} · ${rail.transfer.destinationCurrency}${rail.transfer.durationText ? ` · ${rail.transfer.durationText}` : ' · timing verify'}`,
    }
  }
  if (rail.portal) {
    const mechanics = rail.portal.valuePerPointPaise != null && rail.portal.maxPointsShareBps != null
      ? `₹${(rail.portal.valuePerPointPaise / 100).toLocaleString('en-IN')} / point · up to ${(rail.portal.maxPointsShareBps / 100).toLocaleString('en-IN')}% of booking benchmark`
      : rail.portal.minimumPoints != null
        ? `Points + Pay · minimum ${rail.portal.minimumPoints.toLocaleString('en-IN')} points · exact quote at checkout`
        : 'Points + Pay path · exact economics at checkout'
    return { title: rail.portal.portalName, detail: mechanics }
  }
  if (rail.type === 'COBRAND_NATIVE') return { title: rail.bookingDestination || 'Native hotel points', detail: 'Native loyalty redemption · exact stay price at programme checkout' }
  if (rail.type === 'TRAVEL_VOUCHER') return { title: rail.voucher?.merchant || 'Travel voucher', detail: 'Voucher route exists · points cost/denomination still requires verification' }
  return { title: rail.bookingDestination || rail.type.replaceAll('_', ' '), detail: 'Redemption path exists · exact economics require verification' }
}

export function HotelWalletRedemptionDiscovery() {
  const [matrix, setMatrix] = useState<WalletRailMatrix | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    authedFetch('/api/travel/redemption-rails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ travelKind: 'hotel', programmeId: null }),
    })
      .then(async (res) => {
        const data = await res.json() as Response
        if (!res.ok) throw new Error(data.error || 'hotel wallet routes unavailable')
        if (!cancelled) setMatrix(data.matrix ?? null)
      })
      .catch(() => { if (!cancelled) setError('Couldn’t load the hotel redemption routes in your wallet.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) return <section className="wrm-root"><div className="wrm-loading">Checking your hotel redemption paths…</div></section>
  if (error) return <section className="wrm-root"><div className="wrm-error">{error}</div></section>
  if (!matrix) return null

  const cards = matrix.cards.filter((card) => card.rails.length > 0)

  return (
    <section className="wrm-root" aria-label="Hotel redemption paths available in your wallet">
      <div className="wrm-head">
        <div>
          <b>Your hotel redemption paths</b>
          <span>These routes exist independently of the missing live cash-hotel provider. Exact room/date points are only calculated after a live award/direct-programme quote.</span>
        </div>
        <small>Path discovery</small>
      </div>

      {cards.length === 0 && <div className="wrm-empty">No exact-card hotel redemption rails are mapped in this wallet yet.</div>}

      {cards.map((card) => (
        <div className="wrm-card" key={card.walletKey}>
          <div className="wrm-card-head">
            <div><b>{card.cardName}</b><span>{card.bank}{card.pointsBalance != null ? ` · ${card.pointsBalance.toLocaleString('en-IN')} points` : ''}</span></div>
            <div className="wrm-state verification_required">Routes available</div>
          </div>
          <div className="wrm-rails">
            {card.rails.map((rail) => {
              const label = railLabel(rail)
              return (
                <div className="wrm-rail" key={rail.id}>
                  <div><b>{label.title}</b><span>{label.detail}</span></div>
                  <small>{rail.executionState === 'RATIO_ONLY' ? 'Ratio sourced · verify before transfer' : rail.executionState === 'CHECKOUT_REQUIRED' ? 'Checkout quote required' : rail.executionState === 'EXECUTABLE' ? 'Executable' : 'Discovery only'}</small>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div className="wrm-foot">CreditIQ does not turn these into a fake room price. Once live hotel cash inventory and a safe property/award match are available, the same rails are ranked with required points, cash remainder and the final verdict.</div>
    </section>
  )
}
