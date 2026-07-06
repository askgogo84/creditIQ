'use client';
import { useEffect, useState, type CSSProperties } from 'react';
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

type Card = { id: string; name: string; issuer: string; last4: string; network: string | null; color: string | null; status: 'enrolled' | 'pending' };

type State =
  | { kind: 'loading' }
  | { kind: 'ready' }
  | { kind: 'not_linked' }
  | { kind: 'unauth' }
  | { kind: 'error'; msg: string };

export default function MyCompanyCards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [orgName, setOrgName] = useState('your company');
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      if (!token) { setState({ kind: 'unauth' }); return; }
      try {
        const res = await fetch('/api/employee/company-cards', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok) { setState({ kind: 'error', msg: 'Could not load your company cards.' }); return; }
        if (!data.linked) { setState({ kind: 'not_linked' }); return; }
        setOrgName(data.org_name ?? 'your company');
        setCards(data.cards ?? []);
        setState({ kind: 'ready' });
      } catch { setState({ kind: 'error', msg: 'Network error. Check your connection.' }); }
    })();
  }, []);

  const wrap: CSSProperties = {
    minHeight: '100dvh', background: C.base, color: C.text, display: 'flex',
    justifyContent: 'center', padding: 20, fontFamily: 'Inter, system-ui, sans-serif',
  };

  const Shell = (inner: React.ReactNode) => (
    <div style={{ ...wrap, alignItems: 'flex-start' }}>
      <div style={{ width: '100%', maxWidth: 380, paddingTop: 8 }}>{inner}</div>
    </div>
  );

  if (state.kind === 'loading') return Shell(
    <p style={{ color: C.mut, fontSize: 14, paddingTop: 40, textAlign: 'center' }}>Loading your company cards...</p>
  );

  if (state.kind === 'unauth') return Shell(
    <div style={{ paddingTop: 24 }}>
      <p style={{ color: C.mut, fontSize: 15, lineHeight: 1.5 }}>Please sign in to see your company cards.</p>
      <a href="/login" style={{ color: C.gold, fontSize: 14, textDecoration: 'underline' }}>Sign in</a>
    </div>
  );

  if (state.kind === 'error') return Shell(
    <p style={{ color: C.red, fontSize: 14, paddingTop: 40, textAlign: 'center' }}>{state.msg}</p>
  );

  if (state.kind === 'not_linked') return Shell(
    <div style={{ paddingTop: 12 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 8px' }}>No company linked</h1>
      <p style={{ color: C.mut, fontSize: 15, lineHeight: 1.5, margin: '0 0 18px' }}>
        Join your company with a code to see and add corporate cards.
      </p>
      <a href="/join-company" style={{ display: 'inline-block', background: C.gold, color: '#1A1305',
        fontWeight: 600, padding: '12px 20px', borderRadius: 12, textDecoration: 'none' }}>Join with a code</a>
    </div>
  );

  return Shell(
    <div>
      <div style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 18, display: 'grid',
        placeItems: 'center', background: C.surface2, border: '1px solid rgba(255,255,255,.08)', fontSize: 20 }}>🏢</div>
      <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 4px', letterSpacing: '-.01em' }}>Your company cards</h1>
      <p style={{ color: C.mut, fontSize: 14, lineHeight: 1.5, margin: '0 0 20px' }}>{orgName}</p>

      {cards.length === 0 ? (
        <div style={{ borderRadius: 14, border: '1px dashed rgba(255,255,255,.12)', padding: '28px 18px', textAlign: 'center' }}>
          <p style={{ color: C.mut, fontSize: 14, margin: '0 0 16px' }}>No corporate cards yet.</p>
          <a href="/add-corporate-card" style={{ display: 'inline-block', background: C.gold, color: '#1A1305',
            fontWeight: 600, padding: '11px 18px', borderRadius: 12, textDecoration: 'none', fontSize: 14 }}>Add a corporate card</a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          {cards.map((c) => {
            const active = c.status === 'enrolled';
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12,
                background: C.surface, padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)' }}>
                <span style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                  background: c.color ?? C.surface2, border: '1px solid rgba(255,255,255,.12)' }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                  <div style={{ fontSize: 12.5, color: C.mut }}>{c.issuer} &bull; &bull;&bull;&bull;&bull; {c.last4}</div>
                </div>
                <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 600, padding: '4px 9px', borderRadius: 999,
                  background: active ? 'rgba(52,211,153,.12)' : 'rgba(212,168,75,.12)',
                  color: active ? C.green : C.gold }}>
                  {active ? 'Active' : 'Awaiting approval'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <a href="/add-corporate-card" style={{ display: 'block', textAlign: 'center', color: C.mut,
        fontSize: 13, textDecoration: 'underline', marginTop: 6 }}>Add another corporate card</a>
    </div>
  );
}