'use client';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const C = {
  base: '#0A0D12', surface: '#12161D', surface2: '#1A1F28',
  line: 'rgba(255,255,255,.08)', gold: '#D4A84B', red: '#E84A38',
  green: '#34D399', text: '#F4F1EA', mut: '#8A92A0',
};

function getBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
}

async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await getBrowserSupabase().auth.getSession();
    return data.session?.access_token ?? null;
  } catch { return null; }
}

type CardItem = { slug: string; name: string; bank: string; network: string; color: string | null; annual_fee: number | null };

const ERRORS: Record<string, string> = {
  unauthorized: 'Please sign in first, then add your card.',
  not_linked: 'Join your company first, then add a corporate card.',
  invalid_card: 'Pick a card from the list.',
  invalid_last4: 'Enter the last 4 digits printed on the card.',
  already_exists: 'That card and last-4 is already submitted.',
  submit_failed: 'Something went wrong. Try again in a moment.',
  catalog_failed: 'Could not load the card list. Refresh and try again.',
};

type State =
  | { kind: 'loading' }
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'done' }
  | { kind: 'error'; msg: string };

export default function AddCorporateCard() {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<CardItem | null>(null);
  const [last4, setLast4] = useState('');
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      if (!token) { setState({ kind: 'error', msg: ERRORS.unauthorized }); return; }
      try {
        const res = await fetch('/api/employee/corporate-card', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) { setState({ kind: 'error', msg: ERRORS[data.error as string] ?? 'Could not load cards.' }); return; }
        setCards(data.cards ?? []);
        setState({ kind: 'idle' });
      } catch { setState({ kind: 'error', msg: 'Network error. Check your connection.' }); }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((c) => c.name.toLowerCase().includes(q) || c.bank.toLowerCase().includes(q));
  }, [cards, query]);

  async function submit() {
    if (!selected) { setState({ kind: 'error', msg: ERRORS.invalid_card }); return; }
    if (!/^\d{4}$/.test(last4)) { setState({ kind: 'error', msg: ERRORS.invalid_last4 }); return; }
    setState({ kind: 'submitting' });
    const token = await getAccessToken();
    if (!token) { setState({ kind: 'error', msg: ERRORS.unauthorized }); return; }
    try {
      const res = await fetch('/api/employee/corporate-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ card_slug: selected.slug, last4 }),
      });
      const data = await res.json();
      if (!res.ok) { setState({ kind: 'error', msg: ERRORS[data.error as string] ?? 'Could not submit. Try again.' }); return; }
      setState({ kind: 'done' });
    } catch { setState({ kind: 'error', msg: 'Network error. Check your connection and try again.' }); }
  }

  const wrap: CSSProperties = {
    minHeight: '100dvh', background: C.base, color: C.text, display: 'flex',
    justifyContent: 'center', padding: 20, fontFamily: 'Inter, system-ui, sans-serif',
  };

  if (state.kind === 'done') return (
    <div style={{ ...wrap, alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', margin: '0 auto 18px',
          display: 'grid', placeItems: 'center', background: 'rgba(52,211,153,.12)', color: C.green, fontSize: 26 }}>✓</div>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 8px' }}>Submitted.</h1>
        <p style={{ color: C.mut, fontSize: 15, lineHeight: 1.5, margin: '0 0 24px' }}>
          Your admin will review and approve it. It shows under your company cards once enrolled. Your personal cards stay private.
        </p>
        <a href="/dashboard" style={{ display: 'inline-block', background: C.gold, color: '#1A1305',
          fontWeight: 600, padding: '13px 22px', borderRadius: 12, textDecoration: 'none' }}>Back to dashboard</a>
      </div>
    </div>
  );

  const busy = state.kind === 'submitting';
  const loading = state.kind === 'loading';

  return (
    <div style={{ ...wrap, alignItems: 'flex-start' }}>
      <div style={{ width: '100%', maxWidth: 380, paddingTop: 8 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 20, display: 'grid',
          placeItems: 'center', background: C.surface2, border: '1px solid rgba(255,255,255,.08)', fontSize: 20 }}>💳</div>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 8px', letterSpacing: '-.01em' }}>Add a corporate card</h1>
        <p style={{ color: C.mut, fontSize: 15, lineHeight: 1.5, margin: '0 0 22px' }}>
          Pick the card your company gave you and enter its last 4 digits. It goes to your admin for approval — your personal cards stay private.
        </p>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={loading ? 'Loading cards...' : 'Search by card or bank'}
          disabled={loading}
          spellCheck={false}
          style={{ width: '100%', background: C.surface, color: C.text, fontSize: 15,
            padding: '13px 14px', borderRadius: 12, outline: 'none',
            border: '1px solid rgba(255,255,255,.08)', boxSizing: 'border-box', marginBottom: 10 }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto', marginBottom: 16 }}>
          {filtered.map((c) => {
            const on = selected?.slug === c.slug;
            return (
              <button key={c.slug} onClick={() => { setSelected(c); if (state.kind === 'error') setState({ kind: 'idle' }); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', width: '100%',
                  background: on ? C.surface2 : C.surface, color: C.text, padding: '12px 14px', borderRadius: 12,
                  border: on ? `1px solid ${C.gold}` : '1px solid rgba(255,255,255,.08)', cursor: 'pointer' }}>
                <span style={{ width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                  background: c.color ?? C.surface2, border: '1px solid rgba(255,255,255,.12)' }} />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600, whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                  <span style={{ display: 'block', fontSize: 12.5, color: C.mut }}>{c.bank} · {c.network}</span>
                </span>
                {on && <span style={{ marginLeft: 'auto', color: C.gold, fontSize: 16 }}>✓</span>}
              </button>
            );
          })}
          {!loading && filtered.length === 0 && (
            <p style={{ color: C.mut, fontSize: 13.5, textAlign: 'center', padding: '12px 0' }}>No cards match that search.</p>
          )}
        </div>

        <label style={{ display: 'block', fontSize: 12, color: C.mut, letterSpacing: '.08em',
          textTransform: 'uppercase', marginBottom: 8 }}>Last 4 digits</label>
        <input
          value={last4}
          onChange={(e) => { setLast4(e.target.value.replace(/\D/g, '').slice(0, 4)); if (state.kind === 'error') setState({ kind: 'idle' }); }}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder="1234"
          inputMode="numeric"
          style={{ width: '100%', background: C.surface, color: C.text, fontSize: 18, letterSpacing: '.2em',
            padding: '15px 16px', borderRadius: 12, outline: 'none',
            border: state.kind === 'error' ? '1px solid #E84A38' : '1px solid rgba(255,255,255,.08)',
            fontFamily: 'ui-monospace, monospace', boxSizing: 'border-box' }}
        />

        {state.kind === 'error' && (
          <p style={{ color: C.red, fontSize: 13.5, margin: '10px 2px 0', lineHeight: 1.45 }}>{state.msg}</p>
        )}

        <button onClick={submit} disabled={busy || loading || !selected}
          style={{ width: '100%', marginTop: 18, background: (busy || !selected) ? C.surface2 : C.gold,
            color: (busy || !selected) ? C.mut : '#1A1305', fontWeight: 600, fontSize: 16, padding: '15px',
            borderRadius: 12, border: 'none', cursor: (busy || !selected) ? 'default' : 'pointer' }}>
          {busy ? 'Submitting...' : 'Submit for approval'}
        </button>
        <p style={{ color: C.mut, fontSize: 12.5, textAlign: 'center', margin: '16px 2px 0', lineHeight: 1.5 }}>
          Not linked yet? <a href="/join-company" style={{ color: C.mut, textDecoration: 'underline' }}>Join with a code</a> first.
        </p>
      </div>
    </div>
  );
}