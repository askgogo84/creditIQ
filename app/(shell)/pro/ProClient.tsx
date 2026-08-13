'use client';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { CiqTheme } from '@/components/ciq/ThemeProvider';
import { authedFetch } from '@/lib/authed-fetch';
import { SectionTabs } from '@/components/ciq/SectionTabs';
import { PLANS as ORDER_PLANS } from '@/lib/plans';

type PlanKey = 'monthly' | 'sixmonth' | 'twelvemonth';
type PlanDisplay = { label: string; rupees: number; per: string; note: string; effective: string };

// ---- Pricing display ----
// Two ladders, because the two payment shapes charge different amounts:
//  • SUBSCRIPTION (RAZORPAY_MODE unset): the recurring Razorpay Plan objects charge
//    ₹199 / ₹999 / ₹1499. Amounts live server-side at Razorpay.
//  • ORDERS (RAZORPAY_MODE=orders): one-time charges of ₹149 / ₹499 / ₹999, whose
//    amounts are the single source of truth in lib/plans.ts. Deriving the DISPLAY
//    rupees straight from ORDER_PLANS guarantees the shown price == the charged price.
const SUB_PLANS: Record<PlanKey, PlanDisplay> = {
  monthly: { label: 'Monthly', rupees: 199, per: '/month', note: '', effective: '' },
  sixmonth: { label: '6 months', rupees: 999, per: '/6 months', note: 'Save 16%', effective: '₹166/month effective' },
  twelvemonth: { label: '12 months', rupees: 1499, per: '/year', note: 'Save 37%', effective: '₹125/month effective' },
};

// No badges in orders mode: the ladder inverts (₹499/6mo = ₹83.17/mo vs
// ₹999/12mo = ₹83.25/mo — the 12-month costs MORE per month), so "Best value" on
// the 12-month is false and any per-month framing exposes it. Badges stay off until
// the price is re-decided. This is a price decision, owned by Gogo — not a copy fix.
const ORDER_DISPLAY: Record<PlanKey, PlanDisplay> = {
  monthly: { label: '1 month', rupees: ORDER_PLANS.monthly.amount / 100, per: ' one-time', note: '', effective: '' },
  sixmonth: { label: '6 months', rupees: ORDER_PLANS.sixmonth.amount / 100, per: ' one-time', note: '', effective: '' },
  twelvemonth: { label: '12 months', rupees: ORDER_PLANS.twelvemonth.amount / 100, per: ' one-time', note: '', effective: '' },
};

const FEATURES: { label: string; free: boolean; pro: boolean }[] = [
  { label: 'Card catalog & search', free: true, pro: true },
  { label: 'Points floor valuation (what they’re worth)', free: true, pro: true },
  { label: 'Redemption paths — partner, ratio, steps', free: false, pro: true },
  { label: 'Full smart optimization ranking', free: false, pro: true },
  { label: 'CIRA travel assistant — unlimited', free: false, pro: true },
  { label: 'Verified-from-statement analysis', free: false, pro: true },
  { label: 'Devaluation early warnings', free: false, pro: true },
  { label: 'Priority redemption alerts', free: false, pro: true },
];

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export default function ProClient({ ordersMode }: { ordersMode: boolean }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [plan, setPlan] = useState<PlanKey>('twelvemonth');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const PLANS = ordersMode ? ORDER_DISPLAY : SUB_PLANS;

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

  // ---- ORDERS path (RAZORPAY_MODE=orders): one-time charge; entitlement is granted
  //      by the payment.captured webhook (extend_pro -> pro_until), NOT by verify.
  const upgradeViaOrder = async () => {
    // create-order 401s without the bearer — authedFetch attaches the session token.
    const orderRes = await authedFetch('/api/razorpay/create-order', {
      method: 'POST',
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
      description: `${PLANS[plan].label} — one-time`,
      prefill: {
        email: user?.email || '',
        name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
      },
      theme: { color: '#C9A24B' },
      handler: async (resp: any) => {
        // Signature check is for immediate UX only. The webhook is the source of truth
        // for entitlement, so Pro may activate a moment after this message shows.
        const verifyRes = await authedFetch('/api/razorpay/verify', {
          method: 'POST',
          body: JSON.stringify({
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_signature: resp.razorpay_signature,
          }),
        });
        const v = await verifyRes.json();
        if (verifyRes.ok && v.verified) {
          setMsg('Payment received — activating your Pro access. This can take a few seconds.');
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
  };

  // ---- SUBSCRIPTION path (RAZORPAY_MODE unset): unchanged recurring mandate.
  const upgradeViaSubscription = async () => {
    // Server allowlists the plan and stamps user_id into subscription notes.
    const subRes = await authedFetch('/api/razorpay/create-subscription', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
    const sub = await subRes.json();

    if (sub.already) {
      setMsg('You’re already Pro — nothing to pay. Manage your plan from Profile.');
      setBusy(false);
      return;
    }
    if (!subRes.ok || !sub.subscription_id) {
      setMsg(sub.error || 'Could not start checkout. Try again.');
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
      subscription_id: sub.subscription_id,
      name: 'CreditIQ Pro',
      description: `${PLANS[plan].label} plan — auto-renews`,
      prefill: {
        email: user?.email || '',
        name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
      },
      theme: { color: '#C9A24B' },
      handler: async (resp: any) => {
        const verifyRes = await authedFetch('/api/razorpay/verify-subscription', {
          method: 'POST',
          body: JSON.stringify({
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_subscription_id: resp.razorpay_subscription_id,
            razorpay_signature: resp.razorpay_signature,
          }),
        });
        const v = await verifyRes.json();
        if (verifyRes.ok && v.ok) {
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
  };

  const handleUpgrade = async () => {
    setMsg(null);
    setBusy(true);
    try {
      if (ordersMode) {
        await upgradeViaOrder();
      } else {
        await upgradeViaSubscription();
      }
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
          <SectionTabs tone="gold" />
        </div>

        {/* Plan toggle — 3 tiers, 12-month pre-selected */}
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
                    flex: 1, minHeight: 52, borderRadius: 10, cursor: 'pointer', border: 'none',
                    background: on ? 'var(--ciq-gold)' : 'transparent',
                    color: on ? '#080807' : 'var(--ciq-ink-2)',
                    fontSize: 13, fontWeight: on ? 600 : 500,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                    transition: 'all 0.15s ease', padding: '6px 2px',
                  }}
                >
                  <span>{PLANS[k].label}</span>
                  {PLANS[k].note ? (
                    <span style={{
                      fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
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
            {active.effective ? (
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--ciq-ink-3)', marginTop: 6 }}>
                {active.effective}
              </div>
            ) : null}
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
                <span style={{ textAlign: 'center', color: f.pro ? 'var(--ciq-gold-2)' : 'var(--ciq-ink-3)', fontWeight: 600 }}>
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
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--ciq-ink-3)', marginTop: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', lineHeight: 1.6 }}>
            {ordersMode ? (
              <>
                Secured by Razorpay · Pay once — not a subscription
                <br />
                You keep Pro for the full period you buy
              </>
            ) : (
              <>
                Secured by Razorpay · Auto-renews via UPI AutoPay or card mandate
                <br />
                Cancel anytime — you keep Pro until your period ends
              </>
            )}
          </p>
        </div>
      </div>
    </CiqTheme>
  );
}
