// lib/checkout.ts
// Single source for the one-time Pro ORDER checkout (Razorpay orders / order.paid).
// Extracted out of app/(shell)/pro/ProClient.tsx so /pro and the first-run pricing
// modal share ONE flow instead of two copies drifting apart. Entitlement itself is
// granted server-side by the order.paid webhook (extend_pro -> pro_until); the verify
// call here is a signature check for immediate UX only.
'use client';
import { authedFetch } from '@/lib/authed-fetch';

export type CheckoutPlan = 'monthly' | 'sixmonth' | 'twelvemonth';

export interface OrderCheckoutParams {
  plan: CheckoutPlan;
  /** Human label for the Razorpay sheet description, e.g. "1 month". */
  planLabel: string;
  /** For Razorpay prefill. */
  user: { email?: string; user_metadata?: Record<string, any> } | null;
  /** Set the user-facing status/error message. */
  onStatus: (msg: string) => void;
  /** Called on every terminal outcome (success / failure / dismiss) to clear busy. */
  onDone: () => void;
  /** Called after a signature-verified payment (e.g. stamp state + close a modal). */
  onSuccess?: () => void;
}

/**
 * Create an order (server allowlists the amount + stamps notes.user_id from the
 * bearer token — create-order 401s without it) and open Razorpay checkout against it.
 */
export async function startOrderCheckout(p: OrderCheckoutParams): Promise<void> {
  const { plan, planLabel, user, onStatus, onDone, onSuccess } = p;

  const orderRes = await authedFetch('/api/razorpay/create-order', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  });
  const order = await orderRes.json();
  if (!orderRes.ok || !order.id) {
    onStatus(order.error || 'Could not start checkout. Try again.');
    onDone();
    return;
  }

  const rzpCtor = typeof window !== 'undefined' ? (window as any).Razorpay : undefined;
  if (!rzpCtor) {
    onStatus('Checkout still loading. Try again in a moment.');
    onDone();
    return;
  }

  const rzp = new rzpCtor({
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    name: 'CreditIQ Pro',
    description: `${planLabel} — one-time`,
    prefill: {
      email: user?.email || '',
      name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
    },
    theme: { color: '#C9A24B' },
    handler: async (resp: any) => {
      // Signature check for immediate UX only — the webhook is the source of truth for
      // entitlement, so Pro may activate a moment after this message shows.
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
        onStatus('Payment received — activating your Pro access. This can take a few seconds.');
        onSuccess?.();
      } else {
        onStatus('Payment could not be verified. If you were charged, contact support.');
      }
      onDone();
    },
    modal: {
      ondismiss: () => onDone(),
    },
  });
  rzp.on('payment.failed', () => {
    onStatus('Payment failed or was cancelled.');
    onDone();
  });
  rzp.open();
}
