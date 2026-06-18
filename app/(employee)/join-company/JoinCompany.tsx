'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const C = {
  base: '#0A0D12', surface: '#12161D', surface2: '#1A1F28',
  line: 'rgba(255,255,255,.08)', gold: '#D4A84B', red: '#E84A38',
  green: '#34D399', text: '#F4F1EA', mut: '#8A92A0',
};

function getBrowserSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await getBrowserSupabase().auth.getSession();
    return data.session?.access_token ?? null;
  } catch { return null; }
}

const ERRORS: Record<string, string> = {
  missing_code: 'Enter the code your company gave you.',
  invalid_code: "That code didn't match any company. Double-check it with your admin.",
  code_expired: 'That code has expired. Ask your admin for a fresh one.',
  email_domain_mismatch: 'This code is restricted to your company email.',
  unauthorized: 'Please sign in first, then enter your code.',
  join_failed: 'Something went wrong joining. Try again in a moment.',
};

type State =
  | { kind: 'idle' }
  | { kind: 'joining' }
  | { kind: 'joined'; org: string }
  | { kind: 'error'; msg: string };

export default function JoinCompany() {
  const [code, setCode] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function join() {
    if (!code.trim()) { setState({ kind: 'error', msg: ERRORS.missing_code }); return; }
    setState({ kind: 'joining' });
    const token = await getAccessToken();
    if (!token) { setState({ kind: 'error', msg: ERRORS.unauthorized }); return; }
    try {
      const res = await fetch('/api/employee/join-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setState({ kind: 'error', msg: ERRORS[data.error as string] ?? 'Could not join. Try again.' }); return; }
      setState({ kind: 'joined', org: data.org_name ?? 'your company' });
    } catch { setState({ kind: 'error', msg: 'Network error. Check your connection and try again.' }); }
  }

  const joining = state.kind === 'joining';

  if (state.kind === 'joined') return (
    <div style={{ minHeight: '100dvh', background: C.base, color: C.text, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', margin: '0 auto 18px',
          display: 'grid', placeItems: 'center', background: 'rgba(52,211,153,.12)', color: C.green, fontSize: 26 }}>✓</div>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 8px' }}>You are in.</h1>
        <p style={{ color: C.mut, fontSize: 15, lineHeight: 1.5, margin: '0 0 24px' }}>
          You have joined <strong style={{ color: C.text }}>{state.org}</strong>. Your personal cards stay private — your company cannot see them.
        </p>
        <a href="/home" style={{ display: 'inline-block', background: C.gold, color: '#1A1305',
          fontWeight: 600, padding: '13px 22px', borderRadius: 12, textDecoration: 'none' }}>Go to my cards</a>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100dvh', background: C.base, color: C.text, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 20, display: 'grid',
          placeItems: 'center', background: C.surface2, border: '1px solid rgba(255,255,255,.08)', fontSize: 20 }}>🏢</div>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 8px', letterSpacing: '-.01em' }}>Join your company</h1>
        <p style={{ color: C.mut, fontSize: 15, lineHeight: 1.5, margin: '0 0 22px' }}>
          Enter the code your company gave you. Your personal cards stay yours — your company never sees them.
        </p>
        <label style={{ display: 'block', fontSize: 12, color: C.mut, letterSpacing: '.08em',
          textTransform: 'uppercase', marginBottom: 8 }}>Corporate code</label>
        <input
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); if (state.kind === 'error') setState({ kind: 'idle' }); }}
          onKeyDown={(e) => { if (e.key === 'Enter') join(); }}
          placeholder="CIQ-XXXXXX"
          autoCapitalize="characters"
          spellCheck={false}
          style={{ width: '100%', background: C.surface, color: C.text, fontSize: 18,
            letterSpacing: '.06em', padding: '15px 16px', borderRadius: 12, outline: 'none',
            border: state.kind === 'error' ? '1px solid #E84A38' : '1px solid rgba(255,255,255,.08)',
            fontFamily: 'ui-monospace, monospace', boxSizing: 'border-box' }}
        />
        {state.kind === 'error' && (
          <p style={{ color: C.red, fontSize: 13.5, margin: '10px 2px 0', lineHeight: 1.45 }}>{state.msg}</p>
        )}
        <button onClick={join} disabled={joining}
          style={{ width: '100%', marginTop: 18, background: joining ? C.surface2 : C.gold,
            color: joining ? C.mut : '#1A1305', fontWeight: 600, fontSize: 16, padding: '15px',
            borderRadius: 12, border: 'none', cursor: joining ? 'default' : 'pointer' }}>
          {joining ? 'Joining...' : 'Join company'}
        </button>
        <p style={{ color: C.mut, fontSize: 12.5, textAlign: 'center', margin: '16px 2px 0', lineHeight: 1.5 }}>
          No code? Ask your company admin.
        </p>
      </div>
    </div>
  );
}