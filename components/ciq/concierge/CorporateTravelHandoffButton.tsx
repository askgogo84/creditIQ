'use client'

import { useState } from 'react'
import { authedFetch } from '@/lib/authed-fetch'
import type { ConciergeRequest } from './ConciergeRequestButton'

export function CorporateTravelHandoffButton({
  request,
  label = 'Send to Corporate Travel Desk',
}: {
  request: ConciergeRequest
  label?: string
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handoff() {
    setBusy(true)
    setError('')
    try {
      const res = await authedFetch('/api/corporate-travel/handoffs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.handoff_url) throw new Error(data.error || 'Could not prepare corporate travel handoff.')
      window.open(data.handoff_url, '_blank', 'noopener,noreferrer')
    } catch (e: any) {
      setError(e?.message || 'Could not prepare corporate travel handoff.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 5 }}>
      <button type="button" onClick={() => void handoff()} disabled={busy}>
        {busy ? 'Preparing secure handoff…' : label}
      </button>
      {error && <small style={{ color: 'var(--red, #9a4138)', fontSize: 10 }}>{error}</small>}
      <small style={{ color: 'var(--ink-3)', fontSize: 9.5, lineHeight: 1.45 }}>
        Opens CreditIQ Business. Your company login and organisation membership are checked before the request is accepted. The link expires after 30 minutes.
      </small>
    </div>
  )
}
