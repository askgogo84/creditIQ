import { Metadata } from 'next';
import { PageHeader } from '@/components/ciq/PageHeader';
import { CopperCTA, GhostCTA } from '@/components/design/CTAs';
import { DesignFooter } from '@/components/design/Footer';
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
    <div className="ciq-product-page">
      {/* Panel-only: the (cards) layout owns the "Cards" name + SectionTabs strip. A
          left-aligned PageHeader replaces the centred marketing hero (aurora dropped) so the
          catalogue is reachable in ~one screen at 375px. H1 wording unchanged; "ranked
          honestly." is roman copper emphasis (DESIGN.md — never italic). The two acquisition
          CTAs stay, left-aligned — they're the page's job. Metadata/OG untouched. */}
      <PageHeader
        eyebrow={`Card intelligence · ${totalCards} cards · ${banks.length} banks`}
        title={<>Find the card that fits <span style={{ color: 'var(--copper)' }}>your life.</span></>}
        subtitle="Explore real Indian cards with original artwork, transparent fees and practical reward context. No bank pays to move up the list."
        maxWidth={1100}
        showTabs={false}
      />
      <div style={{ marginTop: 20, display: 'flex', gap: 14, flexWrap: 'wrap' }} className="stack-mobile">
        <CopperCTA href="/smart-match">Find my perfect card</CopperCTA>
        <GhostCTA href="/compare">Compare side by side</GhostCTA>
      </div>

      {/* CARDS GRID */}
      <CardsClient initialCards={cards} />

      <DesignFooter />
    </div>
  );
}
