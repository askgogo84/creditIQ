// app/api/admin/check-services/route.ts
// Probes the services we can check without guessing, upserts results into service_monitors.
// Omits renews_on/notes from the upsert so any manually-set values survive.
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function httpProbe(url: string, opts: RequestInit, detectPaused = false) {
  try {
    const r = await fetch(url, { ...opts, signal: AbortSignal.timeout(8000) });
    if (detectPaused) {
      const t = await r.text().catch(() => '');
      if (/temporarily paused/i.test(t)) return { status: 'paused', detail: { httpStatus: r.status } };
    }
    return { status: r.ok ? 'up' : 'down', detail: { httpStatus: r.status } };
  } catch (e: any) {
    return { status: 'down', detail: { error: e?.message || 'fetch failed' } };
  }
}

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req); if (denied) return denied;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const apifyToken = process.env.APIFY_TOKEN;
  if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });

  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(supabaseUrl, serviceKey);
  const now = new Date().toISOString();
  const probed: any[] = [];

  // 1. Supabase REST liveness
  {
    const p = await httpProbe(`${supabaseUrl}/rest/v1/`, { headers: { apikey: serviceKey } });
    probed.push({ id: 'supabase', name: 'Supabase (cardiq)', category: 'infra', check_type: 'http', ...p });
  }
  // 2. Vercel / live site — detects the "temporarily paused" page directly
  {
    const p = await httpProbe('https://creditiq.app', {}, true);
    probed.push({ id: 'vercel', name: 'Vercel (creditiq.app)', category: 'infra', check_type: 'http', ...p });
  }
  // 3. Apify — real usage via users/me
  if (apifyToken) {
    try {
      const r = await fetch(`https://api.apify.com/v2/users/me`, { headers: { Authorization: `Bearer ${apifyToken}` }, signal: AbortSignal.timeout(8000) });
      if (r.ok) {
        const d = await r.json();
        probed.push({ id: 'apify', name: 'Apify', category: 'scraper', check_type: 'usage', status: 'up', detail: { plan: d?.data?.plan?.id ?? null, usageCycle: d?.data?.monthlyUsageCycle ?? null } });
      } else {
        probed.push({ id: 'apify', name: 'Apify', category: 'scraper', check_type: 'usage', status: 'down', detail: { httpStatus: r.status } });
      }
    } catch (e: any) {
      probed.push({ id: 'apify', name: 'Apify', category: 'scraper', check_type: 'usage', status: 'down', detail: { error: e?.message } });
    }
  }
  // 4. Key-presence checks (no external call) — env names we already use
  for (const [id, name, env] of [
    ['anthropic', 'Anthropic (Claude)', 'ANTHROPIC_API_KEY'],
    ['openai', 'OpenAI (embeddings)', 'OPENAI_API_KEY'],
  ] as [string, string, string][]) {
    probed.push({ id, name, category: 'api', check_type: 'key', status: process.env[env] ? 'configured' : 'missing', detail: { env } });
  }

  // Upsert probed rows — NOTE: renews_on / notes intentionally omitted so manual values are preserved.
  for (const r of probed) {
    await sb.from('service_monitors').upsert(
      { id: r.id, name: r.name, category: r.category, check_type: r.check_type, status: r.status, detail: r.detail ?? {}, last_checked: now, updated_at: now },
      { onConflict: 'id' }
    );
  }

  // Manual-only services: define them once (so they appear) but never overwrite an existing row.
  for (const [id, name, category] of [
    ['resend', 'Resend (email)', 'api'],
    ['seatsaero', 'Seats.aero', 'api'],
    ['travelpay', 'Travelpayouts', 'affiliate'],
    ['earnkaro', 'EarnKaro', 'affiliate'],
  ] as [string, string, string][]) {
    const { data: exists } = await sb.from('service_monitors').select('id').eq('id', id).limit(1);
    if (!exists?.length) {
      await sb.from('service_monitors').insert({ id, name, category, check_type: 'manual', status: 'unknown', detail: {}, notes: 'Set renews_on manually', updated_at: now });
    }
  }

  return NextResponse.json({ ok: true, checked: probed.length, message: `Probed ${probed.length} services; manual defs ensured` });
}
