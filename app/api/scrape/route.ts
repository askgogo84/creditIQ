import { NextRequest, NextResponse } from 'next/server';
import { runScrapers } from '@/lib/scrapers';
import { parseScrapedCard } from '@/lib/scrapers/parser';
import { createClient } from '@supabase/supabase-js';

// Vercel cron will call this weekly
export const maxDuration = 300; // 5 min  --  adjust if using Hobby (60s max)

export async function GET(req: NextRequest) {
  // Auth: Vercel cron sends Authorization: Bearer ${CRON_SECRET}
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return runScrape();
}

export async function POST(req: NextRequest) {
  // Manual trigger from admin panel  --  requires admin session
  // (In production, add stricter check)
  const url = new URL(req.url);
  const bank = url.searchParams.get('bank');
  const banks = bank && bank !== 'all' ? [bank] : undefined;

  return runScrape(banks);
}

async function runScrape(banks?: string[]) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json(
      { error: 'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.' },
      { status: 500 }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const scrapes = await runScrapers(banks);
    let parsed = 0;
    let saved = 0;

    for (const scrape of scrapes) {
      if (scrape.error) continue;
      const card = await parseScrapedCard(scrape);
      if (!card || !card.slug) continue;
      parsed++;

      // Upsert into Supabase
      const { error } = await supabase
        .from('cards')
        .upsert(card, { onConflict: 'slug' });
      if (!error) saved++;
    }

    return NextResponse.json({
      message: `Scraped ${scrapes.length} pages, parsed ${parsed}, saved ${saved}`,
      stats: { scraped: scrapes.length, parsed, saved },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
