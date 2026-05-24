import { notFound } from 'next/navigation';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CompareTray } from '@/components/CompareTray';
import { CardTile } from '@/components/CardTile';
import type { Bank } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const BANK_INFO: Record<string, { name: string; desc: string; color: string; founded: string; hq: string; cards_issued: string }> = {
  HDFC:     { name: 'HDFC Bank', desc: 'India\'s largest private sector bank with the widest credit card portfolio.', color: '#004C8F', founded: '1994', hq: 'Mumbai', cards_issued: '2Cr+' },
  SBI:      { name: 'State Bank of India', desc: 'India\'s largest public sector bank. SBI Cards is a separate listed entity.', color: '#2C4C9C', founded: '1955', hq: 'Mumbai', cards_issued: '1.8Cr+' },
  ICICI:    { name: 'ICICI Bank', desc: 'Second largest private bank in India with a strong credit card portfolio.', color: '#F58220', founded: '1994', hq: 'Mumbai', cards_issued: '1.5Cr+' },
  Axis:     { name: 'Axis Bank', desc: 'Third largest private bank known for EDGE rewards and Magnus card.', color: '#97144D', founded: '1993', hq: 'Mumbai', cards_issued: '1.2Cr+' },
  Kotak:    { name: 'Kotak Mahindra Bank', desc: 'Known for 811 digital banking and lifetime-free credit cards.', color: '#EF3E23', founded: '1985', hq: 'Mumbai', cards_issued: '40L+' },
  AmEx:     { name: 'American Express', desc: 'Premium card issuer known for Membership Rewards and travel benefits.', color: '#006FCF', founded: '1850', hq: 'New York (India ops: Gurgaon)', cards_issued: '15L+' },
  IDFC:     { name: 'IDFC FIRST Bank', desc: 'Known for lifetime-free cards and industry-low forex markup.', color: '#9B0C2C', founded: '2015', hq: 'Mumbai', cards_issued: '20L+' },
  RBL:      { name: 'RBL Bank', desc: 'Strong in co-branded and lifestyle credit cards.', color: '#1D4ED8', founded: '1943', hq: 'Mumbai', cards_issued: '15L+' },
  Yes:      { name: 'YES Bank', desc: 'Known for Marquee and First Preferred premium cards.', color: '#0C2461', founded: '2004', hq: 'Mumbai', cards_issued: '12L+' },
  IndusInd: { name: 'IndusInd Bank', desc: 'Premium banking with Pinnacle and Celesta super-premium cards.', color: '#312E81', founded: '1994', hq: 'Pune', cards_issued: '10L+' },
  SC:       { name: 'Standard Chartered', desc: 'Known for Ultimate card with 3.33% flat cashback.', color: '#0473EA', founded: '1969', hq: 'London (India ops: Mumbai)', cards_issued: '8L+' },
  AU:       { name: 'AU Small Finance Bank', desc: 'Fastest-growing card issuer with Zenith and LIT cards.', color: '#7C2D12', founded: '1996', hq: 'Jaipur', cards_issued: '8L+' },
};

export async function generateStaticParams() {
  return Object.keys(BANK_INFO).map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const bank = BANK_INFO[params.slug];
  if (!bank) return { title: 'Bank not found . CardIQ' };
  return { title: `${bank.name} Credit Cards . CardIQ`, description: bank.desc };
}

export default function BankPage({ params }: { params: { slug: string } }) {
  const bank = BANK_INFO[params.slug];
  if (!bank) notFound();

  const cards = SEED_CARDS.filter(c => c.bank === params.slug && c.active)
    .sort((a, b) => (b.expert_rating ?? 0) - (a.expert_rating ?? 0));

  return (
    <main className="min-h-screen">
      <Header />
      <section className="pt-28 pb-12 grain relative" style={{ overflow: 'hidden' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 30% 50%, ${bank.color}20 0%, transparent 60%)` }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Link href="/banks" className="inline-flex items-center gap-2 text-sm text-ink-400 hover:text-copper-400 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All banks
          </Link>
          <div className="flex items-start gap-6">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0" style={{ background: bank.color }}>
              {params.slug.slice(0, 2)}
            </div>
            <div>
              <h1 className="font-display text-4xl sm:text-5xl text-ink-50 leading-tight">{bank.name}</h1>
              <p className="text-ink-300 mt-2 max-w-2xl">{bank.desc}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            {[
              { l: 'Founded', v: bank.founded },
              { l: 'Headquarters', v: bank.hq },
              { l: 'Cards issued', v: bank.cards_issued },
              { l: 'Cards on CardIQ', v: `${cards.length}` },
            ].map(s => (
              <div key={s.l} className="bg-ink-900/40 border border-white/10 rounded-lg p-3">
                <div className="text-[10px] font-mono uppercase tracking-widest text-ink-400">{s.l}</div>
                <div className="font-display text-xl text-ink-50 mt-1">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="divider-rule mb-8 max-w-xs">-- {cards.length} cards tracked</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {cards.map((card, i) => <CardTile key={card.id} card={card} rank={i + 1} />)}
          </div>
          {cards.length === 0 && (
            <div className="text-center py-20 text-ink-400 font-display italic">No cards tracked yet for this bank.</div>
          )}
        </div>
      </section>
      <Footer />
      <CompareTray />
    </main>
  );
}
