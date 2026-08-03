// Drop-in for the CreditIQ profile page (app/(shell)/profile/page.tsx).
// Takes the same `createBrowserClient` instance the page already builds (named `sb`),
// reads the session token itself, mints a link code, shows it + a wa.me deep link.
//
// Themed to the gold [data-ciq] tokens (var(--ciq-*)), matching the "Invite to
// CreditIQ" card on the same page. It was previously hardcoded light-mode Tailwind
// (bg-white / text-slate-*), which — on the gold profile surface in dark mode —
// stranded a correctly-themed title on a permanently-white card (invisible). The
// heading contract rule themes the <h3> text, so the title colour is left to it.
// See docs/HARDCODED-PALETTE-AUDIT.md.
'use client'

import { useState } from 'react'

// Buttons mirror the reference "Invite to CreditIQ" Copy button: transparent fill,
// tokenised border + ink text, so they read in both the dark and light gold themes
// (a filled var(--ciq-gold) button fails AA on the light ivory ground).
const btnStyle: React.CSSProperties = {
  padding: '0 18px', minHeight: 44, background: 'transparent',
  border: '1px solid var(--ciq-gold-line)', borderRadius: 10,
  color: 'var(--ciq-ink)', fontSize: 14, fontWeight: 600,
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
    <div style={{ padding: '16px', background: 'var(--ciq-panel)', border: '1px solid var(--ciq-line-2)', borderRadius: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          {/* Colour comes from the [data-ciq] heading contract rule — do not set it here. */}
          <h3 style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>Link WhatsApp (AskGogo)</h3>
          <div style={{ fontSize: 12, color: 'var(--ciq-ink-2)', marginTop: 2 }}>Ask about your cards on WhatsApp.</div>
        </div>
        <button onClick={mint} disabled={busy} style={{ ...btnStyle, flexShrink: 0, opacity: busy ? 0.4 : 1 }}>
          {busy ? 'Generating…' : code ? 'New code' : 'Link WhatsApp'}
        </button>
      </div>

      {code && (
        <div style={{
          marginTop: 16, padding: '16px', textAlign: 'center',
          background: 'var(--ciq-panel-2)', border: '1px solid var(--ciq-line-2)', borderRadius: 10,
        }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ciq-ink-3)' }}>
            Your 6-digit code (valid 10 min)
          </div>
          <div style={{ margin: '8px 0', fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 700, letterSpacing: '0.3em', color: 'var(--ciq-gold-2)' }}>
            {code}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ciq-ink-2)' }}>
            On WhatsApp, send AskGogo: <span style={{ fontWeight: 600, color: 'var(--ciq-ink)' }}>link creditiq {code}</span>
          </div>
          {waLink && (
            <a href={waLink} target="_blank" rel="noopener noreferrer"
               style={{ ...btnStyle, display: 'inline-flex', alignItems: 'center', marginTop: 14, textDecoration: 'none' }}>
              Open WhatsApp
            </a>
          )}
        </div>
      )}

      {/* Error red: site --red token (defined in both themes); not a gold token — the
          gold system has no error colour, and --ciq-verified green is reserved. */}
      {error && <div style={{ marginTop: 12, fontSize: 13, color: 'var(--red, #E8806E)' }} role="alert">{error}</div>}
    </div>
  )
}
