'use client';
// On-demand membership paywall for /profile's "Get a membership" button.
//
// Unlike FirstRunModal this is NOT a funnel: it shows the PAID cards only (no Free),
// it does not stamp plan_chosen, and dismissing simply CLOSES (never buys). A successful
// purchase calls onPurchased() (so /profile can refresh its membership + receipts) and
// closes. The plan cards + grid are the shared ./PricingCards — same visuals as first-run.
import { useEffect, useRef, useState } from 'react';
import { startOrderCheckout, type CheckoutPlan } from '@/lib/checkout';
import { PLANS } from '@/lib/plans';
import { PAID_CARDS, PricingGrid } from './PricingCards';

interface Props {
  user: { email?: string; user_metadata?: Record<string, any> } | null;
  onClose: () => void;
  onPurchased: () => void;
}

export function MembershipModal({ user, onClose, onPurchased }: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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
        onPurchased();
        onClose();
      },
    });
  };

  // On-demand: dismiss just closes (never buys). Blocked mid-checkout so we don't
  // yank a Razorpay sheet out from under the user.
  const dismiss = () => {
    if (busy) return;
    onClose();
  };

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
      <div className="mm-scrim" style={{ position: 'fixed', inset: 0, background: 'rgba(20,16,12,0.55)' }} />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mm-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="mm-panel"
        style={{
          position: 'relative', width: 'min(760px, 100%)', margin: 'auto',
          background: 'var(--surface)', color: 'var(--ink)',
          border: '1px solid var(--line-strong)', borderRadius: 'var(--r-lg, 18px)',
          boxShadow: 'var(--shadow-xl, 0 24px 60px rgba(0,0,0,0.22))',
          padding: '26px 20px 22px', outline: 'none',
        }}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          disabled={busy}
          style={{
            position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: '1px solid var(--line-strong)',
            color: 'var(--ink-3)', cursor: busy ? 'default' : 'pointer',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <h1 id="mm-title" className="w-display" style={{ margin: 0, paddingRight: 36, fontSize: 26, fontWeight: 600, letterSpacing: '-.02em', color: 'var(--ink)' }}>
          Get a membership
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2)' }}>
          Pay once for a period, not a subscription. Extend or upgrade whenever you want.
        </p>

        <PricingGrid
          cards={PAID_CARDS}
          busy={busy}
          onChoose={(card) => choosePaid(card.key as CheckoutPlan, PLANS[card.key as CheckoutPlan].label)}
        />

        {msg ? (
          <div style={{ marginTop: 14, padding: '11px 13px', borderRadius: 11, background: 'var(--surface-2, #fff)', border: '1px solid var(--line-strong)', fontSize: 13, color: 'var(--ink)' }}>
            {msg}
          </div>
        ) : null}
      </div>

      <style>{`
        .mm-scrim { animation: mmFade 160ms ease both; }
        .mm-panel { animation: mmRise 200ms cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes mmFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes mmRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .mm-scrim, .mm-panel { animation: none !important; } }
      `}</style>
    </div>
  );
}

export default MembershipModal;
