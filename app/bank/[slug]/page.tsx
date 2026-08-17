import { notFound } from 'next/navigation';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import { CardTile } from '@/components/design/CardTile'
import { type CardVariant } from '@/components/design/CreditCard3D'
import type { CreditCard } from '@/lib/types'

const VARIANT_ROTATION: CardVariant[] = ['obsidian', 'navy', 'plum', 'gold', 'iris', 'mint']
const NETWORK_BY_BANK: Record<string, string> = { HDFC: 'VISA', AXIS: 'MASTERCARD', ICICI: 'AMEX', SBI: 'VISA', AMEX: 'AMEX', IDFC: 'VISA', RBL: 'MASTERCARD' }
function toTileCard(c: CreditCard, i: number) {
  const bank = c.bank.toUpperCase()
  return { slug: c.slug, color: c.color, bank, name: c.name.replace(/^HDFC\s+|^AXIS\s+|^ICICI\s+|^SBI\s+|^AMEX\s+/i, '').replace(/ Credit Card$/i, ''), tagline: c.tier || 'Standard', tier: (c.tier || 'CARD').toUpperCase().replace(/-/g, ' '), network: NETWORK_BY_BANK[bank.split(' ')[0]] || 'VISA', variant: VARIANT_ROTATION[i % VARIANT_ROTATION.length], tags: (c.category || []).slice(0, 2).map((s: string) => s.replace(/-/g, ' ')), fee: c.annual_fee_inr, iqScore: c.expert_rating ?? 8 }
};
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
  if (!bank) return { title: 'Bank not found . CreditIQ' };
  return { title: `${bank.name} Credit Cards . CreditIQ`, description: bank.desc };
}

export default function BankPage({ params }: { params: { slug: string } }) {
  const bank = BANK_INFO[params.slug];
  if (!bank) notFound();

  const cards = SEED_CARDS.filter(c => c.bank === params.slug && c.active)
    .sort((a, b) => (b.expert_rating ?? 0) - (a.expert_rating ?? 0));

  return (
    <main className="min-h-screen">
      <Header />
      <section className="pt-28 pb-12 relative" style={{ overflow: 'hidden' }}>
        {/* Copper aurora — same hero glow as the sibling light pages (/banks, /glossary). */}
        <div className="aurora" style={{ top: -80, right: -100, width: 600, height: 500, background: 'radial-gradient(circle,rgba(212,163,115,0.22),transparent 60%)' }} />
        {/* Subtle per-bank brand tint, layered UNDER the copper aurora and dialled down
            for the light ground (was bank.color@0x20/12.5% on a dark ground — a smudge on cream). */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 28% 45%, ${bank.color}14 0%, transparent 52%)` }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Link href="/banks" className="inline-flex items-center gap-2 text-sm mb-6 transition-colors" style={{ color: 'var(--ink-3)' }}>
            <ArrowLeft className="w-4 h-4" /> All banks
          </Link>
          <div className="flex items-start gap-6">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0" style={{ background: bank.color }}>
              {params.slug.slice(0, 2)}
            </div>
            <div>
              <h1 className="font-display text-4xl sm:text-5xl leading-tight" style={{ color: 'var(--ink)' }}>{bank.name}</h1>
              <p className="mt-2 max-w-2xl" style={{ color: 'var(--ink-2)' }}>{bank.desc}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            {[
              { l: 'Founded', v: bank.founded },
              { l: 'Headquarters', v: bank.hq },
              { l: 'Cards issued', v: bank.cards_issued },
              { l: 'Cards on CreditIQ', v: `${cards.length}` },
            ].map(s => (
              <div key={s.l} className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
                <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--ink-3)' }}>{s.l}</div>
                <div className="font-display text-xl mt-1" style={{ color: 'var(--ink)' }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-8" style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{cards.length} cards tracked</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {cards.map((card, i) => <CardTile key={card.id} card={toTileCard(card, i)} rank={i + 1} href={`/card/${card.slug}`} scoreLabel="Our rating" scoreMax={10} />)}
          </div>
          {cards.length === 0 && (
            <div className="text-center py-20 font-display italic" style={{ color: 'var(--ink-3)' }}>No cards tracked yet for this bank.</div>
          )}
        </div>
      </section>
      <DesignFooter />
      
    </main>
  );
}
