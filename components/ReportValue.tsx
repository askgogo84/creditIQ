'use client';
import { useState } from 'react';

// Match this page's existing positive / negative value colours — do NOT
// introduce a second green/red (e.g. --emerald / --crimson-400) to the screen.
const POSITIVE = '#2d7a56';
const NEGATIVE = '#B84230';

type Status = 'idle' | 'open' | 'sending' | 'done' | 'error';

// Same-sitting identity only: sessionStorage, not localStorage — no persistent
// pseudonymous ID (keeps the DPDP footprint minimal). Runs client-side only
// (called from the submit handler), so no SSR guard is needed beyond try/catch.
function getSessionId(): string {
  try {
    const k = 'ciq_sid';
    let v = sessionStorage.getItem(k);
    if (!v) {
      v =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(k, v);
    }
    return v;
  } catch {
    return '';
  }
}

export function ReportValue({
  cardSlug,
  surface,
  displayedValueInr,
  monthlyTotalInr,
}: {
  cardSlug: string;
  surface: string;
  displayedValueInr?: number;
  monthlyTotalInr?: number;
}) {
  const [status, setStatus] = useState<Status>('idle');
  const [reason, setReason] = useState('');

  const sending = status === 'sending';

  async function submit() {
    setStatus('sending');
    try {
      const res = await fetch('/api/report-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardSlug,
          surface,
          reason: reason.trim() || undefined,
          sessionId: getSessionId(),
          displayedValueInr,
          monthlyTotalInr,
        }),
      });
      const json = await res.json().catch(() => ({}));
      setStatus(res.ok && json.ok ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono,monospace)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.04em',
  };

  // Note: outline is intentionally NOT set to none — native focus ring keeps
  // keyboard focus visible on every control below.
  const container: React.CSSProperties = { marginTop: 14 };

  if (status === 'done') {
    return (
      <div style={{ ...container, ...labelStyle, color: POSITIVE, minHeight: 44, display: 'flex', alignItems: 'center' }}>
        ✓ Thanks — we&apos;ll take a look.
      </div>
    );
  }

  if (status === 'idle') {
    return (
      <div style={container}>
        <button
          type="button"
          onClick={() => setStatus('open')}
          style={{
            ...labelStyle,
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: 44,
            padding: '0 4px',
            background: 'none',
            border: 'none',
            color: 'var(--ink-3,#5A6A8A)',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
            cursor: 'pointer',
          }}
        >
          This looks wrong
        </button>
      </div>
    );
  }

  // open | sending | error  — the form stays mounted so a typed reason survives a retry.
  const remaining = 280 - reason.length;

  return (
    <div style={container}>
      <div style={{ ...labelStyle, color: 'var(--ink-3,#5A6A8A)', marginBottom: 8 }}>
        What looks wrong? <span style={{ color: 'var(--ink-4,#8A95AE)' }}>(optional)</span>
      </div>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value.slice(0, 280))}
        maxLength={280}
        disabled={sending}
        rows={3}
        placeholder="e.g. the value shown looks too high for this card"
        style={{
          width: '100%',
          fontSize: 16, // 16px avoids iOS zoom-on-focus
          fontFamily: 'inherit',
          color: 'var(--ink,#142950)',
          background: 'var(--surface,#fff)',
          border: '1px solid var(--line,rgba(20,41,80,0.08))',
          borderRadius: 10,
          padding: 12,
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />
      <div style={{ ...labelStyle, color: 'var(--ink-4,#8A95AE)', textAlign: 'right', marginTop: 4 }}>
        {remaining}
      </div>

      {status === 'error' && (
        <div style={{ ...labelStyle, color: NEGATIVE, margin: '4px 0 8px' }}>
          Couldn&apos;t send. Please try again.
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button
          type="button"
          onClick={submit}
          disabled={sending}
          style={{
            ...labelStyle,
            minHeight: 44,
            padding: '0 18px',
            borderRadius: 999,
            border: 'none',
            background: 'var(--ink,#142950)',
            color: 'var(--paper,#FAF5EB)',
            cursor: sending ? 'default' : 'pointer',
            opacity: sending ? 0.6 : 1,
          }}
        >
          {sending ? 'Sending…' : status === 'error' ? 'Retry' : 'Send'}
        </button>
        <button
          type="button"
          onClick={() => {
            setReason('');
            setStatus('idle');
          }}
          disabled={sending}
          style={{
            ...labelStyle,
            minHeight: 44,
            padding: '0 14px',
            borderRadius: 999,
            border: '1px solid var(--line,rgba(20,41,80,0.08))',
            background: 'none',
            color: 'var(--ink-3,#5A6A8A)',
            cursor: sending ? 'default' : 'pointer',
            opacity: sending ? 0.6 : 1,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
