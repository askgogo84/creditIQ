// app/api/razorpay/verify-subscription/route.ts
// Verifies the subscription authorisation payment returned by Razorpay Checkout.
// Signature = HMAC-SHA256(payment_id + '|' + subscription_id, KEY_SECRET)
//   — NOTE: different concatenation than one-time orders (order_id|payment_id).
// On success: upsert an 'authenticated' row with an OPTIMISTIC current_period_end
// (now + plan length) so isPro flips instantly; the webhook is the source of truth
// and corrects dates on subscription.activated / .charged.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const URL_ENV = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SVC = () => process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function callerId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('authorization') ?? '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const anon = createClient(URL_ENV(), ANON(), { auth: { persistSession: false } });
  const { data, error } = await anon.auth.getUser(m[1].trim());
  if (error || !data.user) return null;
  return data.user.id;
}

function svcClient() {
  return createClient(URL_ENV(), SVC(), { auth: { persistSession: false } });
}

// Optimistic period lengths in days — webhook corrects with real charge dates.
const PLAN_DAYS: Record<string, number> = {
  monthly: 31,
  sixmonth: 186,
  twelvemonth: 366,
};

export async function POST(req: NextRequest) {
  const userId = await callerId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const paymentId = String(body?.razorpay_payment_id || '');
    const subscriptionId = String(body?.razorpay_subscription_id || '');
    const signature = String(body?.razorpay_signature || '');
    if (!paymentId || !subscriptionId || !signature) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${paymentId}|${subscriptionId}`)
      .digest('hex');
    if (expected !== signature) {
      console.error('verify-subscription: signature mismatch', { subscriptionId });
      return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
    }

    // Fetch the subscription to bind it to the user we stamped at creation.
    const rzp = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: secret,
    });
    const sub: any = await rzp.subscriptions.fetch(subscriptionId);
    const notes: any = sub?.notes || {};
    if (!notes.user_id || notes.user_id !== userId) {
      console.error('verify-subscription: user mismatch', { subscriptionId, caller: userId });
      return NextResponse.json({ error: 'subscription does not belong to caller' }, { status: 403 });
    }

    const plan = String(notes.plan || '');
    const days = PLAN_DAYS[plan];
    if (!days) return NextResponse.json({ error: 'unknown plan on subscription' }, { status: 400 });

    const now = new Date();
    const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const { error: dbError } = await svcClient()
      .from('subscriptions')
      .upsert(
        {
          user_id: userId,
          razorpay_subscription_id: subscriptionId,
          razorpay_plan_id: sub.plan_id,
          plan,
          status: 'authenticated',
          current_period_start: now.toISOString(),
          current_period_end: end.toISOString(),   // optimistic; webhook corrects
          last_payment_id: paymentId,
          updated_at: now.toISOString(),
        },
        { onConflict: 'razorpay_subscription_id' }
      );

    if (dbError) {
      console.error('verify-subscription: db upsert failed', dbError.message);
      return NextResponse.json({ error: 'entitlement write failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('verify-subscription error:', e?.message || e);
    return NextResponse.json({ error: 'verification failed' }, { status: 500 });
  }
}
