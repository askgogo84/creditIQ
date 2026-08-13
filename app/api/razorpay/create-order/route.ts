import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';
import { PLANS, isProPlanKey, monthsForPlan } from '@/lib/plans';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const URL_ENV = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Entitlement must bind to a real user, so the buyer is identified from their bearer
// token — never trusted from the body. Mirrors app/api/onboarding/route.ts.
async function callerId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('authorization') ?? '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const anon = createClient(URL_ENV(), ANON(), { auth: { persistSession: false } });
  const { data, error } = await anon.auth.getUser(m[1].trim());
  if (error || !data.user) return null;
  return data.user.id;
}

export async function POST(req: NextRequest) {
  try {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Payment not configured.' }, { status: 500 });
    }

    // Bind the order to the authenticated buyer. Without this the webhook has no
    // user to grant Pro to.
    const userId = await callerId(req);
    if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const plan = String(body?.plan || '');

    // Server-side price allowlist (paise). The client sends only a plan key; it can
    // NEVER dictate the amount. lib/plans.ts is the single source of truth.
    if (!isProPlanKey(plan)) {
      return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 });
    }
    const amount = PLANS[plan].amount;
    const months = monthsForPlan(plan);

    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await rzp.orders.create({
      amount,
      currency: 'INR',
      receipt: 'ciq_pro_' + plan + '_' + Date.now(),
      // notes echo back on payment.captured; the webhook binds entitlement from them.
      // Razorpay note values must be strings.
      notes: {
        plan,
        months: String(months),
        user_id: userId,
        // Stable MACHINE id the webhook guard matches on — never a display string, so a
        // dashboard copy edit can't silently break payments. product_label is the
        // human-readable field for the Razorpay dashboard only.
        product: 'creditiq',
        product_label: 'CreditIQ Pro',
      },
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
