'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { CiqTheme } from '@/components/ciq/ThemeProvider';
import { TabBar } from '@/components/ciq/TabBar';

// ---- Pricing (single source of truth) ----
// Amounts shown to the user in rupees; the API converts to paise.
const PLANS = {
  monthly: { label: 'Monthly', rupees: 199, per: '/month', note: '' },
  annual: { label: 'Annual', rupees: 1999, per: '/year', note: 'Save 16%' },
} as const;
type PlanKey = keyof typeof PLANS;

const FEATURES: { label: string; free: boolean; pro: boolean }[] = [
  { label: 'Card catalog & search', free: true, pro: true },
  { label: 'Points optimizer', free: true, pro: true },
  { label: 'CIRA travel assistant', free: true, pro: true },
  { label: 'Verified-from-statement analysis', free: false, pro: true },
  { label: 'Unlimited card connections', free: false, pro: true },
  { label: 'Devaluation early warnings', free: false, pro: true },
  { label: 'Priority redemption alerts', free: false, pro: true },
  { label: 'Concierge redemption support', free: false, pro: true },
];

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export default function ProPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [plan, setPlan] = useState<PlanKey>('annual');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const sb = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  useEffect(() => {
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/login'); return; }
      setUser(user);
    });
    // load Razorpay checkout script
    const id = 'razorpay-checkout-js';
    if (!document.getElementById(id)) {
      const s = document.createElement('script');
      s.id = id;
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.async = true;
      document.body.appendChild(s);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpgrade = async () => {
    setMsg(null);
    setBusy(true);
    try {
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok || !order.id) {
        setMsg(order.error || 'Could not start checkout. Try again.');
        setBusy(false);
        return;
      }

      if (!window.Razorpay) {
        setMsg('Checkout still loading. Try again in a moment.');
        setBusy(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        name: 'CreditIQ Pro',
        description: PLANS[plan].label + ' plan',
        prefill: {
          email: user?.email || '',
          name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
        },
        theme: { color: '#C9A24B' },
        handler: async (resp: any) => {
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            }),
          });
          const v = await verifyRes.json();
          if (verifyRes.ok && v.verified) {
            setMsg('Payment verified. Welcome to Pro.');
          } else {
            setMsg('Payment could not be verified. If you were charged, contact support.');
          }
          setBusy(false);
        },
        modal: {
          ondismiss: () => setBusy(false),
        },
      });
      rzp.on('payment.failed', () => {
        setMsg('Payment failed or was cancelled.');
        setBusy(false);
      });
      rzp.open();
    } catch (e) {
      setMsg('Something went wrong starting checkout.');
      setBusy(false);
    }
  };

  const active = PLANS[plan];

  return (
    <CiqTheme>
      <div style={{ maxWidth: 420, margin: '0 auto', paddingBottom: 120 }}>

        {/* Brand row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 8px' }}>
          <div className="ciq-display" style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-.02em' }}>
            Credit<span style={{ color: 'var(--ciq-gold-2)' }}>IQ</span>
          </div>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em',
            color: 'var(--ciq-gold-2)', border: '1px solid var(--ciq-gold)', borderRadius: 999, padding: '4px 12px',
          }}>
            PRO
          </span>
        </div>

        {/* Title */}
        <div style={{ padding: '14px 20px 0' }}>
          <h1 className="ciq-display" style={{ fontWeight: 600, fontSize: 30, letterSpacing: '-.02em', lineHeight: 1.15 }}>
            Unlock the moat
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ciq-ink-2)', marginTop: 8, lineHeight: 1.5 }}>
            The verified-from-statement analysis no one else has. Real math on your real spend.
          </p>
        </div>

        {/* Plan toggle */}
        <div style={{ padding: '22px 20px 0' }}>
          <div style={{
            display: 'flex', gap: 6, padding: 5, background: 'var(--ciq-panel)',
            border: '1px solid var(--ciq-line-2)', borderRadius: 14,
          }}>
            {(Object.keys(PLANS) as PlanKey[]).map((k) => {
              const on = plan === k;
              return (
                <button
                  key={k}
                  onClick={() => setPlan(k)}
                  style={{
                    flex: 1, minHeight: 44, borderRadius: 10, cursor: 'pointer', border: 'none',
                    background: on ? 'var(--ciq-gold)' : 'transparent',
                    color: on ? '#080807' : 'var(--ciq-ink-2)',
                    fontSize: 14, fontWeight: on ? 600 : 500,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {PLANS[k].label}
                  {PLANS[k].note ? (
                    <span style={{
                      fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
                      padding: '2px 6px', borderRadius: 6,
                      background: on ? 'rgba(8,8,7,0.18)' : 'var(--ciq-gold-soft)',
                      color: on ? '#080807' : 'var(--ciq-gold-2)',
                    }}>
                      {PLANS[k].note}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Price display */}
          <div style={{ textAlign: 'center', padding: '24px 0 4px' }}>
            <span className="ciq-display" style={{ fontSize: 44, fontWeight: 600, color: 'var(--ciq-ink)', letterSpacing: '-.03em' }}>
              ₹{active.rupees.toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: 15, color: 'var(--ciq-ink-3)', marginLeft: 4 }}>{active.per}</span>
          </div>
        </div>

        {/* Feature comparison */}
        <div style={{ padding: '18px 20px 0' }}>
          <div style={{
            background: 'var(--ciq-panel)', border: '1px solid var(--ciq-line-2)', borderRadius: 16, overflow: 'hidden',
          }}>
            {/* header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 64px 64px', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--ciq-line-2)' }}>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', color: 'var(--ciq-ink-3)' }}>FEATURE</span>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', color: 'var(--ciq-ink-3)', textAlign: 'center' }}>FREE</span>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', color: 'var(--ciq-gold-2)', textAlign: 'center' }}>PRO</span>
            </div>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr 64px 64px', alignItems: 'center',
                padding: '13px 16px',
                borderBottom: i < FEATURES.length - 1 ? '1px solid var(--ciq-line)' : 'none',
              }}>
                <span style={{ fontSize: 14, color: 'var(--ciq-ink)' }}>{f.label}</span>
                <span style={{ textAlign: 'center', color: f.free ? 'var(--ciq-ink-2)' : 'var(--ciq-ink-3)' }}>
                  {f.free ? '✓' : '—'}
                </span>
                <span style={{ textAlign: 'center', color: f.pro ? 'var(--ciq-verified)' : 'var(--ciq-ink-3)', fontWeight: 600 }}>
                  {f.pro ? '✓' : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Message */}
        {msg ? (
          <div style={{
            margin: '16px 20px 0', padding: '12px 14px', borderRadius: 12,
            background: 'var(--ciq-panel)', border: '1px solid var(--ciq-gold-line)',
            fontSize: 13, color: 'var(--ciq-ink)',
          }}>
            {msg}
          </div>
        ) : null}

        {/* CTA */}
        <div style={{ padding: '18px 20px 0' }}>
          <button
            onClick={handleUpgrade}
            disabled={busy}
            style={{
              width: '100%', minHeight: 52, borderRadius: 14, border: 'none', cursor: busy ? 'default' : 'pointer',
              background: 'var(--ciq-gold)', color: '#080807',
              fontSize: 16, fontWeight: 600, letterSpacing: '-.01em',
              opacity: busy ? 0.6 : 1, transition: 'opacity 0.15s ease',
            }}
          >
            {busy ? 'Opening checkout…' : `Upgrade to Pro — ₹${active.rupees.toLocaleString('en-IN')}${active.per}`}
          </button>
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--ciq-ink-3)', marginTop: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
            Secured by Razorpay · One-time payment
          </p>
        </div>
      </div>

      <TabBar />
    </CiqTheme>
  );
}
