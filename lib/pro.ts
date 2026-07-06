// lib/pro.ts
// Server-side Pro entitlement check — the single source of truth for gating.
// Every gated API route calls isProServer()/getProStatus(); UI blur is presentation only.
//
// isPro definition (canonical, matches Doc 5):
//   status in ('authenticated','active','grace') AND current_period_end > now()
// 'authenticated' = paid, activation webhook may lag seconds (verify route writes
// an optimistic current_period_end; the webhook corrects it from Razorpay data).
//
// FAIL-CLOSED: any error, missing env, or missing row => not Pro. Never fail-open on money.

import { createClient } from '@supabase/supabase-js';

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export type ProPlan = 'monthly' | 'sixmonth' | 'twelvemonth';

export interface ProStatus {
  isPro: boolean;
  plan: ProPlan | null;
  status: string | null;               // authenticated | active | grace | halted | cancelled | completed
  current_period_end: string | null;   // ISO timestamptz
  cancel_at_period_end: boolean;
}

const NOT_PRO: ProStatus = {
  isPro: false,
  plan: null,
  status: null,
  current_period_end: null,
  cancel_at_period_end: false,
};

const ENTITLED_STATUSES = ['authenticated', 'active', 'grace'];

/**
 * Full status shape — used by /api/subscription/status (Profile page)
 * and anywhere that needs plan/renewal details, not just a boolean.
 */
export async function getProStatus(userId: string): Promise<ProStatus> {
  try {
    const sb = serviceClient();
    if (!sb || !userId) return NOT_PRO;

    // 1) Look for a currently-entitled subscription
    const { data: entitled, error } = await sb
      .from('subscriptions')
      .select('plan,status,current_period_end,cancel_at_period_end')
      .eq('user_id', userId)
      .in('status', ENTITLED_STATUSES)
      .gt('current_period_end', new Date().toISOString())
      .order('current_period_end', { ascending: false })
      .limit(1);

    if (!error && entitled && entitled.length > 0) {
      const row = entitled[0];
      return {
        isPro: true,
        plan: row.plan as ProPlan,
        status: row.status,
        current_period_end: row.current_period_end,
        cancel_at_period_end: !!row.cancel_at_period_end,
      };
    }

    // 2) Not entitled — surface the latest row anyway so the UI can say
    //    "halted — renew to restore" vs a clean free-tier state.
    const { data: latest } = await sb
      .from('subscriptions')
      .select('plan,status,current_period_end,cancel_at_period_end')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (latest && latest.length > 0) {
      const row = latest[0];
      return {
        isPro: false,
        plan: row.plan as ProPlan,
        status: row.status,
        current_period_end: row.current_period_end,
        cancel_at_period_end: !!row.cancel_at_period_end,
      };
    }

    return NOT_PRO;
  } catch {
    return NOT_PRO;
  }
}

/**
 * Boolean gate — the one-liner for gated API routes.
 *   if (!(await isProServer(userId))) return NextResponse.json({ error:'upgrade', upgrade:true }, { status: 402 });
 */
export async function isProServer(userId: string): Promise<boolean> {
  const s = await getProStatus(userId);
  return s.isPro;
}
