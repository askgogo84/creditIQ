import { Metadata } from 'next';
import Link from 'next/link';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'All Credit Cards in India 2026 â€” Compare 93 Cards | CreditIQ',
  description: 'Compare all 93 credit cards in India. HDFC, Axis, SBI, ICICI, Amex, IDFC First and more. Honest reviews, real fees, no affiliate bias. Find the best card for your spends.',
  keywords: 'credit cards India 2026, best credit card India, HDFC credit card, Axis credit card, SBI credit card, compare credit cards India',
  alternates: { canonical: 'https://creditiq.app/cards' },
  openGraph: {
    title: 'All Credit Cards in India 2026 | CreditIQ',
    description: 'Compare 93 credit cards honestly. No affiliate bias.',
    url: 'https://creditiq.app/cards',
  },
};

const BANKS = ['All', 'HDFC', 'Axis', 'SBI', 'ICICI', 'Amex', 'IDFC First', 'Kotak', 'AU', 'Yes Bank', 'RBL'];
const CATEGORIES = ['All', 'travel', 'cashback', 'rewards', 'premium', 'dining', 'fuel', 'shopping'];

export default function CardsIndexPage() {
  const cards = SEED_CARDS;
  const totalCards = cards.length;

  // Group by bank for structured display
  const banks = [...new Set(cards.map(c => c.bank))].sort();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Header />

      {/* Hero */}
      <div style={{ backgroundColor: '#1B3A5C', padding: '48px 20px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 12 }}>
            No affiliate bias &nbsp;&bull;&nbsp; Updated May 2026
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#ffffff', margin: '0 0 12px', lineHeight: 1.2 }}>
            All Credit Cards in India 2026
          </h1>
          <p style={{ fontSize: 16, color: '#94a3b8', margin: '0 0 24px', lineHeight: 1.6, maxWidth: 560 }}>
            {totalCards} credit cards from {banks.length} banks â€” honest reviews, real annual fees, actual reward rates. Zero affiliate bias.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
            <Link href="/spend-optimizer" style={{
              padding: '10px 20px', backgroundColor: '#C9972E', color: '#fff',
              borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none',
            }}>Find my best card</Link>
            <Link href="/compare" style={{
              padding: '10px 20px', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff',
              borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>Compare cards side by side</Link>
          </div>
        </div>
      </div>

      {/* Category quick links â€” SEO internal linking */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 20px', overflowX: 'auto' as const }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: 8, flexWrap: 'nowrap' as const, whiteSpace: 'nowrap' as const }}>
          {[
            { href: '/best-cards/travel', label: 'Best Travel Cards' },
            { href: '/best-cards/cashback', label: 'Best Cashback Cards' },
            { href: '/best-cards/dining', label: 'Best Dining Cards' },
            { href: '/best-cards/no-fee', label: 'Lifetime Free Cards' },
            { href: '/best-cards/premium', label: 'Premium Cards' },
            { href: '/best-cards/fuel', label: 'Best Fuel Cards' },
            { href: '/best-cards/shopping', label: 'Best Shopping Cards' },
            { href: '/best-cards/beginners', label: 'Cards for Beginners' },
          ].map((cat, i) => (
            <Link key={i} href={cat.href} style={{
              padding: '7px 14px', backgroundColor: '#f1f5f9', color: '#1B3A5C',
              borderRadius: 100, fontSize: 13, fontWeight: 600, textDecoration: 'none',
              border: '1px solid #e2e8f0', flexShrink: 0,
            }}>{cat.label}</Link>
          ))}
        </div>
      </div>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
          {[
            { value: `${totalCards}+`, label: 'Cards reviewed' },
            { value: `${banks.length}`, label: 'Banks covered' },
            { value: '0%', label: 'Affiliate bias' },
            { value: 'May 2026', label: 'Last updated' },
          ].map((stat, i) => (
            <div key={i} style={{
              backgroundColor: '#fff', borderRadius: 12, padding: '16px 20px',
              border: '1px solid #e2e8f0', textAlign: 'center' as const,
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1B3A5C' }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Cards by bank */}
        {banks.map(bank => {
          const bankCards = cards.filter(c => c.bank === bank);
          return (
            <div key={bank} style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1B3A5C', margin: 0 }}>
                  {bank} Credit Cards
                </h2>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>{bankCards.length} cards</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {bankCards.map(card => {
                  const annualFee = (card as any).annual_fee_inr ?? 0;
                  const tier = (card as any).tier ?? 'standard';
                  const cats = Array.isArray(card.category) ? card.category : [(card as any).category ?? 'rewards'];

                  return (
                    <Link key={card.id} href={`/cards/${card.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        backgroundColor: '#fff', borderRadius: 14, border: '1px solid #e2e8f0',
                        padding: '18px 20px', transition: 'box-shadow 0.2s',
                        cursor: 'pointer',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', lineHeight: 1.3, flex: 1, marginRight: 8 }}>
                            {card.name}
                          </div>
                          {tier === 'super-premium' && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#C9972E', backgroundColor: '#fef3c7', padding: '2px 8px', borderRadius: 100, flexShrink: 0 }}>
                              PREMIUM
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' as const }}>
                          {cats.slice(0, 2).map((cat: string, j: number) => (
                            <span key={j} style={{
                              fontSize: 11, color: '#1B3A5C', backgroundColor: '#eff6ff',
                              padding: '2px 8px', borderRadius: 100, textTransform: 'capitalize' as const,
                            }}>{cat}</span>
                          ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: annualFee === 0 ? '#16a34a' : '#1e293b' }}>
                              {annualFee === 0 ? 'Lifetime Free' : `Rs. ${annualFee.toLocaleString('en-IN')}/yr`}
                            </div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>Annual fee</div>
                          </div>
                          <div style={{
                            fontSize: 13, fontWeight: 600, color: '#1B3A5C',
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}>
                            View review &rarr;
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Bottom CTA */}
        <div style={{ backgroundColor: '#1B3A5C', borderRadius: 16, padding: '32px', textAlign: 'center' as const, marginTop: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 10px' }}>
            Not sure which card to pick?
          </h2>
          <p style={{ fontSize: 15, color: '#94a3b8', margin: '0 0 20px', lineHeight: 1.6 }}>
            Tell us your monthly spends â€” our AI analyzes all {totalCards} cards and shows exactly how much each earns you.
          </p>
          <Link href="/spend-optimizer" style={{
            display: 'inline-block', padding: '13px 28px', backgroundColor: '#C9972E',
            color: '#fff', borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none',
          }}>
            Find My Best Card â€” Free
          </Link>
        </div>
      </main>
    </div>
  );
}

