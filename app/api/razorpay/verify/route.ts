import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: 'Payment not configured.' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const orderId = String(body?.razorpay_order_id || '');
    const paymentId = String(body?.razorpay_payment_id || '');
    const signature = String(body?.razorpay_signature || '');

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ verified: false, error: 'Missing fields.' }, { status: 400 });
    }

    // Razorpay signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret)
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(orderId + '|' + paymentId)
      .digest('hex');

    // constant-time compare
    const valid =
      expected.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));

    if (!valid) {
      return NextResponse.json({ verified: false }, { status: 400 });
    }

    // NOTE (Phase 2): on verified=true, persist the Pro entitlement to Supabase here
    // (e.g. insert into a `subscriptions` table with user_id, plan, paid_at, expires_at).
    // Left out intentionally for this one-time-checkout phase.

    return NextResponse.json({ verified: true, paymentId });
  } catch (e: any) {
    return NextResponse.json({ verified: false, error: 'Verification failed.' }, { status: 500 });
  }
}
