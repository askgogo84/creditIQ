import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { SectionHeader } from '@/components/design/SectionHeader';
import { CopperCTA, GhostCTA } from '@/components/design/CTAs';
import { DesignFooter } from '@/components/design/Footer';
import { CardsClient } from './CardsClient';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 300; // revalidate every 5 mins

export const metadata: Metadata = {
  title: 'All Credit Cards in India 2026 -- Compare 170+ cards | CreditIQ',
  description: 'Compare all 170+ credit cards in India. HDFC, Axis, SBI, ICICI, Amex, IDFC First and more. Honest reviews, real fees, no affiliate bias. Find the best card for your spends.',
  keywords: 'credit cards India 2026, best credit card India, HDFC credit card, Axis credit card, SBI credit card, compare credit cards India',
  alternates: { canonical: 'https://creditiq.app/cards' },
  openGraph: {
    title: 'All Credit Cards in India 2026 | CreditIQ',
    description: 'Compare 170+ credit cards honestly. No affiliate bias.',
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
    <>
      <Header />
      <div className="page-fade">
        {/* HERO */}
        <section style={{ position: 'relative', paddingTop: 'clamp(120px, 18vw, 160px)' }}>
          <div className="aurora" style={{ top: -120, right: -100, width: 540, height: 540,
            background: 'radial-gradient(circle, rgba(212,163,115,0.55), transparent 60%)' }} />
          <div className="shell" style={{ position: 'relative', zIndex: 2, paddingBottom: 8 }}>
            <SectionHeader
              label={`THE FULL CATALOG . ${totalCards} CARDS . ${banks.length} BANKS`}
              title={<>Every card in India,<br /><em>ranked honestly.</em></>}
              subtitle="Real annual value, live devaluation tracking and IQ scores for all cards. No affiliate bias -- no bank pays us to move a card up the list."
            />
            <div style={{ marginTop: 32, display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }} className="stack-mobile">
              <CopperCTA href="/smart-match">Find my perfect card</CopperCTA>
              <GhostCTA href="/compare">Compare side by side</GhostCTA>
            </div>
          </div>
        </section>

        {/* CARDS GRID */}
        <CardsClient initialCards={cards} />

        <DesignFooter />
      </div>
    </>
  );
}
