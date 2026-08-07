import { Metadata } from 'next';
import { SectionHeader } from '@/components/design/SectionHeader';
import { CopperCTA, GhostCTA } from '@/components/design/CTAs';
import { DesignFooter } from '@/components/design/Footer';
import { CardsClient } from './CardsClient';
import { SectionTabs } from '@/components/ciq/SectionTabs';
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
    <>
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
            <SectionTabs />
          </div>
        </section>

        {/* CARDS GRID */}
        <CardsClient initialCards={cards} />

        <DesignFooter />
      </div>
    </>
  );
}
