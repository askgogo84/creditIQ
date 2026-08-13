'use client';
// First-run pricing modal + its gate.
//
// FirstRunGate mounts in the signed-in shell layout. It shows the modal exactly once,
// after first sign-in, before the onboarding wizard and the (now opt-in) wallet Tour.
//
// Condition B: the gate does NOTHING without a session — no fetch, no modal — so the
// public crawlable shell pages (/cards, /compare, /transfer-partners, /sweet-spots)
// and search crawlers never see it or generate a request.
import { useEffect, useRef, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { authedFetch } from '@/lib/authed-fetch';
import { startOrderCheckout, type CheckoutPlan } from '@/lib/checkout';
import { PLANS } from '@/lib/plans';

type CardKey = 'free' | CheckoutPlan;
interface PlanCard {
  key: CardKey;
  eyebrow: string;
  price: string;
  caption: string;
  cta: string;
  paid: boolean;
  features: string[];
}

// Free is NOT in lib/plans (paid-only source of truth); handle it separately. Paid
// prices are derived from lib/plans so the shown price is the charged price.
const rupees = (paise: number) => '₹' + (paise / 100).toLocaleString('en-IN');

// Order matters: Free FIRST (375-first — "Continue free" reachable without scrolling;
// desktop renders 2×2, so Free is top-left, never a 3+1 orphan).
const CARDS: PlanCard[] = [
  {
    key: 'free', eyebrow: 'FREE', price: '₹0', caption: 'Always free', cta: 'Continue free', paid: false,
    features: ['5 card searches a day', '5 flight searches a day'],
  },
  {
    key: 'monthly', eyebrow: PLANS.monthly.label.toUpperCase(), price: rupees(PLANS.monthly.amount), caption: 'one-time', cta: 'Get this plan', paid: true,
    features: ['Everything in Free', '15 searches a day'],
  },
  {
    key: 'sixmonth', eyebrow: PLANS.sixmonth.label.toUpperCase(), price: rupees(PLANS.sixmonth.amount), caption: 'one-time', cta: 'Get this plan', paid: true,
    features: ['Everything in Free', '30 searches a day'],
  },
  {
    key: 'twelvemonth', eyebrow: PLANS.twelvemonth.label.toUpperCase(), price: rupees(PLANS.twelvemonth.amount), caption: 'one-time', cta: 'Get this plan', paid: true,
    features: ['Everything in Free', '50 searches a day', 'All AI features', 'Early mobile-app access'],
  },
];

// Copper tick, not verified-green: CLAUDE.md reserves #4FBF87 for verified-from-statement.
function Tick() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="m5 13 4 4L19 7" stroke="var(--copper)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface ModalProps {
  user: { email?: string; user_metadata?: Record<string, any> } | null;
  token: string;
  onResolved: () => void;
}

function FirstRunModal({ user, token, onResolved }: ModalProps) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  // Stamp plan_chosen_at (any resolution counts). Idempotent server-side.
  const stampChosen = async () => {
    try {
      await authedFetch('/api/first-run', { method: 'POST', body: JSON.stringify({ choice: 'resolved' }) });
    } catch {}
  };

  // After a choice, advance the funnel: reload /dashboard so the onboarding-wizard
  // bounce (suppressed while plan_chosen was null) now proceeds.
  const advance = () => {
    onResolved();
    window.location.assign('/dashboard');
  };

  const chooseFree = async () => {
    if (busy) return;
    setBusy(true);
    await stampChosen();
    advance();
  };

  const choosePaid = async (plan: CheckoutPlan, planLabel: string) => {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    await startOrderCheckout({
      plan,
      planLabel,
      user,
      onStatus: setMsg,
      onDone: () => setBusy(false),
      onSuccess: async () => {
        await stampChosen();
        advance();
      },
    });
  };

  // Esc / outside-click apply Free — but not mid-checkout (a Razorpay sheet may be open).
  const dismiss = () => {
    if (busy) return;
    void chooseFree();
  };

  // Lock scroll + focus the panel while open.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); dismiss(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy]);

  // Best-effort stamp on hard refresh / back / tab-close while the modal is still
  // unresolved. Beacon can't set headers, so the verified token rides in the body;
  // /api/first-run verifies it and writes to the verified id only. If it's ever
  // dropped, the failure is safe — the modal simply reappears next sign-in.
  useEffect(() => {
    const onHide = () => {
      const t = tokenRef.current;
      if (!t) return;
      try {
        const blob = new Blob([JSON.stringify({ token: t, choice: 'free' })], { type: 'application/json' });
        navigator.sendBeacon('/api/first-run', blob);
      } catch {}
    };
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
  }, []);

  return (
    <div
      role="presentation"
      onClick={dismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 2100,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        overflowY: 'auto', padding: '24px 16px calc(24px + env(safe-area-inset-bottom))',
      }}
    >
      <div className="fr-scrim" style={{ position: 'fixed', inset: 0, background: 'rgba(20,16,12,0.55)' }} />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fr-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="fr-panel"
        style={{
          position: 'relative', width: 'min(760px, 100%)', margin: 'auto',
          background: 'var(--surface)', color: 'var(--ink)',
          border: '1px solid var(--line-strong)', borderRadius: 'var(--r-lg, 18px)',
          boxShadow: 'var(--shadow-xl, 0 24px 60px rgba(0,0,0,0.22))',
          padding: '26px 20px 22px', outline: 'none',
        }}
      >
        <h1 id="fr-title" className="w-display" style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-.02em', color: 'var(--ink)' }}>
          Pick a plan to get started
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2)' }}>
          Start free — upgrade whenever you want. Pay once for a period, not a subscription.
        </p>

        <div className="fr-grid" style={{ marginTop: 20, display: 'grid', gap: 12 }}>
          {CARDS.map((card) => {
            const label = card.paid ? PLANS[card.key as CheckoutPlan].label : '';
            return (
              <div
                key={card.key}
                className="fr-card"
                style={{
                  display: 'flex', flexDirection: 'column',
                  background: 'var(--surface-2, #fff)', border: '1px solid var(--line-strong)',
                  borderRadius: 14, padding: '18px 16px',
                }}
              >
                <div className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--copper)' }}>
                  {card.eyebrow}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
                  <span className="w-display" style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-.03em', color: 'var(--ink)' }}>
                    {card.price}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{card.caption}</span>
                </div>

                <ul style={{ listStyle: 'none', margin: '14px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  {card.features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, lineHeight: 1.4, color: 'var(--ink-2)' }}>
                      <Tick />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => (card.paid ? choosePaid(card.key as CheckoutPlan, label) : chooseFree())}
                  style={{
                    marginTop: 16, width: '100%', minHeight: 46, borderRadius: 11, cursor: busy ? 'default' : 'pointer',
                    fontSize: 14, fontWeight: 600, letterSpacing: '-.01em',
                    border: card.paid ? 'none' : '1px solid var(--copper)',
                    background: card.paid ? 'var(--copper)' : 'transparent',
                    color: card.paid ? 'var(--surface)' : 'var(--copper)',
                    opacity: busy ? 0.6 : 1, transition: 'opacity 0.15s ease',
                  }}
                >
                  {card.cta}
                </button>
              </div>
            );
          })}
        </div>

        {msg ? (
          <div style={{ marginTop: 14, padding: '11px 13px', borderRadius: 11, background: 'var(--surface-2, #fff)', border: '1px solid var(--line-strong)', fontSize: 13, color: 'var(--ink)' }}>
            {msg}
          </div>
        ) : null}
      </div>

      <style>{`
        .fr-scrim { animation: frFade 160ms ease both; }
        .fr-panel { animation: frRise 200ms cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes frFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes frRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @media (min-width: 640px) { .fr-grid { grid-template-columns: 1fr 1fr; } }
        @media (prefers-reduced-motion: reduce) { .fr-scrim, .fr-panel { animation: none !important; } }
      `}</style>
    </div>
  );
}

export function FirstRunGate() {
  const [modal, setModal] = useState<{ user: any; token: string } | null>(null);

  useEffect(() => {
    let off = false;
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    (async () => {
      // Condition B: no session → stop here. No fetch, no modal.
      const { data: { session } } = await sb.auth.getSession();
      if (!session || off) return;
      try {
        const res = await authedFetch('/api/first-run');
        const j = await res.json();
        if (!off && j?.enabled && !j?.plan_chosen) {
          setModal({ user: session.user, token: session.access_token });
        }
      } catch {}
    })();
    return () => { off = true; };
  }, []);

  if (!modal) return null;
  return <FirstRunModal user={modal.user} token={modal.token} onResolved={() => setModal(null)} />;
}

export default FirstRunGate;
