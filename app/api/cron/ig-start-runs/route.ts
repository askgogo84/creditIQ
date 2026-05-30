// app/api/cron/ig-start-runs/route.ts
// Step 1: Start Apify runs for all handles, save run IDs to Supabase
// Runs in < 5 seconds, no timeout

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const TARGET_HANDLES = [
  'creditcardtalks',
  'everypaisamatters',
  'thegreatindianmiles',
  'the.financial.boss',
  'cashoverflow.in',
];

const APIFY_BASE = 'https://api.apify.com/v2';
const APIFY_ACTOR = 'apify~instagram-scraper';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apifyToken = process.env.APIFY_TOKEN;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apifyToken || !supabaseUrl || !supabaseKey) return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });

  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(supabaseUrl, supabaseKey);

  const runIds: Record<string, string> = {};
  const errors: string[] = [];

  for (const handle of TARGET_HANDLES) {
    try {
      const res = await fetch(`${APIFY_BASE}/acts/${APIFY_ACTOR}/runs?token=${apifyToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directUrls: [`https://www.instagram.com/${handle}/`],
          resultsType: 'posts',
          resultsLimit: 20,
        }),
      });
      if (!res.ok) { errors.push(`${handle}: HTTP ${res.status}`); continue; }
      const data = await res.json();
      const runId = data.data?.id;
      if (runId) runIds[handle] = runId;
    } catch (e: any) { errors.push(`${handle}: ${e.message}`); }
  }

  // Save run IDs to Supabase for step 2 to pick up
  await sb.from('ig_pending_runs').insert({
    run_ids: runIds,
    started_at: new Date().toISOString(),
    status: 'pending',
  });

  await sb.from('cron_logs').insert({
    job_name: 'ig-start-runs',
    status: errors.length === 0 ? 'success' : 'partial',
    details: { runIds, errors },
    ran_at: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, runs_started: Object.keys(runIds).length, runIds, errors });
}
