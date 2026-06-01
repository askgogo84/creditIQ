import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SEED_CARDS } from '@/lib/data/seed-cards';

export const runtime = 'nodejs';
export const revalidate = 0; // Cache 5 minutes

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('active', true)
        .order('iq_score', { ascending: false });

      if (!error && data && data.length > 0) {
        return NextResponse.json({ cards: data, source: 'supabase', count: data.length });
      }
    }

    // Fallback to seed cards
    const active = SEED_CARDS.filter((c: any) => c.active !== false);
    return NextResponse.json({ cards: active, source: 'seed', count: active.length });
  } catch (err) {
    const active = SEED_CARDS.filter((c: any) => c.active !== false);
    return NextResponse.json({ cards: active, source: 'seed-fallback', count: active.length });
  }
}
