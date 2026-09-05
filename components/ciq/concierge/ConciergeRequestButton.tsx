'use client'

import Link from 'next/link'
import { useState } from 'react'
import { authedFetch } from '@/lib/authed-fetch'
import { CorporateTravelHandoffButton } from './CorporateTravelHandoffButton'

export type ConciergeRequest = {
  context?: 'PERSONAL' | 'HNI'
  sourceType: 'FLIGHT' | 'HOTEL'
  sourceRef: string
  title: string
  selection: Record<string, unknown>
  redemptionSnapshot: Record<string, unknown>
  sourceSnapshot: Record<string, unknown>
  expectedCashMinor: number | null
  currency?: string
  contactChannel?: 'APP' | 'WHATSAPP' | 'BOTH'
  notes?: string | null
}

type CreatedCase = {
  id: string
  status: string
  title: string
}

export function ConciergeRequestButton({
  request,
  disabled = false,
  disabledReason,
  label = 'Have CreditIQ Concierge book this',
}: {
  request: ConciergeRequest
  disabled?: boolean
  disabledReason?: string
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<CreatedCase | null>(null)

  async function createCase() {
    setBusy(true)
    setError(null)
    try {
      const res = await authedFetch('/api/concierge/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...request,
          context: request.context ?? 'PERSONAL',
          currency: request.currency ?? 'INR',
          contactChannel: request.contactChannel ?? 'BOTH',
          notes: request.notes ?? null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.error || 'Could not create the Concierge case.')
        return
      }
      setCreated(json.case)
    } catch {
      setError('Network error. Try again.')
    } finally {
      setBusy(false)
    }
  }

  if (created) {
    return (
      <div style={{ display: 'grid', gap: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--prov-verified, #2f6b4f)' }}>
          Concierge case created · {created.status.replaceAll('_', ' ').toLowerCase()}
        </div>
        <Link
          href={`/concierge?case=${encodeURIComponent(created.id)}`}
          style={{ fontSize: 12, fontWeight: 700, color: 'var(--copper)', textDecoration: 'none' }}
        >
          View case →
        </Link>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'grid', gap: 8 }}>
        <button
          type="button"
          disabled={disabled}
          title={disabled ? disabledReason : undefined}
          onClick={() => { setError(null); setOpen(true) }}
        >
          {label}
        </button>
        <CorporateTravelHandoffButton request={request} label="Corporate account · Send to Business Travel Desk" />
      </div>

      {open && (
        <div
          role="presentation"
          onMouseDown={(e) => { if (e.currentTarget === e.target && !busy) setOpen(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(20,16,13,.48)', display: 'grid', placeItems: 'center', padding: 20,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ciq-concierge-title"
            style={{
              width: 'min(620px, 100%)', background: 'var(--surface, #fff)',
              border: '1px solid var(--line)', borderRadius: 18,
              boxShadow: '0 28px 90px rgba(0,0,0,.25)', overflow: 'hidden',
            }}
          >
            <div style={{ padding: 20, borderBottom: '1px solid var(--line)', display: 'flex', gap: 16, justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--copper)' }}>
                  Personal / HNI Concierge handoff
                </div>
                <h3 id="ciq-concierge-title" style={{ margin: '5px 0 5px', fontSize: 20, color: 'var(--ink)' }}>
                  Have CreditIQ prepare this booking
                </h3>
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--ink-2)' }}>
                  {request.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !busy && setOpen(false)}
                aria-label="Close"
                style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid var(--line)', background: 'var(--surface)' }}
              >×</button>
            </div>

            <div style={{ padding: 20, display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Summary label="Request type" value={request.sourceType === 'FLIGHT' ? 'Flight booking' : 'Hotel booking'} />
                <Summary label="Expected cash" value={request.expectedCashMinor === null ? 'Needs verification' : `₹${(request.expectedCashMinor / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
                <Summary label="Contact" value={request.contactChannel === 'APP' ? 'CreditIQ app' : 'App + WhatsApp'} />
                <Summary label="Initial state" value="REVIEWING" />
              </div>

              <div style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 11, background: 'var(--surface-2)' }}>
                <b style={{ display: 'block', fontSize: 11, marginBottom: 4 }}>Approval boundary</b>
                <span style={{ display: 'block', fontSize: 11, lineHeight: 1.5, color: 'var(--ink-2)' }}>
                  Creating this case authorises research and option preparation only. CreditIQ cannot move irreversible points or charge a payment method until the final option is re-verified and you explicitly approve it.
                </span>
              </div>

              <div style={{ fontSize: 10, lineHeight: 1.5, color: 'var(--ink-3)' }}>
                The Travel screen sends a bounded request snapshot. CreditIQ stores it as CLIENT_REQUEST, not as verified financial truth. Concierge must re-check live inventory and unresolved transfer facts before requesting approval.
              </div>

              {error && <div role="alert" style={{ fontSize: 12, color: 'var(--red, #9a4138)' }}>{error}</div>}
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                disabled={busy}
                onClick={() => setOpen(false)}
                style={{ minHeight: 42, padding: '0 14px', border: '1px solid var(--line)', borderRadius: 10, background: 'var(--surface)' }}
              >Cancel</button>
              <button
                type="button"
                disabled={busy}
                onClick={createCase}
                style={{ minHeight: 42, padding: '0 16px', border: 0, borderRadius: 10, background: 'var(--ink)', color: 'var(--paper, #fff)', fontWeight: 750 }}
              >{busy ? 'Creating…' : 'Create Personal/HNI case → REVIEWING'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: 10, border: '1px solid var(--line)', borderRadius: 10 }}>
      <span style={{ display: 'block', fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</span>
      <b style={{ display: 'block', marginTop: 4, fontSize: 11 }}>{value}</b>
    </div>
  )
}
