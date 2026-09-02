'use client'

import { useEffect, useMemo, useState } from 'react'
import { authedFetch } from '@/lib/authed-fetch'
import type { StayCard } from '@/components/ciq/stay-points/StayOnPointsView'
import { ConciergeRequestButton } from '@/components/ciq/concierge/ConciergeRequestButton'
import { buildHotelConciergeRequest } from '@/components/ciq/concierge/travel-requests'
import './investor-hotel-workspace.css'

type Props = {
  city: string
  mode: string
  nights: number
  balance: number | null
  cards: StayCard[]
  fx: { rate: number; fetched_at: string; source: string } | null
  programmeConversionValueInr: number | null
  portalPerPoint: number
  portalCapPct: number
  portalFeeInr: number
  portalSource: string
  portalAsOf: string
  ratioSource: string
  ratioAsOf: string
  programmeCount: number
}

type TravelWalletCard = {
  bank: string
  cardName: string | null
  points: number
  verified: boolean
  selfEntered: boolean
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`
const money = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const pts = (n: number) => Math.round(n).toLocaleString('en-IN')

function transferExecutionBlocked(card: StayCard): boolean {
  return card.recommended_path === 'TRANSFER_THEN_BOOK' && card.bank_points_exact === null
}

function pathTitle(card: StayCard): string {
  if (transferExecutionBlocked(card)) return 'Transfer path ranks best — exact issuer step withheld'
  switch (card.recommended_path) {
    case 'TRANSFER_THEN_BOOK': return 'Transfer, then book direct'
    case 'REDEEM_EXISTING_BALANCE': return 'Use existing programme balance'
    case 'PORTAL': return 'Use SmartBuy portal'
    case 'CASH_AND_RETAIN': return 'Pay cash and retain points'
    case 'QUOTE_REQUIRED': return 'Award quote required'
    case 'NO_RECOMMENDATION': return 'No safe recommendation yet'
  }
}

function cashFor(card: StayCard): number {
  if (card.execution_cash_payable_inr !== null) return card.execution_cash_payable_inr
  if (card.portal_cash_payable_inr !== null && card.recommended_path === 'PORTAL') return card.portal_cash_payable_inr
  return card.cash_total_inr
}

function isSupportedAccorWalletCard(card: TravelWalletCard): boolean {
  const bank = (card.bank || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const name = (card.cardName || '').toLowerCase()
  // The current hotel engine is explicitly wired to the HDFC Infinia route.
  // Do not auto-promote another HDFC product to Infinia economics.
  return bank.startsWith('hdfc') && name.includes('infinia') && card.points > 0
}

export default function InvestorHotelWorkspace(p: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(p.cards[0]?.id ?? null)
  const [walletBridgeState, setWalletBridgeState] = useState<'idle' | 'loading' | 'not-found'>('idle')
  const selected = useMemo(
    () => p.cards.find((card) => card.id === selectedId) ?? p.cards[0] ?? null,
    [p.cards, selectedId],
  )

  // Temporary cut-over bridge: the v3.1 server page still accepts an explicit
  // `points` query because the redemption engine itself is server-side. When no
  // balance was supplied, hydrate ONLY the currently-supported Infinia balance
  // from the authenticated canonical wallet and reload the same URL with it.
  // This removes the manual demo query-string step without pretending other HDFC
  // products share Infinia/Accor rules. The query bridge disappears once Hotels
  // accepts the full wallet server-side.
  useEffect(() => {
    if (p.balance !== null || typeof window === 'undefined') return
    let cancelled = false
    setWalletBridgeState('loading')

    ;(async () => {
      try {
        const res = await authedFetch('/api/travel/wallet')
        const data = await res.json()
        if (!res.ok || cancelled) throw new Error(data?.error || 'wallet unavailable')
        const supported = ((data.cards || []) as TravelWalletCard[]).find(isSupportedAccorWalletCard)
        if (!supported) {
          if (!cancelled) setWalletBridgeState('not-found')
          return
        }

        const url = new URL(window.location.href)
        url.searchParams.set('points', String(supported.points))
        window.location.assign(url.toString())
      } catch {
        if (!cancelled) setWalletBridgeState('not-found')
      }
    })()

    return () => { cancelled = true }
  }, [p.balance])

  const executable = p.cards.filter((card) => card.recommended_path !== 'NO_RECOMMENDATION' && !transferExecutionBlocked(card)).length
  const guarded = p.cards.filter(transferExecutionBlocked).length

  return (
    <div className="ihw-root" data-mode={p.mode}>
      <div className="ihw-title-row">
        <div>
          <h1>Hotels: compare the booking path, not just point value.</h1>
          <p>Compact property results on the left. The selected hotel’s cash, portal and programme path on the right — using the exact v3.1 output already computed by CreditIQ.</p>
        </div>
        <div className="ihw-live-state">{p.fx ? `EUR/INR ${p.fx.rate.toFixed(2)} · ${p.fx.source}` : 'Live EUR/INR unavailable · no fallback'}</div>
      </div>

      <div className="ihw-wallet-band">
        <div>
          <span>Current hotel wallet input</span>
          <b>{p.balance === null ? (walletBridgeState === 'loading' ? 'Connecting your supported wallet balance…' : 'No supported HDFC balance connected') : `${pts(p.balance)} HDFC Reward Points`}</b>
          <small>{p.balance === null ? (walletBridgeState === 'not-found' ? 'No HDFC Infinia balance was found in the signed-in wallet. Other cards remain visible in Wallet but are not assigned Infinia economics.' : 'CreditIQ is checking the signed-in wallet before asking you to enter anything.') : `Wallet balance loaded · nominal portal value ${inr(p.balance * p.portalPerPoint)} before cap and fee.`}</small>
        </div>
        <div>
          <span>Accor conversion</span>
          <b>{p.programmeConversionValueInr !== null ? `${money(p.programmeConversionValueInr)} / HDFC point` : 'Unavailable'}</b>
          <small>2 HDFC → 1 ALL · programme-level economics</small>
        </div>
        <div className="ihw-coverage-note">
          Multi-card hotel comparison is data-driven. This current engine has sourced HDFC→Accor logic; other wallet cards must not be invented until their hotel routes are captured.
        </div>
      </div>

      <div className="ihw-meta-row">
        <div><b>{p.city}</b> · {p.nights} nights · {p.cards.length} captured properties</div>
        <div>{executable} executable · {guarded} guarded transfer path{guarded === 1 ? '' : 's'}</div>
      </div>

      <div className="ihw-workspace">
        <div className="ihw-list">
          {p.cards.length === 0 ? (
            <div className="ihw-empty">Captured hotel rates are currently available for Bangkok only.</div>
          ) : p.cards.map((card) => (
            <button
              key={card.id}
              className={`ihw-row${selected?.id === card.id ? ' active' : ''}`}
              onClick={() => setSelectedId(card.id)}
              aria-pressed={selected?.id === card.id}
            >
              <div className="ihw-thumb" aria-hidden="true">{card.name.slice(0, 1)}</div>
              <div className="ihw-hotel-main">
                <b>{card.name}</b>
                <span>{card.area} · {card.star_rating} star · {card.room_type}</span>
                <small>{card.rate_is_live ? 'Live rate' : `Captured rate · ${card.rate_age_label}`}</small>
              </div>
              <div className="ihw-col"><b>{inr(card.cash_total_inr)}</b><span>cash total</span></div>
              <div className="ihw-col"><b>{card.programme_points_spent !== null ? `${pts(card.programme_points_spent)} ${card.programme_name}` : card.recommended_path === 'PORTAL' ? 'Portal' : '—'}</b><span>{pathTitle(card)}</span></div>
              <div className="ihw-col strong"><b>{inr(cashFor(card))}</b><span>cash on selected path</span></div>
            </button>
          ))}
        </div>

        <HotelDecisionPanel card={selected} props={p} />
      </div>
    </div>
  )
}

function HotelDecisionPanel({ card, props: p }: { card: StayCard | null; props: Props }) {
  if (!card) return <aside className="ihw-panel empty">Select a hotel to inspect its redemption path.</aside>

  const guarded = transferExecutionBlocked(card)
  const portalCash = card.portal_cash_payable_inr
  const programmeCash = card.execution_cash_payable_inr
  const conciergeRequest = buildHotelConciergeRequest(card, {
    city: p.city,
    nights: p.nights,
    fx: p.fx,
    portalAsOf: p.portalAsOf,
    ratioAsOf: p.ratioAsOf,
  })
  const safeForHandoff = card.recommended_path !== 'NO_RECOMMENDATION'

  return (
    <aside className="ihw-panel">
      <div className="ihw-panel-head">
        <span>Best redemption path</span>
        <h2>{pathTitle(card)}</h2>
        <p>{card.name} · {card.programme_name} · {inr(card.cash_total_inr)} cash booking</p>
        {guarded && <div className="ihw-guard-chip">RANKED · NOT YET EXECUTABLE</div>}
      </div>

      <div className="ihw-compare">
        <div className="ihw-label">Path comparison</div>
        {programmeCash !== null && (
          <PathRow
            label="PROGRAMME"
            detail={card.programme_points_spent !== null ? `${pts(card.programme_points_spent)} ${card.programme_name}` : 'Programme redemption'}
            value={inr(programmeCash)}
            active={card.recommended_path === 'TRANSFER_THEN_BOOK' || card.recommended_path === 'REDEEM_EXISTING_BALANCE'}
          />
        )}
        {portalCash !== null && (
          <PathRow
            label="PORTAL"
            detail={card.portal_points_used !== null ? `${pts(card.portal_points_used)} HDFC pts + ${money(card.portal_fee_inr ?? p.portalFeeInr)} fee` : 'SmartBuy'}
            value={money(portalCash)}
            active={card.recommended_path === 'PORTAL'}
          />
        )}
        <PathRow label="CASH" detail="Keep all bank points" value={inr(card.cash_total_inr)} active={card.recommended_path === 'CASH_AND_RETAIN'} />
      </div>

      <div className="ihw-steps">
        <div className="ihw-label">Execution path</div>
        {card.recommended_path === 'TRANSFER_THEN_BOOK' ? (
          <>
            <Step n="1" title="Reconfirm the exact room/rate" text={`Open ${card.programme_name} direct before moving points.`} />
            <Step n="2" title={card.bank_points_exact !== null ? `Transfer exactly ${pts(card.bank_points_exact)} HDFC Reward Points` : 'Do not transfer yet — exact issuer step withheld'} text={card.bank_points_target !== null ? `Arithmetic target: at least ${pts(card.bank_points_target)} HDFC Reward Points for ${pts(card.programme_points_spent ?? 0)} ${card.programme_name} points.` : 'Transfer target unavailable.'} />
            <Step n="3" title={card.programme_points_spent !== null ? `${card.bank_points_exact !== null ? 'Redeem' : 'If verified, redeem'} ${pts(card.programme_points_spent)} ${card.programme_name} points` : 'Use the verified programme block'} text={card.points_offset_inr !== null && card.execution_cash_payable_inr !== null ? `Projected offset ${inr(card.points_offset_inr)}, leaving ${inr(card.execution_cash_payable_inr)} in cash.` : 'CreditIQ is withholding the rupee redemption result until required inputs are trustworthy.'} />
          </>
        ) : card.recommended_path === 'PORTAL' ? (
          <>
            <Step n="1" title="Use SmartBuy" text={card.portal_points_used !== null ? `Use ${pts(card.portal_points_used)} HDFC Reward Points.` : 'Use the portal path selected by the engine.'} />
            <Step n="2" title="Pay the remaining cash" text={portalCash !== null ? `Cash payable is ${money(portalCash)}, including the redemption fee.` : 'Cash remainder unavailable.'} />
          </>
        ) : card.recommended_path === 'CASH_AND_RETAIN' ? (
          <Step n="1" title="Pay cash and retain points" text={`Pay ${inr(card.cash_total_inr)} and keep the bank balance for a stronger future redemption.`} />
        ) : card.recommended_path === 'REDEEM_EXISTING_BALANCE' ? (
          <Step n="1" title="Use the programme balance already held" text="No bank-points transfer is required." />
        ) : (
          <Step n="1" title="Do not force a booking instruction" text={card.blocked_reason || 'Required financial facts are not strong enough for a safe recommendation.'} />
        )}
      </div>

      {card.blocked_reason && <div className="ihw-blocked"><b>Why CreditIQ is cautious:</b> {card.blocked_reason}</div>}
      {guarded && <div className="ihw-warning">Transfers are irreversible. Current HDFC→Accor evidence says within 24 hours, but exact issuer minimum/increment and programme-eligible booking basis must be verified before an exact transfer instruction is shown.</div>}

      <div className="ihw-evidence">
        <div className="ihw-label">Evidence</div>
        <dl>
          <div><dt>Pricing</dt><dd>{card.pricing_state}</dd></div>
          <div><dt>Transfer</dt><dd>{card.transfer_state}</dd></div>
          <div><dt>Rules</dt><dd>{card.rule_state}</dd></div>
          <div><dt>Balance</dt><dd>{card.balance_state}</dd></div>
          <div><dt>Cash source</dt><dd>{card.rate_is_live ? 'LIVE' : `CAPTURED · ${card.rate_source}`}</dd></div>
          <div><dt>FX</dt><dd>{p.fx ? `${p.fx.rate.toFixed(2)} · ${p.fx.source}` : 'UNAVAILABLE · no fallback'}</dd></div>
        </dl>
        {card.conflicts.length > 0 && <p>{card.conflicts.join(' · ')}</p>}
      </div>

      <div className="ihw-actions">
        <a href={card.booking_url} target="_blank" rel="noopener noreferrer">Check direct →</a>
        <ConciergeRequestButton
          request={conciergeRequest}
          disabled={!safeForHandoff}
          disabledReason="CreditIQ needs a ranked safe path before handing this hotel to Concierge."
        />
      </div>

      <div className="ihw-source-note">Portal terms captured {p.portalAsOf}. HDFC transfer source captured {p.ratioAsOf}. Programme registry: {p.programmeCount}. Unknown facts stay unknown. A guarded transfer path may be handed to Concierge for verification, but not executed by the customer yet.</div>
    </aside>
  )
}

function PathRow({ label, detail, value, active }: { label: string; detail: string; value: string; active: boolean }) {
  return <div className={`ihw-path-row${active ? ' active' : ''}`}><b>{label}</b><span>{detail}</span><strong>{value}</strong></div>
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return <div className="ihw-step"><div>{n}</div><p><b>{title}</b><span>{text}</span></p></div>
}
