// app/api/subscription/cancel/route.ts
// Cancels the caller's subscription AT CYCLE END — access retained until
// current_period_end, no further charges. Easy cancel is deliberate:
// it's honest UX and RBI-mandate hygiene.
// Uses the raw REST endpoint for cancel (deterministic contract) while
// create/fetch use the SDK elsewhere.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

const ENTITLED_STATUSES = ['authenticated', 'active', 'grace'];

export async function POST(req: NextRequest) {
  const userId = await callerId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const sb = svcClient();
    const { data } = await sb
      .from('subscriptions')
      .select('razorpay_subscription_id,status,cancel_at_period_end')
      .eq('user_id', userId)
      .in('status', ENTITLED_STATUSES)
      .order('current_period_end', { ascending: false })
      .limit(1);

    const row = data?.[0];
    if (!row) return NextResponse.json({ error: 'no active subscription' }, { status: 404 });
    if (row.cancel_at_period_end) return NextResponse.json({ ok: true, already: true });

    // Guard: never send our manual test fixtures to Razorpay's API.
    if (!row.razorpay_subscription_id.startsWith('sub_TEST_MANUAL')) {
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!;
      const secret = process.env.RAZORPAY_KEY_SECRET!;
      const basic = Buffer.from(`${keyId}:${secret}`).toString('base64');

      const res = await fetch(
        `https://api.razorpay.com/v1/subscriptions/${row.razorpay_subscription_id}/cancel`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${basic}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cancel_at_cycle_end: 1 }),
        }
      );

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        console.error('cancel: razorpay error', res.status, errBody);
        return NextResponse.json({ error: 'cancel failed at provider' }, { status: 502 });
      }
    }

    await sb
      .from('subscriptions')
      .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
      .eq('razorpay_subscription_id', row.razorpay_subscription_id);

    // Status stays entitled until the period-end webhook flips it to 'cancelled'.
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('cancel error:', e?.message || e);
    return NextResponse.json({ error: 'cancel failed' }, { status: 500 });
  }
}
