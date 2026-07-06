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
