// Drop-in for the CreditIQ profile page (app/(shell)/profile/page.tsx).
// Takes the same `createBrowserClient` instance the page already builds (named `sb`),
// reads the session token itself, mints a link code, shows it + a wa.me deep link.
//
// White/copper light system (the gold [data-ciq] system is retired for /profile). The
// title colour is set explicitly here now that there is no [data-ciq] heading-contract
// rule to theme it. Buttons stay transparent-fill + tokenised border so they read on the
// white surface.
'use client'

import { useState } from 'react'

const btnStyle: React.CSSProperties = {
  padding: '0 18px', minHeight: 44, background: 'transparent',
  border: '1px solid var(--line-strong)', borderRadius: 10,
  color: 'var(--ink)', fontSize: 14, fontWeight: 600,
  cursor: 'pointer', whiteSpace: 'nowrap',
}

export function LinkWhatsAppButton({ sb }: { sb: any }) {
  const [busy, setBusy] = useState(false)
  const [code, setCode] = useState<string | null>(null)
  const [waLink, setWaLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function mint() {
    setBusy(true); setError(null); setCode(null)
    try {
      const { data: { session } } = await sb.auth.getSession()
      const token = session?.access_token
      if (!token) { setError('Please sign in again.'); return }
      const res = await fetch('/api/wa/link-code', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) { setError(json?.error || 'Could not create a code.'); return }
      setCode(json.code)
      setWaLink(json.wa_link || null)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ padding: 18, background: 'var(--surface)', border: '1px solid var(--line-strong)', borderRadius: 16, boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: 15, fontWeight: 500, margin: 0, color: 'var(--ink)' }}>Link WhatsApp (AskGogo)</h3>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Ask about your cards on WhatsApp.</div>
        </div>
        <button onClick={mint} disabled={busy} style={{ ...btnStyle, flexShrink: 0, opacity: busy ? 0.4 : 1 }}>
          {busy ? 'Generating…' : code ? 'New code' : 'Link WhatsApp'}
        </button>
      </div>

      {code && (
        <div style={{
          marginTop: 16, padding: '16px', textAlign: 'center',
          background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 10,
        }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
            Your 6-digit code (valid 10 min)
          </div>
          <div style={{ margin: '8px 0', fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 700, letterSpacing: '0.3em', color: 'var(--copper)' }}>
            {code}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
            On WhatsApp, send AskGogo: <span style={{ fontWeight: 600, color: 'var(--ink)' }}>link creditiq {code}</span>
          </div>
          {waLink && (
            <a href={waLink} target="_blank" rel="noopener noreferrer"
               style={{ ...btnStyle, display: 'inline-flex', alignItems: 'center', marginTop: 14, textDecoration: 'none' }}>
              Open WhatsApp
            </a>
          )}
        </div>
      )}

      {error && <div style={{ marginTop: 12, fontSize: 13, color: 'var(--red, #A13020)' }} role="alert">{error}</div>}
    </div>
  )
}
