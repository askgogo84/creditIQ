'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { CiqTheme, ThemeToggle } from '@/components/ciq/ThemeProvider';
import { TabBar } from '@/components/ciq/TabBar';

const JOIN_CODE = 'CIQ-2850AF';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const sb = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  useEffect(() => {
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/login'); return; }
      setUser(user);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    await sb.auth.signOut();
    router.replace('/');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JOIN_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const meta = user?.user_metadata || {};
  const fullName: string = meta.full_name || meta.name || 'CreditIQ member';
  const email: string = user?.email || '';
  const avatarUrl: string | null = meta.avatar_url || meta.picture || null;
  const initials =
    (fullName.split(' ').map((p: string) => p[0]).filter(Boolean).slice(0, 2).join('') || 'CI').toUpperCase();

  if (loading) {
    return (
      <CiqTheme>
        <div style={{ maxWidth: 420, margin: '0 auto', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '0.08em', color: 'var(--ciq-ink-3)' }}>
            LOADING
          </span>
        </div>
      </CiqTheme>
    );
  }

  return (
    <CiqTheme>
      <div style={{ maxWidth: 420, margin: '0 auto', paddingBottom: 104 }}>

        {/* Brand row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 8px' }}>
          <div className="ciq-display" style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-.02em' }}>
            Credit<span style={{ color: 'var(--ciq-gold-2)' }}>IQ</span>
          </div>
        </div>

        {/* Page title */}
        <div style={{ padding: '10px 20px 0' }}>
          <h1 className="ciq-display" style={{ fontWeight: 600, fontSize: 28, letterSpacing: '-.02em' }}>You</h1>
        </div>

        {/* Account header */}
        <div style={{ padding: '18px 20px 0', display: 'flex', alignItems: 'center', gap: 14 }}>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={fullName}
              width={52}
              height={52}
              style={{ borderRadius: '50%', border: '1px solid var(--ciq-line-2)', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: 52, height: 52, borderRadius: '50%', background: 'var(--ciq-panel-2)',
              border: '1px solid var(--ciq-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--ciq-gold-2)',
            }}>
              {initials}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div className="ciq-display" style={{ fontWeight: 600, fontSize: 18, letterSpacing: '-.01em', color: 'var(--ciq-ink)' }}>
              {fullName}
            </div>
            {email ? (
              <div style={{ fontSize: 13, color: 'var(--ciq-ink-2)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {email}
              </div>
            ) : null}
          </div>
        </div>

        {/* Settings list */}
        <div style={{ padding: '22px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Appearance */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', background: 'var(--ciq-panel)', border: '1px solid var(--ciq-line-2)', borderRadius: 14,
          }}>
            <div>
              <div style={{ fontSize: 15, color: 'var(--ciq-ink)', fontWeight: 500 }}>Appearance</div>
              <div style={{ fontSize: 12, color: 'var(--ciq-ink-3)', marginTop: 2 }}>Switch between dark and light</div>
            </div>
            <ThemeToggle />
          </div>

          {/* Referral */}
          <div style={{
            padding: '16px', background: 'var(--ciq-panel)', border: '1px solid var(--ciq-line-2)', borderRadius: 14,
          }}>
            <div style={{ fontSize: 15, color: 'var(--ciq-ink)', fontWeight: 500 }}>Invite to CreditIQ</div>
            <div style={{ fontSize: 12, color: 'var(--ciq-ink-3)', marginTop: 2, marginBottom: 14 }}>
              Share your join code. Colleagues connect their workplace in one tap.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', padding: '0 14px', minHeight: 44,
                background: 'var(--ciq-panel-2)', border: '1px solid var(--ciq-gold)', borderRadius: 10,
                fontFamily: 'var(--font-mono)', fontSize: 15, letterSpacing: '0.10em', color: 'var(--ciq-gold-2)',
              }}>
                {JOIN_CODE}
              </div>
              <button onClick={handleCopy} style={{
                padding: '0 18px', minHeight: 44, background: 'transparent',
                border: '1px solid var(--ciq-line-2)', borderRadius: 10,
                color: copied ? 'var(--ciq-verified)' : 'var(--ciq-ink-2)',
                fontSize: 14, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.15s ease',
              }}>
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Sign out */}
          <button onClick={handleSignOut} style={{
            width: '100%', minHeight: 48, background: 'transparent',
            border: '1px solid var(--ciq-line-2)', borderRadius: 14,
            color: 'var(--ciq-ink-2)', fontSize: 15, fontWeight: 500, cursor: 'pointer', marginTop: 4,
          }}>
            Sign out
          </button>
        </div>
      </div>

      <TabBar />
    </CiqTheme>
  );
}
