import { Metadata } from 'next';
import Link from 'next/link';
import { SlidersHorizontal, Sparkles } from 'lucide-react';
import { CardsClient } from './CardsClient';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 300; // revalidate every 5 mins

export const metadata: Metadata = {
  title: 'Every credit card we track in India, ranked by what it earns | CreditIQ',
  description: 'Ranked by what each card actually earns at your spend — real reward rates, fees and live devaluations, with zero affiliate bias. HDFC, Axis, SBI, ICICI, Amex, IDFC First and more.',
  keywords: 'credit cards India 2026, best credit card India, HDFC credit card, Axis credit card, SBI credit card, compare credit cards India',
  alternates: { canonical: 'https://creditiq.app/cards' },
  openGraph: {
    title: 'Every card we track, ranked by what it earns you | CreditIQ',
    description: 'Ranked by what each card actually earns — with zero affiliate bias.',
    url: 'https://creditiq.app/cards',
  },
};

async function getCards() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('active', true)
      .order('iq_score', { ascending: false });
    if (!error && data && data.length > 0) return data;
  } catch (e) {}
  // fallback to seed
  const { SEED_CARDS } = await import('@/lib/data/seed-cards');
  return SEED_CARDS.filter((c: any) => c.active !== false);
}

export default async function CardsIndexPage() {
  const cards = await getCards();
  const totalCards = cards.length;
  const banks = [...new Set(cards.map((c: any) => c.bank))].sort();

  return (
    <main className="ciq-approved-cards">
      <header className="approved-page-header">
        <div><span className="approved-eyebrow">Find your next card</span><h1>Card Explorer</h1><p>Compare real rewards, fees and benefits for how you actually spend.</p></div>
        <Link className="approved-secondary" href="/profile"><SlidersHorizontal size={15} /> My preferences</Link>
      </header>
      <section className="approved-card-finder">
        <div><span className="approved-section-kicker">AI card finder</span><h2>What matters most to you?</h2></div>
        <div className="approved-finder-chips"><span className="active">Travel rewards</span><span>Cashback</span><span>Lounge access</span><span>Low fees</span><span>Business spend</span></div>
        <Link className="approved-primary" href="/smart-match"><Sparkles size={15} /> Find my matches</Link>
      </section>
      <div className="approved-card-count"><b>{totalCards} cards tracked</b><span>{banks.length} banks · original artwork · transparent fees</span></div>
      <CardsClient initialCards={cards} />
    </main>
  );
}
