'use client';

// app/delete-account/page.tsx
// Public account-deletion page. Linked from the Play Store Data Safety form and
// from the mobile app (You → Delete account). Signed-in users delete their own
// account here; signed-out visitors see how the process works and how to sign in.
//
// The actual deletion is done by POST /api/delete-account, authenticated with the
// user's bearer token (the server derives the user id from the token).

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

type Phase = 'loading' | 'signedOut' | 'ready' | 'deleting' | 'done' | 'error';

const WHAT_GETS_DELETED = [
  'Your login (email / phone) and profile',
  'Cards you added — manual entries and statement imports',
  'Linked accounts, alerts and preferences',
  'Subscription and entitlement records',
];

export default function DeleteAccountPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('loading');
  const [email, setEmail] = useState<string>('');
  const [confirm, setConfirm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const sb = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  );

  useEffect(() => {
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setPhase('signedOut');
        return;
      }
      setEmail(user.email || user.phone || 'your account');
      setPhase('ready');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete() {
    setPhase('deleting');
    setErrorMsg('');
    try {
      const { data } = await sb.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setPhase('signedOut');
        return;
      }
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorMsg(body?.error || 'Something went wrong. Please try again or email support@creditiq.app.');
        setPhase('error');
        return;
      }
      await sb.auth.signOut().catch(() => {});
      setPhase('done');
    } catch {
      setErrorMsg('Could not reach the server. Please check your connection and try again.');
      setPhase('error');
    }
  }

  const canDelete = confirm.trim().toUpperCase() === 'DELETE' && phase === 'ready';

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>CreditIQ</div>
        <h1 style={styles.h1}>Delete your account</h1>

        {phase === 'loading' ? (
          <p style={styles.muted}>Loading…</p>
        ) : phase === 'done' ? (
          <>
            <div style={styles.successDot}>✓</div>
            <p style={styles.body}>
              Your CreditIQ account and personal data have been permanently deleted. We&apos;re sorry to
              see you go.
            </p>
            <a href="/" style={styles.linkBtn}>
              Return to CreditIQ
            </a>
          </>
        ) : (
          <>
            <p style={styles.body}>
              Deleting your account is <strong>permanent and cannot be undone</strong>. The following is
              removed from CreditIQ:
            </p>
            <ul style={styles.list}>
              {WHAT_GETS_DELETED.map((t) => (
                <li key={t} style={styles.li}>
                  {t}
                </li>
              ))}
            </ul>

            {phase === 'signedOut' ? (
              <>
                <p style={styles.note}>
                  Please sign in with the account you want to delete, then return to this page.
                </p>
                <button style={styles.primary} onClick={() => router.push('/login')}>
                  Sign in to continue
                </button>
                <p style={styles.support}>
                  Prefer we do it for you? Email{' '}
                  <a href="mailto:support@creditiq.app" style={styles.inlineLink}>
                    support@creditiq.app
                  </a>{' '}
                  from your registered address.
                </p>
              </>
            ) : (
              <>
                <p style={styles.note}>
                  Signed in as <strong>{email}</strong>. Type <strong>DELETE</strong> to confirm.
                </p>
                <input
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="DELETE"
                  autoCapitalize="characters"
                  style={styles.input}
                  disabled={phase === 'deleting'}
                />
                <button
                  style={{ ...styles.danger, opacity: canDelete ? 1 : 0.45 }}
                  onClick={handleDelete}
                  disabled={!canDelete || (phase as Phase) === 'deleting'}
                >
                  {(phase as Phase) === 'deleting' ? 'Deleting…' : 'Permanently delete my account'}
                </button>
                {phase === 'error' ? <p style={styles.error}>{errorMsg}</p> : null}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0A0A08',
    color: '#F5F1E8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    background: '#15130E',
    border: '1px solid #2A2620',
    borderRadius: 16,
    padding: 28,
  },
  brand: {
    color: '#C9A24B',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  h1: { fontSize: 24, fontWeight: 800, margin: '10px 0 16px' },
  body: { fontSize: 15, lineHeight: 1.6, color: '#C7C2B4' },
  muted: { color: '#8B8578', fontSize: 14 },
  list: { margin: '14px 0', paddingLeft: 18 },
  li: { fontSize: 14, lineHeight: 1.9, color: '#C7C2B4' },
  note: { fontSize: 14, color: '#F5F1E8', marginTop: 18 },
  input: {
    width: '100%',
    marginTop: 12,
    padding: '13px 14px',
    borderRadius: 10,
    background: '#100F0B',
    border: '1px solid #2A2620',
    color: '#F5F1E8',
    fontSize: 15,
    letterSpacing: 2,
    boxSizing: 'border-box',
  },
  primary: {
    width: '100%',
    marginTop: 16,
    padding: '14px 16px',
    borderRadius: 10,
    background: '#C9A24B',
    color: '#141105',
    border: 'none',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  danger: {
    width: '100%',
    marginTop: 16,
    padding: '14px 16px',
    borderRadius: 10,
    background: '#E5674F',
    color: '#1a0b08',
    border: 'none',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  linkBtn: {
    display: 'inline-block',
    marginTop: 18,
    padding: '12px 18px',
    borderRadius: 10,
    background: '#C9A24B',
    color: '#141105',
    fontWeight: 700,
    textDecoration: 'none',
  },
  inlineLink: { color: '#C9A24B' },
  support: { fontSize: 13, color: '#8B8578', marginTop: 18, lineHeight: 1.6 },
  error: { color: '#E5674F', fontSize: 14, marginTop: 12 },
  successDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    background: '#4FBF87',
    color: '#0A0A08',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    fontWeight: 800,
    margin: '4px 0 16px',
  },
};
