// app/api/razorpay/webhook/route.ts
// Razorpay Subscriptions webhook — THE SOURCE OF TRUTH for entitlements.
//
// Security: HMAC-SHA256 of the RAW request body with RAZORPAY_WEBHOOK_SECRET
// (a separate secret from the API key secret, configured in Dashboard > Webhooks).
// No bearer auth here — Razorpay is the caller.
//
// Reliability:
//  - Every verified event is logged to subscription_events BEFORE processing (audit).
//  - Idempotency: events older than the stored last_event_at are skipped.
//  - Transition guard: stale/out-of-order events can never resurrect a
//    cancelled/completed subscription or regress a newer state.
//  - Return 200 on handled + unprocessable-but-verified events; 500 only on
//    transient DB failures (so Razorpay retries those and only those).
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { monthsForPlan } from '@/lib/plans';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const URL_ENV = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SVC = () => process.env.SUPABASE_SERVICE_ROLE_KEY!;

function svcClient() {
  return createClient(URL_ENV(), SVC(), { auth: { persistSession: false } });
}

const GRACE_DAYS = 3;

// Which of OUR stored statuses each incoming event may be applied on top of.
// (Our states: created, authenticated, active, grace, halted, cancelled, completed)
const ALLOWED_FROM: Record<string, string[]> = {
  'subscription.authenticated': ['__none__', 'created'],
  'subscription.activated':     ['__none__', 'created', 'authenticated', 'grace'],
  'subscription.charged':       ['__none__', 'created', 'authenticated', 'active', 'grace'],
  'subscription.pending':       ['authenticated', 'active', 'grace'],
  'subscription.halted':        ['authenticated', 'active', 'grace'],
  'subscription.cancelled':     ['__none__', 'created', 'authenticated', 'active', 'grace', 'halted'],
  'subscription.completed':     ['__none__', 'created', 'authenticated', 'active', 'grace', 'halted'],
};

// Map incoming event -> our stored status
const EVENT_TO_STATUS: Record<string, string> = {
  'subscription.authenticated': 'authenticated',
  'subscription.activated': 'active',
  'subscription.charged': 'active',
  'subscription.pending': 'grace',
  'subscription.halted': 'halted',
  'subscription.cancelled': 'cancelled',
  'subscription.completed': 'completed',
};

function unixToIso(sec: unknown): string | null {
  const n = Number(sec);
  if (!n || Number.isNaN(n)) return null;
  return new Date(n * 1000).toISOString();
}

export async function POST(req: NextRequest) {
  // 1) RAW body first — signature is computed over the exact bytes.
  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature') || '';
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.error('webhook: RAZORPAY_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'not configured' }, { status: 500 });
  }

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const valid =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  if (!valid) {
    console.error('webhook: signature verification failed');
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  // 2) Parse after verification.
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const eventType: string = payload?.event || 'unknown';
  const sub: any = payload?.payload?.subscription?.entity || null;
  const payment: any = payload?.payload?.payment?.entity || null;
  const subId: string | null = sub?.id || null;
  const eventAtIso = unixToIso(payload?.created_at) || new Date().toISOString();

  const sb = svcClient();

  // 2.5) ONE-TIME ORDER ENTITLEMENT. Additive + gated; the subscription.* handling
  //      below is untouched, and both models stay live during cutover. INERT until
  //      RAZORPAY_MODE=orders. Order events have their own ledger (pro_order_events,
  //      via extend_pro), so they never touch subscription_events.
  //
  //      Source event is ORDER.PAID, not payment.captured. Our notes live on the ORDER
  //      entity (create-order stamps order.notes), and order.paid delivers
  //      payload.order.entity (WITH notes) plus payload.payment.entity. payment.captured
  //      carries payment.entity.notes — a DIFFERENT, empty bag — so reading it there saw
  //      no product/user_id and silently ignored every real order (the bug that took the
  //      first ₹149: captured, but pro_order_events stayed empty).
  const order: any = payload?.payload?.order?.entity || null;
  if (process.env.RAZORPAY_MODE === 'orders' && eventType === 'order.paid') {
    const orderId: string | null = order?.id || null;
    const notes: any = order?.notes || {};

    // Fail CLOSED to OUR product. Only CreditIQ orders carry product==='creditiq' (a
    // stable machine id stamped at order creation). Any other paid order on this Razorpay
    // account — e.g. AskGogo — is quietly ignored and never reaches extend_pro. This is
    // the guard; extend_pro's auth.users check is only a backstop, not a substitute.
    if (notes.product !== 'creditiq') {
      return NextResponse.json({ ok: true, ignored: 'not a creditiq order' });
    }

    // From here the delivery IS ours. Any failure to grant must SHOUT ([RZP][ALERT]) —
    // never a quiet 200. A paid CreditIQ order that entitles nobody is money taken with
    // no product; last time the empty ledger was the only signal. The logs should be too.
    if (!orderId) {
      console.error('[RZP][ALERT] order.paid for a creditiq order with no order id — cannot grant or dedupe');
      return NextResponse.json({ ok: true, alerted: 'no_order_id' });
    }
    const userId: string | null = notes.user_id || null;
    if (!userId) {
      console.error(`[RZP][ALERT] creditiq order ${orderId} carries no user_id in notes — Pro NOT granted; needs manual bind + replay`);
      return NextResponse.json({ ok: true, alerted: 'no_user_id' });
    }
    const plan: string =
      ['monthly', 'sixmonth', 'twelvemonth'].includes(notes.plan) ? notes.plan : 'monthly';
    const months = Number(notes.months) || monthsForPlan(plan);

    const { data: result, error: rpcError } = await sb.rpc('extend_pro', {
      p_order_id: orderId,
      p_user_id: userId,
      p_plan: plan,
      p_months: months,
      p_payment_id: payment?.id || null,
      p_amount_paise:
        typeof order?.amount_paid === 'number' ? order.amount_paid
        : typeof order?.amount === 'number' ? order.amount
        : typeof payment?.amount === 'number' ? payment.amount
        : null,
      p_event_type: eventType,
      p_raw: payload,
    });

    if (rpcError) {
      // Transient DB failure — 500 so Razorpay retries this (and only this).
      console.error(`[RZP][ALERT] extend_pro failed for creditiq order ${orderId}: ${rpcError.message}`);
      return NextResponse.json({ error: 'db write failed' }, { status: 500 });
    }
    if (result === 'no_such_user') {
      // A retry can't fix a bad binding (notes.user_id is fixed at order creation), so
      // return 200 and alert a human — do not spin Razorpay's retry schedule on it. The
      // order is left UN-recorded in the ledger, so a manual bind + replay can still grant.
      console.error(`[RZP][ALERT] paid order ${orderId} bound to unknown user ${userId} — Pro NOT granted; needs manual bind + replay`);
      return NextResponse.json({ ok: true, alerted: 'no_such_user' });
    }
    // 'applied' | 'already_applied' — the only success paths.
    console.log(`[RZP] creditiq order ${orderId} -> ${result} (${plan}, ${months}mo, user ${userId})`);
    return NextResponse.json({ ok: true, result });
  }

  // In orders mode, one-time entitlement comes from order.paid (above). A stray
  // payment.captured (e.g. both events left subscribed during cutover) is a quiet no-op
  // here — never alert, never 400-loop. In subscription mode this branch is skipped and
  // the event falls through to the audit log + generic-ignore path below, unchanged.
  if (process.env.RAZORPAY_MODE === 'orders' && eventType === 'payment.captured') {
    return NextResponse.json({ ok: true, ignored: 'payment.captured no-op (orders use order.paid)' });
  }

  // 3) Audit log FIRST — even for events we don't handle.
  let auditId: number | null = null;
  try {
    const { data: auditRow } = await sb
      .from('subscription_events')
      .insert({
        razorpay_subscription_id: subId,
        event_type: eventType,
        payload,
      })
      .select('id')
      .single();
    auditId = auditRow?.id ?? null;
  } catch (e: any) {
    console.error('webhook: audit insert failed', e?.message || e);
    return NextResponse.json({ error: 'audit write failed' }, { status: 500 }); // retryable
  }

  async function markAudit(processed: boolean, error?: string) {
    if (auditId === null) return;
    await sb
      .from('subscription_events')
      .update({ processed, error: error || null })
      .eq('id', auditId);
  }

  // 4) Only subscription.* events with a subscription entity are processed.
  const newStatus = EVENT_TO_STATUS[eventType];
  if (!newStatus || !subId) {
    await markAudit(true, `ignored: ${eventType}`);
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    // 5) Load existing row (if any) for idempotency + transition + user binding.
    const { data: existingRows } = await sb
      .from('subscriptions')
      .select('user_id,status,plan,current_period_end,last_event_at,cancel_at_period_end')
      .eq('razorpay_subscription_id', subId)
      .limit(1);
    const existing = existingRows?.[0] || null;

    // Idempotency / ordering: skip events not newer than what we've applied.
    if (existing?.last_event_at && new Date(eventAtIso) <= new Date(existing.last_event_at)) {
      await markAudit(true, 'stale: older than last_event_at');
      return NextResponse.json({ ok: true, stale: true });
    }

    // Transition guard.
    const fromState = existing?.status || '__none__';
    if (!ALLOWED_FROM[eventType].includes(fromState)) {
      await markAudit(true, `blocked transition: ${fromState} -> ${newStatus}`);
      return NextResponse.json({ ok: true, blocked: true });
    }

    // User binding: notes.user_id (stamped at creation) or the existing row.
    const notes: any = sub?.notes || {};
    const userId: string | null = notes.user_id || existing?.user_id || null;
    if (!userId) {
      await markAudit(true, 'no user binding: missing notes.user_id and no existing row');
      return NextResponse.json({ ok: true, unbound: true });
    }
    const plan: string =
      ['monthly', 'sixmonth', 'twelvemonth'].includes(notes.plan)
        ? notes.plan
        : existing?.plan || 'monthly';

    // 6) Compute period fields per event.
    const nowIso = new Date().toISOString();
    let periodStart = unixToIso(sub?.current_start);
    let periodEnd = unixToIso(sub?.current_end);

    if (eventType === 'subscription.pending') {
      // Charge failed, Razorpay retrying: keep access for a short grace window.
      const graceEnd = new Date(Date.now() + GRACE_DAYS * 24 * 60 * 60 * 1000);
      const existingEnd = existing?.current_period_end ? new Date(existing.current_period_end) : null;
      periodEnd = (existingEnd && existingEnd > graceEnd ? existingEnd : graceEnd).toISOString();
      periodStart = null; // don't touch start on grace
    }

    // 7) Upsert.
    const row: Record<string, any> = {
      user_id: userId,
      razorpay_subscription_id: subId,
      razorpay_plan_id: sub?.plan_id || 'unknown',
      plan,
      status: newStatus,
      last_event_at: eventAtIso,
      updated_at: nowIso,
    };
    if (periodStart) row.current_period_start = periodStart;
    if (periodEnd) row.current_period_end = periodEnd;
    if (payment?.id) row.last_payment_id = payment.id;

    const { error: upsertError } = await sb
      .from('subscriptions')
      .upsert(row, { onConflict: 'razorpay_subscription_id' });

    if (upsertError) {
      console.error('webhook: upsert failed', upsertError.message);
      await markAudit(false, `upsert failed: ${upsertError.message}`);
      return NextResponse.json({ error: 'db write failed' }, { status: 500 }); // retryable
    }

    await markAudit(true);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('webhook error:', e?.message || e);
    await markAudit(false, String(e?.message || e));
    return NextResponse.json({ error: 'processing failed' }, { status: 500 }); // retryable
  }
}
