// app/api/razorpay/create-subscription/route.ts
// Creates a Razorpay Subscription for the LOGGED-IN user.
// Plan is allowlisted server-side; plan IDs come from env — client can never set amounts.
// user_id is ALWAYS derived from the bearer token and stamped into subscription notes,
// so verify/webhook can bind the subscription back to this user.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';
import { getProStatus } from '@/lib/pro';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const URL_ENV = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function callerId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('authorization') ?? '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const anon = createClient(URL_ENV(), ANON(), { auth: { persistSession: false } });
  const { data, error } = await anon.auth.getUser(m[1].trim());
  if (error || !data.user) return null;
  return data.user.id;
}

// Allowlist: plan name -> env var holding the Razorpay plan_id + billing-cycle count.
// total_count is high on purpose: perpetual-feel, user cancels anytime (Doc 2 §2.4).
const PLAN_CONFIG: Record<string, { envKey: string; totalCount: number }> = {
  monthly: { envKey: 'RAZORPAY_PLAN_MONTHLY', totalCount: 60 },   // 60 x 1 month
  sixmonth: { envKey: 'RAZORPAY_PLAN_6MO', totalCount: 10 },      // 10 x 6 months
  twelvemonth: { envKey: 'RAZORPAY_PLAN_12MO', totalCount: 5 },   // 5 x 12 months
};

export async function POST(req: NextRequest) {
  const userId = await callerId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const plan = String(body?.plan || '');
    const cfg = PLAN_CONFIG[plan];
    if (!cfg) return NextResponse.json({ error: 'invalid plan' }, { status: 400 });

    const planId = process.env[cfg.envKey];
    if (!planId) {
      console.error(`create-subscription: ${cfg.envKey} not set`);
      return NextResponse.json({ error: 'plan not configured' }, { status: 500 });
    }

    // Already entitled? Don't create a second mandate.
    const existing = await getProStatus(userId);
    if (existing.isPro) {
      return NextResponse.json({ already: true, status: existing });
    }

    const rzp = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    // TEMPORARY DEBUG — remove after diagnosing live plan_id mismatch
    console.log('create-subscription debug:', JSON.stringify({ planId: planId, planIdLength: planId?.length, keyPrefix: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.slice(0, 8) }));

    const sub = await rzp.subscriptions.create({
      plan_id: planId,
      total_count: cfg.totalCount,
      customer_notify: 1,
      notes: { user_id: userId, plan },
    });

    return NextResponse.json({ subscription_id: sub.id });
  } catch (e: any) {
    console.error('create-subscription error:', e?.message || e);
    return NextResponse.json({ error: 'failed to create subscription' }, { status: 500 });
  }
}
