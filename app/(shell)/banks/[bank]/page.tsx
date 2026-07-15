import { SEED_CARDS } from '@/lib/data/seed-cards';
import { DesignFooter } from '@/components/design/Footer';
import { Reveal } from '@/components/design/Reveal';
import { CardTile } from '@/components/design/CardTile';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

const BANK_META: Record<string, { name: string; color: string; desc: string }> = {
  HDFC:     { name: 'HDFC Bank', color: '#004C8F', desc: "India's largest private bank. Known for Infinia, Regalia Gold, and the SmartBuy rewards portal." },
  SBI:      { name: 'State Bank of India', color: '#2C4C9C', desc: "India's largest public sector bank. Offers cashback, travel, and co-branded cards." },
  ICICI:    { name: 'ICICI Bank', color: '#F58220', desc: "Leading private bank known for Amazon Pay ICICI, Emeralde Private Metal, and PAYBACK rewards." },
  Axis:     { name: 'Axis Bank', color: '#97144D', desc: "Known for Magnus, Atlas, and the EDGE Miles transfer programme to airline partners." },
  Kotak:    { name: 'Kotak Mahindra Bank', color: '#EF3E23', desc: "Offers 811, White Reserve, and co-branded cards with competitive reward rates." },
  AmEx:     { name: 'American Express', color: '#006FCF', desc: "Premium cards with Membership Rewards that transfer to airline and hotel partners." },
  IDFC:     { name: 'IDFC FIRST Bank', color: '#9B0C2C', desc: "Known for zero annual fee cards, 0% forex on Wealth, and competitive reward rates." },
  RBL:      { name: 'RBL Bank', color: '#1D4ED8', desc: "Offers co-branded and travel-focused cards with World Safari for frequent travellers." },
  Yes:      { name: 'YES Bank', color: '#0C2461', desc: "Known for YES Marquee and zero forex markup on select cards." },
  IndusInd: { name: 'IndusInd Bank', color: '#312E81', desc: "Premium Iconia, Legend, and EazyDiner co-branded dining cards." },
  SC:       { name: 'Standard Chartered', color: '#0473EA', desc: "Ultimate and Live+ cards with strong dining and cashback rewards." },
  AU:       { name: 'AU Small Finance Bank', color: '#7C2D12', desc: "Altura and Zenith cards offering competitive rewards at lower fee tiers." },
};

const VARIANT_MAP: Record<string, any> = {
  HDFC: 'obsidian', AXIS: 'plum', SBI: 'gold', ICICI: 'navy', AMEX: 'iris', IDFC: 'mint',
};
const VARIANT_ROTATION = ['obsidian', 'navy', 'plum', 'gold', 'iris', 'mint'] as const;

function toTileCard(c: any, i: number) {
  const bank = (c.bank || '').toUpperCase();
  return {
    bank, name: (c.name || '').replace(/^HDFC\s+|^AXIS\s+|^ICICI\s+|^SBI\s+/i, '').replace(/ Credit Card$/i, ''),
    tagline: c.tier || 'Standard', tier: (c.tier || 'CARD').toUpperCase().replace(/-/g, ' '),
    network: 'VISA', variant: VARIANT_ROTATION[i % VARIANT_ROTATION.length],
    tags: (c.category || []).slice(0, 2).map((s: string) => s.replace(/-/g, ' ')),
    fee: c.annual_fee_inr || 0, iqScore: Math.round((c.expert_rating ?? 8) * 10),
  };
}

export function generateStaticParams() {
  return Object.keys(BANK_META).map(bank => ({ bank }));
}

export async function generateMetadata({ params }: { params: { bank: string } }): Promise<Metadata> {
  const meta = BANK_META[params.bank];
  if (!meta) return { title: 'Bank Not Found | CreditIQ' };
  return {
    title: `${meta.name} Credit Cards 2026 | CreditIQ`,
    description: `All ${meta.name} credit cards ranked by value. ${meta.desc}`,
  };
}

export default function BankPage({ params }: { params: { bank: string } }) {
  const meta = BANK_META[params.bank];
  if (!meta) notFound();

  const cards = SEED_CARDS.filter(c => c.bank === params.bank && c.active);

  return (
    <>
      <div className="page-fade">
        <section style={{ position: 'relative', paddingTop: 'clamp(120px,18vw,150px)', paddingBottom: 48 }}>
          <div className="aurora" style={{ top: -80, left: -80, width: 500, height: 400, background: `radial-gradient(circle,${meta.color}25,transparent 60%)` }} />
          <div className="aurora" style={{ top: -60, right: -100, width: 600, height: 500, background: 'radial-gradient(circle,rgba(212,163,115,0.18),transparent 60%)' }} />
          <div className="shell" style={{ position: 'relative', zIndex: 2 }}>
            <Reveal>
              <Link href="/banks" style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, color: 'var(--ink-3,#5A6A8A)', textDecoration: 'none', marginBottom: 24, display: 'inline-block', fontWeight: 600 }}>← All banks</Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16, flexShrink: 0, background: meta.color }}>
                  {params.bank.slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', fontWeight: 700, marginBottom: 4 }}>{cards.length} cards tracked</div>
                  <h1 style={{ fontSize: 'clamp(28px,4vw,56px)', fontWeight: 800, color: 'var(--ink,#142950)', lineHeight: 1.05, letterSpacing: '-0.03em', margin: 0 }}>{meta.name}</h1>
                </div>
              </div>
              <p style={{ fontSize: 15, color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.7, margin: 0, maxWidth: 560 }}>{meta.desc}</p>
            </Reveal>
          </div>
        </section>

        <section style={{ paddingBottom: 80 }}>
          <div className="shell">
            {cards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--paper,#FAF5EB)', borderRadius: 20, border: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
                <p style={{ color: 'var(--ink-3,#5A6A8A)', fontSize: 15 }}>No cards tracked for this bank yet.</p>
                <Link href="/cards" style={{ color: 'var(--copper,#8C5F12)', fontWeight: 700, textDecoration: 'none' }}>Browse all cards →</Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
                {cards.map((card, i) => (
                  <Reveal key={card.id} style={{ animationDelay: `${i * 50}ms` }}>
                    <CardTile card={toTileCard(card, i)} href={`/card/${card.slug}`} rank={i + 1} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </section>

        <DesignFooter />
      </div>
    </>
  );
}
