import { NextRequest, NextResponse } from 'next/server';
import { runScrapers } from '@/lib/scrapers';
import { parseScrapedCard } from '@/lib/scrapers/parser';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Respond immediately — cron-job.org only waits 30s
  // The actual scraping runs async after response is sent
  const ctx = (req as any)[Symbol.for('next.request.context')];
  if (ctx?.waitUntil) {
    ctx.waitUntil(runScrapeBackground());
  } else {
    // Fallback: fire and forget
    runScrapeBackground().catch(console.error);
  }

  return NextResponse.json({
    message: 'Scrape job started in background',
    started_at: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const bank = url.searchParams.get('bank');
  const banks = bank && bank !== 'all' ? [bank] : undefined;

  // For POST (manual admin trigger), also respond immediately
  runScrapeBackground(banks).catch(console.error);

  return NextResponse.json({
    message: `Scrape started for: ${banks?.join(', ') || 'all banks'}`,
    started_at: new Date().toISOString(),
  });
}

async function runScrapeBackground(banks?: string[]) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const scrapes = await runScrapers(banks);
    let parsed = 0, saved = 0;

    for (const scrape of scrapes) {
      if (scrape.error) continue;
      const card = await parseScrapedCard(scrape);
      if (!card || !card.slug) continue;
      parsed++;
      const { error } = await supabase.from('cards').upsert(card, { onConflict: 'slug' });
      if (!error) saved++;
    }

    // Log result to Supabase for monitoring
    await supabase.from('cron_logs').insert({
      job: 'scrape',
      result: { scraped: scrapes.length, parsed, saved },
      ran_at: new Date().toISOString(),
    })

    console.log(`Scrape complete: ${scrapes.length} pages, ${parsed} parsed, ${saved} saved`);
  } catch (e: any) {
    console.error('Scrape error:', e.message);
    await supabase.from('cron_logs').insert({
      job: 'scrape',
      result: { error: e.message },
      ran_at: new Date().toISOString(),
    })
  }
}
