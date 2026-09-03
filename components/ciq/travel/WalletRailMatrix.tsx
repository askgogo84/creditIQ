'use client'

import { useEffect, useMemo, useState } from 'react'
import { authedFetch } from '@/lib/authed-fetch'
import type { RedemptionRailDefinition, TravelKind } from '@/lib/redemption-rails/types'
import type { WalletRailMatrix as Matrix } from '@/lib/redemption-rails/matrix'
import {
  buildFlightRedemptionPaths,
  rankWalletRails,
  type FlightRedemptionPath,
  type RankedRailCandidate,
  type RailRankingResult,
} from '@/lib/redemption-ranking'
import './wallet-rail-matrix.css'

type Response = { matrix?: Matrix; walletCount?: number; error?: string }

type WalletRailMatrixProps = {
  travelKind: TravelKind
  programmeId: string | null
  programmePointsRequired?: number | null
  awardTaxesMinor?: number | null
  awardTaxesCurrency?: string | null
  cashPriceMinor?: number | null
  cashCurrency?: string | null
}

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

function moneyMinor(value: number | null, currency: string | null) {
  if (value == null || !currency) return null
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value / 100)
  } catch {
    return `${currency} ${(value / 100).toLocaleString('en-IN')}`
  }
}

function candidateLabel(candidate: RankedRailCandidate, programmeId: string | null) {
  if (candidate.railType === 'CASH_RETAIN') return 'Cash + retain points'
  if (candidate.railType === 'LOYALTY_TRANSFER') {
    return `${candidate.cardName}${programmeId ? ` → ${programmeId}` : ' → loyalty transfer'}`
  }
  return `${candidate.cardName} · ${candidate.railType.replaceAll('_', ' ').toLowerCase()}`
}

function RankingSummary({ ranking }: { ranking: RailRankingResult }) {
  const projected = ranking.bestProjected
  const executable = ranking.bestExecutable
  const programmeId = ranking.pricing.programmeId

  if (ranking.recommendationState === 'NO_COMPARABLE_PATH') {
    return (
      <div className="wrm-ranking neutral">
        <div><small>Decision status</small><b>No safe economic winner yet</b><span>Required cash/FX/checkout facts are incomplete. Rails stay visible but unranked.</span></div>
      </div>
    )
  }

  if (ranking.recommendationState === 'PROJECTED_WINNER_NEEDS_VERIFICATION' && projected) {
    return (
      <div className="wrm-ranking projected">
        <div className="wrm-ranking-row">
          <div><small>Best projected path · verification required</small><b>{candidateLabel(projected, programmeId)}</b><span>{moneyMinor(projected.cashPayableMinor, projected.cashCurrency) ?? 'Cash component unavailable'}{projected.bankPointsTargetMinimum != null ? ` · at least ${projected.bankPointsTargetMinimum.toLocaleString('en-IN')} bank points` : ''}</span></div>
          <em>Projected</em>
        </div>
        {executable && (
          <div className="wrm-ranking-row executable">
            <div><small>Best executable now</small><b>{candidateLabel(executable, programmeId)}</b><span>{moneyMinor(executable.cashPayableMinor, executable.cashCurrency) ?? 'Cash amount unavailable'}</span></div>
            <em>Executable</em>
          </div>
        )}
        <p>Projected paths are never promoted to an exact transfer instruction until the missing issuer/checkout facts are verified.</p>
      </div>
    )
  }

  if (executable) {
    return (
      <div className="wrm-ranking executable-only">
        <div className="wrm-ranking-row executable">
          <div><small>{ranking.recommendationState === 'CASH_ONLY' ? 'Best executable now' : 'Best executable path'}</small><b>{candidateLabel(executable, programmeId)}</b><span>{moneyMinor(executable.cashPayableMinor, executable.cashCurrency) ?? 'Cash amount unavailable'}</span></div>
          <em>Executable</em>
        </div>
      </div>
    )
  }

  return null
}

function ratioLabel(path: Extract<FlightRedemptionPath, { kind: 'TRANSFER_THEN_BOOK' }>) {
  return `${path.ratio.fromUnits}:${path.ratio.toUnits}`
}

function FlightPathCard({ path, label }: { path: FlightRedemptionPath; label: string }) {
  const stateLabel = path.state === 'EXECUTABLE' ? 'Executable' : 'Projected · verify first'

  if (path.kind === 'TRANSFER_THEN_BOOK') {
    const bankAmount = path.bankPointsToTransferExact ?? path.bankPointsTargetMinimum
    return (
      <article className={`wrm-path ${path.state === 'EXECUTABLE' ? 'executable' : 'projected'}`}>
        <div className="wrm-path-head">
          <div><small>{label}</small><b>{path.cardName} → {path.programmeName}</b><span>{bankAmount.toLocaleString('en-IN')} {path.bankPointsToTransferExact == null ? 'minimum target' : 'bank points'} · {ratioLabel(path)}</span></div>
          <em>{stateLabel}</em>
        </div>
        <div className="wrm-path-steps">
          <div><i>1</i><p><b>Reconfirm this exact award first</b><span>Check the same flight, date, cabin, {path.programmePointsRequired.toLocaleString('en-IN')} {path.destinationCurrency} and {moneyMinor(path.awardTaxesMinor, path.awardTaxesCurrency)} taxes before any points move. <a href={path.bookingUrl} target="_blank" rel="noopener noreferrer">Check directly →</a></span></p></div>
          {path.bankPointsToTransferExact == null && <div><i>2</i><p><b>Verify the issuer minimum and increment</b><span>The ratio-derived target is at least {path.bankPointsTargetMinimum.toLocaleString('en-IN')} {path.bank} points. This is not an exact transfer instruction yet.</span></p></div>}
          <div><i>{path.bankPointsToTransferExact == null ? '3' : '2'}</i><p><b>{path.bankPointsToTransferExact == null ? 'Transfer only after both checks pass' : `Transfer ${path.bankPointsToTransferExact.toLocaleString('en-IN')} bank points`}</b><span>Transfer timing: {path.durationText}. The transfer cannot be reversed.</span></p></div>
          <div><i>{path.bankPointsToTransferExact == null ? '4' : '3'}</i><p><b>Book direct and pay taxes</b><span>Redeem {path.programmePointsRequired.toLocaleString('en-IN')} {path.destinationCurrency}; pay {moneyMinor(path.awardTaxesMinor, path.awardTaxesCurrency)} separately in cash.</span></p></div>
        </div>
        <div className="wrm-path-warning"><b>Availability-before-transfer gate</b><span>{path.warning}</span></div>
      </article>
    )
  }

  if (path.kind === 'PORTAL_NO_TRANSFER') {
    return (
      <article className={`wrm-path ${path.state === 'EXECUTABLE' ? 'executable' : 'projected'}`}>
        <div className="wrm-path-head"><div><small>{label}</small><b>Use {path.portalName}</b><span>{path.portalPointsUsed.toLocaleString('en-IN')} points · {(path.portalMaxPointsShareBps / 100).toLocaleString('en-IN')}% booking cap</span></div><em>{stateLabel}</em></div>
        <div className="wrm-path-steps">
          <div><i>1</i><p><b>Book in {path.portalName}</b><span>Apply {path.portalPointsUsed.toLocaleString('en-IN')} {path.cardName} points at {moneyMinor(path.portalValuePerPointPaise, 'INR')} per point. <a href={path.bookingUrl} target="_blank" rel="noopener noreferrer">Open portal →</a></span></p></div>
          <div><i>2</i><p><b>Pay the cash remainder</b><span>Pay {moneyMinor(path.cashPayableMinor, path.cashCurrency)}, including the {moneyMinor(path.portalFeeMinor, path.cashCurrency)} redemption fee.</span></p></div>
        </div>
        <div className="wrm-path-safe">No transfer, no waiting, and no irreversible points move before payment.</div>
      </article>
    )
  }

  return (
    <article className="wrm-path executable">
      <div className="wrm-path-head"><div><small>{label}</small><b>Pay cash and retain points</b><span>{moneyMinor(path.cashPayableMinor, path.cashCurrency)} · wallet points untouched</span></div><em>Executable</em></div>
      <div className="wrm-path-steps">
        <div><i>1</i><p><b>Recheck the matched cash itinerary</b><span>Confirm the current fare and conditions at the selected booking provider.</span></p></div>
        <div><i>2</i><p><b>Pay cash</b><span>Complete the booking for {moneyMinor(path.cashPayableMinor, path.cashCurrency)} without transferring bank points.</span></p></div>
        <div><i>3</i><p><b>Keep your points</b><span>Retain every wallet point for a later redemption with fully verified execution terms.</span></p></div>
      </div>
    </article>
  )
}

function FlightExecutionPaths({ ranking }: { ranking: RailRankingResult }) {
  if (ranking.pricing.travelKind !== 'flight') return null
  const paths = buildFlightRedemptionPaths(ranking)
  if (!paths.bestProjected && !paths.bestExecutable) return null

  return (
    <div className="wrm-paths" aria-label="Flight redemption execution paths">
      <div className="wrm-section-title"><b>What happens next</b><span>Projected economics and executable action stay separate.</span></div>
      {paths.bestProjected && <FlightPathCard path={paths.bestProjected} label="Best projected path" />}
      {paths.bestExecutable && <FlightPathCard path={paths.bestExecutable} label="Best executable now" />}
    </div>
  )
}

export function WalletRailMatrix({
  travelKind,
  programmeId,
  programmePointsRequired = null,
  awardTaxesMinor = null,
  awardTaxesCurrency = null,
  cashPriceMinor = null,
  cashCurrency = null,
}: WalletRailMatrixProps) {
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

  const ranking = useMemo(() => {
    if (!matrix) return null
    try {
      return rankWalletRails(matrix, {
        travelKind,
        programmeId,
        programmePointsRequired,
        awardTaxesMinor,
        awardTaxesCurrency,
        cashPriceMinor,
        cashCurrency,
      })
    } catch {
      return null
    }
  }, [matrix, travelKind, programmeId, programmePointsRequired, awardTaxesMinor, awardTaxesCurrency, cashPriceMinor, cashCurrency])

  return (
    <section className="wrm-root" aria-label="Wallet redemption paths">
      <div className="wrm-head">
        <div><b>All redemption paths in your wallet</b><span>{loading ? 'Comparing your cards…' : `${cards.length} cards compared · ${counts.usable} usable/verification paths · ${counts.discovery} discovery · ${counts.unsupported} unmapped`}</span></div>
        {programmeId && <small>{programmeId}</small>}
      </div>

      {!loading && !error && ranking && <RankingSummary ranking={ranking} />}
      {!loading && !error && ranking && <FlightExecutionPaths ranking={ranking} />}
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
      <div className="wrm-foot">This panel assembles safe next steps from sourced rails. Exact transfer amounts remain withheld until issuer minimum/increment and final checkout are verified.</div>
    </section>
  )
}
