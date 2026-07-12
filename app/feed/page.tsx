'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { authedFetch } from '@/lib/authed-fetch';
import { CiqTheme, ThemeToggle } from '@/components/ciq/ThemeProvider';
import { TabBar } from '@/components/ciq/TabBar';

type FeedItem = {
  id: string;
  source: string | null;
  source_url: string | null;
  creator_handle: string | null;
  creator_name: string | null;
  title: string;
  summary: string;
  insight_type: string;
  card_mentions: string[];
  date: string | null;
};

// Human labels for the stored insight_type values. Community intel — presented
// neutral/gold, NEVER verified-green (green is reserved for statement-verified data).
const CATEGORY_LABEL: Record<string, string> = {
  transfer_hack: 'Transfer hack',
  devaluation: 'Devaluation',
  card_comparison: 'Comparison',
  sweet_spot: 'Sweet spot',
  strategy: 'Strategy',
  reward_tip: 'Reward tip',
  card_review: 'Card review',
  lounge: 'Lounge',
  forex: 'Forex',
  general: 'Tip',
};
const SOURCE_LABEL: Record<string, string> = {
  instagram: 'Instagram', reddit: 'Reddit', youtube: 'YouTube',
};

function labelFor(type: string) {
  return CATEGORY_LABEL[type] || type.replace(/_/g, ' ');
}
function fmtDate(d: string | null) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function FeedPage() {
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
    sb.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setChecking(false);
      if (user) loadFeed();
    });
  }, []);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const res = await authedFetch('/api/feed');
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {}
    setLoading(false);
  };

  const masthead = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 8px' }}>
      <div className="ciq-display" style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-.02em' }}>
        Credit<span style={{ color: 'var(--ciq-gold-2)' }}>IQ</span>
      </div>
      <ThemeToggle />
    </div>
  );

  // Logged-out -> login prompt (feed is free but requires an account).
  if (!checking && !user) {
    return (
      <CiqTheme>
        <div style={{ maxWidth: 420, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {masthead}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 28px' }}>
            <div className="ciq-mono" style={{ fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ciq-gold-2)' }}>The Feed</div>
            <h1 className="ciq-serif" style={{ fontSize: 32, letterSpacing: '-.02em', marginTop: 12 }}>Community card intelligence.</h1>
            <p style={{ fontSize: 13.5, color: 'var(--ciq-ink-3)', marginTop: 12, lineHeight: 1.5 }}>
              Reward tips, sweet spots, devaluations and strategies pulled from creators and community discussion. Sign in to read the feed — it&apos;s free.
            </p>
            <Link href="/login?next=/feed" style={{
              marginTop: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '13px 24px',
              borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none',
              background: 'linear-gradient(135deg,var(--ciq-gold-2),var(--ciq-gold))', color: '#1a1710',
            }}>Sign in to read the Feed</Link>
          </div>
        </div>
      </CiqTheme>
    );
  }

  return (
    <CiqTheme>
      <div style={{ maxWidth: 420, margin: '0 auto', paddingBottom: 104 }}>
        {masthead}

        <div style={{ padding: '10px 20px 0' }}>
          <h1 className="ciq-display" style={{ fontWeight: 600, fontSize: 28, letterSpacing: '-.02em' }}>Feed</h1>
          {/* Honesty note: this is community intel, not statement-verified data. */}
          <p style={{ fontSize: 12.5, color: 'var(--ciq-ink-3)', marginTop: 6, lineHeight: 1.5 }}>
            Community intelligence from creators &amp; discussion. Directional — not verified from your statements.
          </p>
        </div>

        <div className="ciq-rise" style={{ padding: '18px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <div className="ciq-mono" style={{ color: 'var(--ciq-ink-3)', fontSize: 12, padding: 20, textAlign: 'center' }}>loading…</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', borderRadius: 16, border: '1px solid var(--ciq-line)', background: 'var(--ciq-panel)' }}>
              <p style={{ color: 'var(--ciq-ink-3)', fontSize: 13 }}>No community intel yet. Check back soon.</p>
            </div>
          ) : items.map(item => {
            const handle = item.creator_handle ? `@${item.creator_handle}` : (item.source ? (SOURCE_LABEL[item.source] || item.source) : '');
            const src = item.source ? (SOURCE_LABEL[item.source] || item.source) : '';
            const card = (
              <div style={{ borderRadius: 18, padding: 16, background: 'var(--ciq-panel)', border: '1px solid var(--ciq-line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  {/* category badge — neutral/gold, never green */}
                  <span className="ciq-mono" style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase',
                    padding: '3px 8px', borderRadius: 6, color: 'var(--ciq-gold-2)',
                    background: 'var(--ciq-gold-soft)', border: '1px solid var(--ciq-gold-line)',
                  }}>{labelFor(item.insight_type)}</span>
                  {handle && <span className="ciq-mono" style={{ fontSize: 10.5, color: 'var(--ciq-ink-3)' }}>{handle}</span>}
                  {item.date && <span className="ciq-mono" style={{ fontSize: 10.5, color: 'var(--ciq-ink-3)', marginLeft: 'auto' }}>{fmtDate(item.date)}</span>}
                </div>
                {item.title && (
                  <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: '-.01em', lineHeight: 1.35, color: 'var(--ciq-ink)' }}>{item.title}</div>
                )}
                {item.summary && (
                  <div style={{ fontSize: 12.5, color: 'var(--ciq-ink-2)', marginTop: 6, lineHeight: 1.5 }}>
                    {item.summary.length > 240 ? `${item.summary.slice(0, 240)}…` : item.summary}
                  </div>
                )}
                {(src || item.card_mentions.length > 0) && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, alignItems: 'center' }}>
                    {src && <span className="ciq-mono" style={{ fontSize: 9.5, color: 'var(--ciq-ink-3)' }}>{src}</span>}
                    {item.card_mentions.slice(0, 3).map((c, i) => (
                      <span key={i} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: 'var(--ciq-line)', color: 'var(--ciq-ink-3)' }}>{c}</span>
                    ))}
                  </div>
                )}
              </div>
            );
            // Whole card links out to the source post when available (read-only).
            return item.source_url
              ? <a key={item.id} href={item.source_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'var(--ciq-ink)' }}>{card}</a>
              : <div key={item.id}>{card}</div>;
          })}
        </div>
      </div>
      <TabBar />
    </CiqTheme>
  );
}
