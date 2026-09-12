'use client'

import { useEffect, useMemo, useState } from 'react'
import { buildBookingExecutionPlan } from '@/lib/concierge/execution-plan'

type CaseRow = {
  id: string
  user_id: string
  source_type: 'FLIGHT' | 'HOTEL'
  title: string
  status: string
  approval_state: string
  snapshot_trust: string
  expected_cash_minor: number | null
  currency: string
  selection: Record<string, unknown>
  redemption_snapshot: Record<string, unknown>
  source_snapshot: Record<string, unknown>
  verified_redemption_snapshot: Record<string, unknown> | null
  booking_reference: string | null
  reconciliation: Record<string, unknown> | null
  updated_at: string
}

function money(minor: number | null, currency: string) {
  if (minor == null) return 'Unverified'
  return currency === 'INR' ? `₹${(minor / 100).toLocaleString('en-IN')}` : `${currency} ${(minor / 100).toLocaleString('en-IN')}`
}

export default function AdminConciergePage() {
  const [cases, setCases] = useState<CaseRow[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [verifiedJson, setVerifiedJson] = useState('{}')
  const [bookingReference, setBookingReference] = useState('')
  const [reconciliationJson, setReconciliationJson] = useState('{}')

  const selected = useMemo(() => cases.find(c => c.id === selectedId) ?? cases[0] ?? null, [cases, selectedId])
  const executionPlan = useMemo(() => selected ? buildBookingExecutionPlan({
    source_type: selected.source_type,
    selection: selected.selection ?? {},
    redemption_snapshot: selected.redemption_snapshot ?? {},
    source_snapshot: selected.source_snapshot ?? {},
    snapshot_trust: selected.snapshot_trust,
    verified_redemption_snapshot: selected.verified_redemption_snapshot ?? null,
  }) : null, [selected])

  async function load() {
    setError('')
    const res = await fetch('/api/admin/concierge/cases', { cache: 'no-store' })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) return setError(json?.error || 'Could not load Concierge queue')
    const rows = (json.cases ?? []) as CaseRow[]
    setCases(rows)
    setSelectedId(current => current || rows[0]?.id || null)
  }

  useEffect(() => { void load() }, [])
  useEffect(() => {
    if (!selected) return
    setVerifiedJson(JSON.stringify(selected.verified_redemption_snapshot ?? selected.redemption_snapshot ?? {}, null, 2))
    setBookingReference(selected.booking_reference ?? '')
    setReconciliationJson(JSON.stringify(selected.reconciliation ?? {}, null, 2))
  }, [selected?.id])

  async function act(action: string) {
    if (!selected) return
    setBusy(true); setError('')
    try {
      const body: Record<string, unknown> = { action, payload: { ui: 'admin-concierge' } }
      if (action === 'CONFIRM_OPTION') body.verifiedRedemptionSnapshot = JSON.parse(verifiedJson)
      if (action === 'MARK_BOOKED') body.bookingReference = bookingReference.trim()
      if (action === 'RECONCILE') body.reconciliation = JSON.parse(reconciliationJson)
      const res = await fetch(`/api/admin/concierge/cases/${encodeURIComponent(selected.id)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const detail = json?.executionPlan?.blockedReasons?.length ? ` · ${json.executionPlan.blockedReasons.join(' · ')}` : ''
        throw new Error(`${json?.error || 'Could not update case'}${detail}`)
      }
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update case')
    } finally { setBusy(false) }
  }

  return (
    <main style={{ maxWidth: 1320, margin: '0 auto', padding: '28px 22px 60px', color: 'var(--ink)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 20, marginBottom: 20 }}>
        <div><div style={{ color: 'var(--copper)', fontWeight: 800, fontSize: 11, letterSpacing: '.08em' }}>CONCIERGE OPS</div><h1 style={{ margin: '5px 0', fontSize: 32 }}>Travel execution queue</h1><p style={{ margin: 0, color: 'var(--ink-2)', maxWidth: 760 }}>Re-verify the exact flight/hotel, request approval, execute the chosen booking path, then record the real PNR/reservation reference and reconciliation.</p></div>
        <button onClick={() => void load()} style={{ minHeight: 40, padding: '0 14px' }}>Refresh</button>
      </div>
      {error && <div style={{ marginBottom: 14, padding: 12, border: '1px solid #c33', borderRadius: 10, color: '#c33' }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '340px minmax(0,1fr)', gap: 16 }}>
        <aside style={{ border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden', background: 'var(--surface)' }}>
          {cases.map(c => <button key={c.id} onClick={() => setSelectedId(c.id)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: 13, border: 0, borderBottom: '1px solid var(--line-soft)', background: selected?.id === c.id ? 'var(--surface-2)' : 'transparent', color: 'var(--ink)' }}><b style={{ display: 'block', fontSize: 12 }}>{c.title}</b><span style={{ fontSize: 10, color: 'var(--ink-3)' }}>{c.source_type} · {c.status} · {money(c.expected_cash_minor, c.currency)}</span></button>)}
        </aside>
        {selected ? <section style={{ border: '1px solid var(--line)', borderRadius: 14, background: 'var(--surface)', padding: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8, marginBottom: 16 }}>
            {[['Status', selected.status],['Trust',selected.snapshot_trust],['Approval',selected.approval_state],['Expected cash',money(selected.expected_cash_minor,selected.currency)]].map(([k,v]) => <div key={k} style={{ padding: 10, borderRadius: 10, background: 'var(--surface-2)' }}><small style={{ display: 'block', color: 'var(--ink-3)' }}>{k}</small><b style={{ fontSize: 11 }}>{v}</b></div>)}
          </div>

          {executionPlan && <div style={{ marginBottom: 16, padding: 14, border: `1px solid ${executionPlan.canStartBooking ? '#2e9d66' : '#c58b2c'}`, borderRadius: 12, background: 'var(--surface-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}><div><small style={{ display: 'block', color: 'var(--ink-3)' }}>EXECUTION MODE</small><b>{executionPlan.mode.replaceAll('_',' ')}</b></div><strong style={{ fontSize: 11 }}>{executionPlan.canStartBooking ? 'Executable after approval' : 'Blocked'}</strong></div>
            {!!executionPlan.provider && <p style={{ margin: '7px 0 0', fontSize: 11 }}>Provider: <b>{executionPlan.provider}</b></p>}
            {!!executionPlan.bookingUrl && <p style={{ margin: '5px 0 0', fontSize: 10, wordBreak: 'break-all' }}>Booking URL: {executionPlan.bookingUrl}</p>}
            {!!executionPlan.blockedReasons.length && <div style={{ marginTop: 8 }}>{executionPlan.blockedReasons.map(reason => <div key={reason} style={{ fontSize: 10, marginTop: 4 }}>⚠ {reason}</div>)}</div>}
            <ol style={{ margin: '10px 0 0', paddingLeft: 18 }}>{executionPlan.steps.map(step => <li key={step} style={{ fontSize: 10, margin: '4px 0' }}>{step}</li>)}</ol>
          </div>}

          <details open><summary style={{ fontWeight: 800, marginBottom: 8 }}>Exact selection</summary><pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, background: 'var(--surface-2)', padding: 12, borderRadius: 10 }}>{JSON.stringify(selected.selection, null, 2)}</pre></details>
          <details><summary style={{ fontWeight: 800, marginBottom: 8 }}>Source snapshot</summary><pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, background: 'var(--surface-2)', padding: 12, borderRadius: 10 }}>{JSON.stringify(selected.source_snapshot, null, 2)}</pre></details>

          {(selected.status === 'REVIEWING' || selected.status === 'PRICE_CHANGED' || selected.status === 'NEEDS_INFORMATION') && <div style={{ marginTop: 18 }}><label style={{ display: 'block', fontWeight: 800, fontSize: 12, marginBottom: 6 }}>Verified redemption snapshot</label><textarea value={verifiedJson} onChange={e => setVerifiedJson(e.target.value)} rows={12} style={{ width: '100%', fontFamily: 'monospace', fontSize: 11, padding: 10 }} /><small style={{ display: 'block', color: 'var(--ink-3)', marginTop: 5 }}>For a verified cash deeplink that was not present in the original search result, include booking_link/provider here. For a points path, include the verified recommended_candidate rail_type.</small><button disabled={busy} onClick={() => void act('CONFIRM_OPTION')} style={{ marginTop: 8, minHeight: 42, padding: '0 15px' }}>Confirm exact option</button></div>}
          {selected.status === 'OPTION_CONFIRMED' && <button disabled={busy} onClick={() => void act('REQUEST_APPROVAL')} style={{ minHeight: 42, padding: '0 15px' }}>Request user approval</button>}
          {selected.status === 'TRANSFER_APPROVED' && <button disabled={busy || !executionPlan?.canStartBooking} onClick={() => void act('START_BOOKING')} style={{ minHeight: 42, padding: '0 15px' }}>{executionPlan?.canStartBooking ? 'Start booking' : 'Booking blocked — resolve execution path'}</button>}
          {selected.status === 'BOOKING_IN_PROGRESS' && <div style={{ marginTop: 16 }}><label style={{ display: 'block', fontWeight: 800, fontSize: 12, marginBottom: 6 }}>Real PNR / reservation reference</label><input value={bookingReference} onChange={e => setBookingReference(e.target.value)} style={{ width: '100%', minHeight: 42, padding: '0 10px' }} /><button disabled={busy || !bookingReference.trim()} onClick={() => void act('MARK_BOOKED')} style={{ marginTop: 8, minHeight: 42, padding: '0 15px' }}>Mark booked</button></div>}
          {selected.status === 'BOOKED' && <div style={{ marginTop: 16 }}><label style={{ display: 'block', fontWeight: 800, fontSize: 12, marginBottom: 6 }}>Reconciliation</label><textarea value={reconciliationJson} onChange={e => setReconciliationJson(e.target.value)} rows={10} style={{ width: '100%', fontFamily: 'monospace', fontSize: 11, padding: 10 }} /><button disabled={busy} onClick={() => void act('RECONCILE')} style={{ marginTop: 8, minHeight: 42, padding: '0 15px' }}>Reconcile case</button></div>}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
            {['NEEDS_INFORMATION','PRICE_CHANGED','AWARD_UNAVAILABLE','FAIL'].map(action => <button key={action} disabled={busy} onClick={() => void act(action)} style={{ minHeight: 36, padding: '0 10px', fontSize: 10 }}>{action.replaceAll('_',' ')}</button>)}
          </div>
        </section> : <section style={{ padding: 30 }}>No Concierge cases.</section>}
      </div>
    </main>
  )
}