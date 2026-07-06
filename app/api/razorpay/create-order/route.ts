import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export const dynamic = 'force-dynamic';

// Server-side price allowlist. Amounts in PAISE (rupees x 100).
// The client only sends a plan key; it can NEVER dictate the amount.
const PLAN_AMOUNTS: Record<string, number> = {
  monthly: 19900,   // ₹199
  annual: 199900,   // ₹1999
};

export async function POST(req: NextRequest) {
  try {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: 'Payment not configured.' },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const plan = String(body?.plan || '');
    const amount = PLAN_AMOUNTS[plan];

    if (!amount) {
      return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 });
    }

    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await rzp.orders.create({
      amount,
      currency: 'INR',
      receipt: 'ciq_pro_' + plan + '_' + Date.now(),
      notes: { plan, product: 'CreditIQ Pro' },
    });

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Could not create order.' },
      { status: 500 }
    );
  }
}
