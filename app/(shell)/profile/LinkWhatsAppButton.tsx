// Drop-in for the CreditIQ profile page (app/(shell)/profile/page.tsx).
// Takes the same `createBrowserClient` instance the page already builds (named `sb`),
// reads the session token itself, mints a link code, shows it + a wa.me deep link.
'use client'

import { useState } from 'react'

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
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Link WhatsApp (AskGogo)</h3>
          <p className="text-sm text-slate-500">Ask about your cards on WhatsApp.</p>
        </div>
        <button
          onClick={mint}
          disabled={busy}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {busy ? 'Generating…' : code ? 'New code' : 'Link WhatsApp'}
        </button>
      </div>

      {code && (
        <div className="mt-4 rounded-lg bg-slate-50 p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-slate-500">Your 6-digit code (valid 10 min)</p>
          <p className="my-2 text-3xl font-bold tracking-[0.3em] text-slate-900">{code}</p>
          <p className="text-sm text-slate-600">
            On WhatsApp, send AskGogo: <span className="font-medium">link creditiq {code}</span>
          </p>
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
            >
              Open WhatsApp
            </a>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  )
}
