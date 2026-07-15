import { SEED_CARDS } from '@/lib/data/seed-cards';
import { DesignFooter } from '@/components/design/Footer';
import { Reveal } from '@/components/design/Reveal';
import Link from 'next/link';

const BANKS = [
  { slug: 'HDFC', name: 'HDFC Bank', color: '#004C8F' },
  { slug: 'SBI', name: 'State Bank of India', color: '#2C4C9C' },
  { slug: 'ICICI', name: 'ICICI Bank', color: '#F58220' },
  { slug: 'Axis', name: 'Axis Bank', color: '#97144D' },
  { slug: 'Kotak', name: 'Kotak Mahindra', color: '#EF3E23' },
  { slug: 'AmEx', name: 'American Express', color: '#006FCF' },
  { slug: 'IDFC', name: 'IDFC FIRST Bank', color: '#9B0C2C' },
  { slug: 'RBL', name: 'RBL Bank', color: '#1D4ED8' },
  { slug: 'Yes', name: 'YES Bank', color: '#0C2461' },
  { slug: 'IndusInd', name: 'IndusInd Bank', color: '#312E81' },
  { slug: 'SC', name: 'Standard Chartered', color: '#0473EA' },
  { slug: 'AU', name: 'AU Small Finance Bank', color: '#7C2D12' },
];

export const metadata = {
  title: 'Credit Cards by Bank India 2026 | CreditIQ',
  description: 'Browse all Indian credit cards by issuing bank. HDFC, SBI, ICICI, Axis, Amex and more — unbiased rankings.',
};

export default function BanksPage() {
  return (
    <>
      <div className="page-fade">
        <section style={{ position: 'relative', paddingTop: 'clamp(120px,18vw,150px)', paddingBottom: 48 }}>
          <div className="aurora" style={{ top: -80, right: -100, width: 600, height: 500, background: 'radial-gradient(circle,rgba(212,163,115,0.22),transparent 60%)' }} />
          <div className="shell" style={{ position: 'relative', zIndex: 2 }}>
            <Reveal>
              <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', fontWeight: 700, marginBottom: 16 }}>Card issuers</div>
              <h1 style={{ fontSize: 'clamp(36px,6vw,80px)', fontWeight: 800, color: 'var(--ink,#142950)', lineHeight: 1.0, letterSpacing: '-0.03em', margin: '0 0 16px' }}>
                All banks{' '}
                <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)', fontStyle: 'italic', fontWeight: 400 }}>& issuers</span>
              </h1>
              <p style={{ fontSize: 'clamp(15px,1.4vw,18px)', color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.65, margin: 0, maxWidth: 480 }}>
                We track {SEED_CARDS.length} cards across {BANKS.length} issuers — with zero bank bias.
              </p>
            </Reveal>
          </div>
        </section>

        <section style={{ paddingBottom: 80 }}>
          <div className="shell">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
              {BANKS.map((bank, i) => {
                const count = SEED_CARDS.filter(c => c.bank === bank.slug && c.active).length;
                return (
                  <Reveal key={bank.slug} style={{ animationDelay: `${i * 40}ms` }}>
                    <Link href={`/bank/${bank.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                      <div style={{ background: 'var(--paper,#FAF5EB)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 18, padding: 20, transition: 'box-shadow 0.2s', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, flexShrink: 0, background: bank.color }}>
                            {bank.slug.slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink,#142950)', letterSpacing: '-0.01em' }}>{bank.name}</div>
                            <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, color: 'var(--ink-3,#5A6A8A)', marginTop: 2 }}>{count} card{count !== 1 ? 's' : ''} tracked</div>
                          </div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, color: 'var(--copper,#8C5F12)', fontWeight: 600 }}>View all cards →</div>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
        <DesignFooter />
      </div>
    </>
  );
}
