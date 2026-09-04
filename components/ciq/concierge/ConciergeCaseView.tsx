'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { authedFetch } from '@/lib/authed-fetch'
import type { ConciergeStatus } from '@/lib/concierge/contract'

export type ConciergeCaseSummary = {
  id: string
  context: 'PERSONAL' | 'HNI'
  source_type: 'FLIGHT' | 'HOTEL'
  source_ref: string
  title: string
  status: ConciergeStatus
  approval_state: string
  expected_cash_minor: number | null
  currency: string
  contact_channel: string
  snapshot_trust: 'CLIENT_REQUEST' | 'SERVER_VERIFIED'
  created_at: string
  updated_at: string
}

type ConciergeCaseDetail = ConciergeCaseSummary & {
  selection: Record<string, unknown>
  redemption_snapshot: Record<string, unknown>
  source_snapshot: Record<string, unknown>
  notes: string | null
  approval_requested_at: string | null
  approved_at: string | null
  cancelled_at: string | null
  operator_verified_at: string | null
  verified_redemption_snapshot: Record<string, unknown> | null
  booking_reference: string | null
  reconciliation: Record<string, unknown> | null
}

const ACTIVE_CANCEL_STATES = new Set<ConciergeStatus>([
  'REVIEWING', 'OPTION_CONFIRMED', 'AWAITING_USER_APPROVAL',
  'NEEDS_INFORMATION', 'PRICE_CHANGED', 'AWARD_UNAVAILABLE',
])

const MAIN_STEPS: ConciergeStatus[] = [
  'REVIEWING',
  'OPTION_CONFIRMED',
  'AWAITING_USER_APPROVAL',
  'TRANSFER_APPROVED',
  'BOOKING_IN_PROGRESS',
  'BOOKED',
  'RECONCILED',
]

const STATUS_TITLE: Record<ConciergeStatus, string> = {
  REVIEWING: 'Concierge is reviewing your option',
  OPTION_CONFIRMED: 'Your option has been reconfirmed',
  AWAITING_USER_APPROVAL: 'Your approval is required',
  TRANSFER_APPROVED: 'Your approval is recorded',
  BOOKING_IN_PROGRESS: 'Booking is in progress',
  BOOKED: 'Booking completed',
  RECONCILED: 'Booked and reconciled',
  NEEDS_INFORMATION: 'Concierge needs more information',
  PRICE_CHANGED: 'The price or points requirement changed',
  AWARD_UNAVAILABLE: 'The selected award is no longer available',
  CANCELLED: 'Case cancelled',
  FAILED: 'Booking execution failed',
}

function money(minor: number | null, currency: string) {
  if (minor === null) return 'Needs verification'
  if (currency === 'INR') {
    return `₹${(minor / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
  }
  return `${currency} ${(minor / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function label(status: string) {
  return status.replaceAll('_', ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase())
}

function stepIndex(status: ConciergeStatus): number {
  const i = MAIN_STEPS.indexOf(status)
  if (i >= 0) return i
  if (status === 'NEEDS_INFORMATION' || status === 'PRICE_CHANGED' || status === 'AWARD_UNAVAILABLE') return 0
  if (status === 'FAILED') return 4
  return -1
}

export default function ConciergeCaseView() {
  const params = useSearchParams()
  const requestedId = params.get('case')
  const [cases, setCases] = useState<ConciergeCaseSummary[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(requestedId)
  const [detail, setDetail] = useState<ConciergeCaseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await authedFetch('/api/concierge/cases')
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'Could not load Concierge cases.')
      const next = (json.cases ?? []) as ConciergeCaseSummary[]
      setCases(next)
      setSelectedId((current) => current || next[0]?.id || null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load Concierge cases.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDetail = useCallback(async (id: string) => {
    setError(null)
    try {
      const res = await authedFetch(`/api/concierge/cases/${encodeURIComponent(id)}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'Could not load this Concierge case.')
      setDetail(json.case as ConciergeCaseDetail)
    } catch (e) {
      setDetail(null)
      setError(e instanceof Error ? e.message : 'Could not load this Concierge case.')
    }
  }, [])

  useEffect(() => { void loadList() }, [loadList])
  useEffect(() => { if (selectedId) void loadDetail(selectedId); else setDetail(null) }, [selectedId, loadDetail])

  async function userAction(action: 'APPROVE' | 'CANCEL') {
    if (!detail) return
    setBusy(true)
    setError(null)
    try {
      const res = await authedFetch(`/api/concierge/cases/${encodeURIComponent(detail.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'Could not update the case.')
      setDetail(json.case as ConciergeCaseDetail)
      setCases((current) => current.map((c) => c.id === detail.id ? { ...c, ...json.case } : c))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the case.')
    } finally {
      setBusy(false)
    }
  }

  const activeCount = useMemo(
    () => cases.filter((c) => !['RECONCILED', 'CANCELLED', 'FAILED'].includes(c.status)).length,
    [cases],
  )

  return (
    <div style={{ width: '100%', margin: 0, padding: '8px 0 40px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--copper)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em' }}>CreditIQ Concierge</div>
          <h1 style={{ margin: '5px 0 6px', fontSize: 30, color: 'var(--ink)', letterSpacing: '-.035em' }}>Your booking cases</h1>
          <p style={{ margin: 0, maxWidth: 700, color: 'var(--ink-2)', fontSize: 13, lineHeight: 1.5 }}>
            Concierge carries the Travel recommendation into execution. Research can start immediately; irreversible points transfers and payments remain locked until the final option is verified and you approve it.
          </p>
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{activeCount} active · {cases.length} total</div>
      </div>

      {error && <div role="alert" style={{ marginBottom: 14, padding: 12, borderRadius: 10, border: '1px solid var(--red)', color: 'var(--red)', background: 'var(--red-soft)' }}>{error}</div>}

      {loading ? (
        <div style={{ padding: 30, border: '1px solid var(--line)', borderRadius: 14, background: 'var(--surface)' }}>Loading Concierge cases…</div>
      ) : cases.length === 0 ? (
        <div style={{ padding: 34, border: '1px solid var(--line)', borderRadius: 14, background: 'var(--surface)', color: 'var(--ink-2)' }}>
          No Concierge cases yet. Choose a flight or hotel in Travel and use “Have CreditIQ Concierge book this”.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,.8fr) minmax(0,1.4fr)', gap: 16, alignItems: 'start' }}>
          <div style={{ border: '1px solid var(--line)', borderRadius: 14, background: 'var(--surface)', overflow: 'hidden' }}>
            {cases.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                aria-pressed={selectedId === c.id}
                style={{
                  width: '100%', border: 0, borderBottom: '1px solid var(--line-soft)', textAlign: 'left',
                  padding: 14, background: selectedId === c.id ? 'var(--surface-2)' : 'var(--surface)', color: 'var(--ink)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                  <b style={{ fontSize: 12 }}>{c.title}</b>
                  <span style={{ fontSize: 9, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{c.source_type}</span>
                </div>
                <div style={{ marginTop: 5, fontSize: 10, color: 'var(--ink-3)' }}>{label(c.status)} · {money(c.expected_cash_minor, c.currency)}</div>
              </button>
            ))}
          </div>

          {detail ? <CaseDetail caseDetail={detail} busy={busy} onAction={userAction} /> : (
            <div style={{ padding: 28, border: '1px solid var(--line)', borderRadius: 14, background: 'var(--surface)' }}>Select a case.</div>
          )}
        </div>
      )}
    </div>
  )
}

function CaseDetail({
  caseDetail: c,
  busy,
  onAction,
}: {
  caseDetail: ConciergeCaseDetail
  busy: boolean
  onAction: (action: 'APPROVE' | 'CANCEL') => void
}) {
  const current = stepIndex(c.status)
  const canApprove = c.status === 'AWAITING_USER_APPROVAL'
  const canCancel = ACTIVE_CANCEL_STATES.has(c.status)
  const verifiedSnapshot = c.snapshot_trust === 'SERVER_VERIFIED' || c.verified_redemption_snapshot !== null

  return (
    <article style={{ border: '1px solid var(--line)', borderRadius: 14, background: 'var(--surface)', overflow: 'hidden' }}>
      <header style={{ padding: 18, borderBottom: '1px solid var(--line)', background: 'var(--surface-2)' }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--copper)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
          {c.context} · {c.source_type} · case {c.id.slice(0, 8)}
        </div>
        <h2 style={{ margin: '5px 0 4px', fontSize: 21, color: 'var(--ink)' }}>{STATUS_TITLE[c.status]}</h2>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.5 }}>{c.title}</p>
      </header>

      <section style={{ padding: 18, borderBottom: '1px solid var(--line)' }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>Case lifecycle</div>
        <div style={{ display: 'grid', gap: 9 }}>
          {MAIN_STEPS.map((status, i) => {
            const done = current > i || c.status === 'RECONCILED'
            const active = current === i
            return (
              <div key={status} style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: 9, alignItems: 'start', opacity: done || active ? 1 : .48 }}>
                <div style={{ width: 24, height: 24, borderRadius: 999, display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 800, background: done ? 'var(--green-soft)' : active ? 'var(--surface-3, #eee4da)' : 'var(--surface-2)', color: done ? 'var(--prov-verified)' : 'var(--ink-3)' }}>{done ? '✓' : i + 1}</div>
                <div><b style={{ display: 'block', fontSize: 11 }}>{label(status)}</b><span style={{ display: 'block', marginTop: 2, fontSize: 9, color: 'var(--ink-3)' }}>{stageCopy(status)}</span></div>
              </div>
            )
          })}
        </div>
      </section>

      <section style={{ padding: 18, borderBottom: '1px solid var(--line)' }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Locked request snapshot</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Info label="Expected cash" value={money(c.expected_cash_minor, c.currency)} />
          <Info label="Snapshot trust" value={c.snapshot_trust === 'CLIENT_REQUEST' ? 'Client request · not verified truth' : 'Server verified'} />
          <Info label="Contact" value={label(c.contact_channel)} />
          <Info label="Approval" value={label(c.approval_state)} />
        </div>
        {!verifiedSnapshot && (
          <div style={{ marginTop: 10, padding: 10, border: '1px solid var(--line)', borderRadius: 10, fontSize: 10, lineHeight: 1.5, color: 'var(--ink-2)', background: 'var(--surface-2)' }}>
            The numbers carried from Travel are context for Concierge, not verified financial truth. The operator/server must reconfirm inventory and unresolved transfer terms before requesting your approval.
          </div>
        )}
      </section>

      {c.status === 'AWAITING_USER_APPROVAL' && (
        <section style={{ padding: 18, borderBottom: '1px solid var(--line)', background: 'var(--amber-soft)' }}>
          <b style={{ display: 'block', fontSize: 12 }}>Irreversible action requires your approval</b>
          <p style={{ fontSize: 10, lineHeight: 1.5, color: 'var(--ink-2)' }}>
            CreditIQ should show the final verified redemption/payment instruction here before this button is enabled. Approval moves the case to TRANSFER_APPROVED; it does not itself execute a bank transfer in this build.
          </p>
          <button type="button" disabled={busy} onClick={() => onAction('APPROVE')} style={{ minHeight: 42, padding: '0 15px', border: 0, borderRadius: 10, background: 'var(--ink)', color: 'var(--paper)', fontWeight: 750 }}>
            {busy ? 'Saving…' : 'Approve transfer + booking'}
          </button>
        </section>
      )}

      {c.reconciliation && (
        <section style={{ padding: 18, borderBottom: '1px solid var(--line)' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Reconciliation</div>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 10, color: 'var(--ink-2)', margin: 0 }}>{JSON.stringify(c.reconciliation, null, 2)}</pre>
        </section>
      )}

      <footer style={{ padding: 14, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 9, color: 'var(--ink-3)' }}>Created {new Date(c.created_at).toLocaleString('en-IN')}</span>
        {canCancel && <button type="button" disabled={busy} onClick={() => onAction('CANCEL')} style={{ minHeight: 38, padding: '0 12px', border: '1px solid var(--line)', borderRadius: 9, background: 'var(--surface)', color: 'var(--ink-2)' }}>{busy ? 'Saving…' : 'Cancel case'}</button>}
        {!canApprove && c.status === 'REVIEWING' && <span style={{ fontSize: 9, color: 'var(--ink-3)' }}>No approval action is available while Concierge is still reviewing.</span>}
      </footer>
    </article>
  )
}

function Info({ label: l, value }: { label: string; value: string }) {
  return <div style={{ padding: 9, border: '1px solid var(--line)', borderRadius: 9 }}><span style={{ display: 'block', fontSize: 8, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{l}</span><b style={{ display: 'block', marginTop: 4, fontSize: 10 }}>{value}</b></div>
}

function stageCopy(status: ConciergeStatus): string {
  switch (status) {
    case 'REVIEWING': return 'Concierge reconfirms inventory, price and transfer facts.'
    case 'OPTION_CONFIRMED': return 'The exact option is ready for the approval request.'
    case 'AWAITING_USER_APPROVAL': return 'No irreversible action can proceed without you.'
    case 'TRANSFER_APPROVED': return 'Your approval has been recorded for the verified action.'
    case 'BOOKING_IN_PROGRESS': return 'Execution may begin only after approval.'
    case 'BOOKED': return 'The reservation/ticket has been completed.'
    case 'RECONCILED': return 'Quoted versus actual points and cash are recorded.'
    default: return ''
  }
}
