import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Best Credit Cards in Singapore 2026 | CreditIQ',
  description: 'Compare the best Singapore credit cards — DBS, OCBC, UOB, Citi, Amex. Miles, cashback, dining rewards. Zero affiliate bias.',
};

const SG_CARDS = [
  { id: 'dbs-altitude', name: 'DBS Altitude Visa', bank: 'DBS', annualFee: 192.60, feeWaiver: 'Waived 1st year', network: 'Visa', tier: 'Premium', category: ['travel', 'miles'], baseRate: '1.2 mpd', bonusRate: '3 mpd overseas', lounges: 'Priority Pass (2/yr)', minIncome: 30000, bestFor: 'Miles collectors, frequent flyers', isFree: false, highlight: 'Best entry-level miles card' },
  { id: 'uob-prvi', name: 'UOB PRVI Miles', bank: 'UOB', annualFee: 256.80, feeWaiver: 'Waived 1st year', network: 'Visa/Amex', tier: 'Premium', category: ['travel', 'miles'], baseRate: '1.4 mpd', bonusRate: '2.4 mpd overseas', lounges: 'Included', minIncome: 30000, bestFor: 'High spenders wanting miles', isFree: false, highlight: 'Highest base miles rate' },
  { id: 'ocbc-90n', name: 'OCBC 90°N Card', bank: 'OCBC', annualFee: 0, feeWaiver: 'Lifetime free', network: 'Mastercard', tier: 'Standard', category: ['cashback', 'miles'], baseRate: '1.3 mpd', bonusRate: '2.1 mpd overseas', lounges: 'None', minIncome: 30000, bestFor: 'No-fee miles card', isFree: true, highlight: 'Best free miles card SG' },
  { id: 'citi-prestige-sg', name: 'Citi Prestige Card', bank: 'Citibank', annualFee: 535, feeWaiver: 'No waiver', network: 'Mastercard', tier: 'Ultra Premium', category: ['travel', 'premium'], baseRate: '1.3 mpd', bonusRate: '5 mpd on hotels', lounges: 'Unlimited Priority Pass', minIncome: 120000, bestFor: 'Ultra premium, hotel lovers', isFree: false, highlight: '4th night free on hotels' },
  { id: 'dbs-womens', name: "DBS Woman's World Card", bank: 'DBS', annualFee: 162.18, feeWaiver: 'Waived 1st year', network: 'Mastercard', tier: 'Standard', category: ['cashback', 'shopping'], baseRate: '1 mpd', bonusRate: '10X on online shopping', lounges: 'None', minIncome: 30000, bestFor: 'Online shoppers', isFree: false, highlight: '10X miles on online spend' },
  { id: 'uob-one', name: 'UOB ONE Card', bank: 'UOB', annualFee: 0, feeWaiver: 'Lifetime free', network: 'Visa', tier: 'Standard', category: ['cashback'], baseRate: '3.33% cashback', bonusRate: '5% on UOB EVOL', lounges: 'None', minIncome: 30000, bestFor: 'Cashback seekers', isFree: true, highlight: 'Up to 10% cashback with UOB account' },
  { id: 'amex-sg-platinum', name: 'Amex Platinum Charge', bank: 'American Express', annualFee: 1712, feeWaiver: 'No waiver', network: 'Amex', tier: 'Ultra Premium', category: ['travel', 'premium', 'lifestyle'], baseRate: '1 mpd', bonusRate: '2 mpd on Amex Travel', lounges: 'Unlimited Centurion + Priority Pass', minIncome: 200000, bestFor: 'Premium lifestyle, unlimited lounges', isFree: false, highlight: 'Centurion lounge access globally' },
  { id: 'scb-x-sg', name: 'Standard Chartered X Card', bank: 'Standard Chartered', annualFee: 695.50, feeWaiver: 'Waived 1st year', network: 'Visa', tier: 'Premium', category: ['travel', 'miles'], baseRate: '1.5 mpd', bonusRate: '2 mpd all spend', lounges: 'Priority Pass (2/yr)', minIncome: 80000, bestFor: 'Simplicity + miles', isFree: false, highlight: 'Flat 2 mpd on everything' },
  { id: 'hsbc-revolution', name: 'HSBC Revolution Card', bank: 'HSBC', annualFee: 0, feeWaiver: 'Lifetime free', network: 'Visa', tier: 'Standard', category: ['cashback', 'dining', 'shopping'], baseRate: '1 mpd', bonusRate: '4 mpd dining/shopping/transport', lounges: 'None', minIncome: 30000, bestFor: 'Dining + shopping + free', isFree: true, highlight: 'Best free card for dining' },
  { id: 'ocbc-rewards', name: 'OCBC Rewards Card', bank: 'OCBC', annualFee: 0, feeWaiver: 'Lifetime free', network: 'Visa', tier: 'Standard', category: ['rewards', 'shopping'], baseRate: '0.4 mpd', bonusRate: '4 mpd on shopping', lounges: 'None', minIncome: 30000, bestFor: 'Shopping + no annual fee', isFree: true, highlight: '4 mpd on shopping categories' },
];

const CATEGORIES = [
  { id: 'all', label: 'All Cards' },
  { id: 'miles', label: '✈️ Miles' },
  { id: 'cashback', label: '💰 Cashback' },
  { id: 'premium', label: '👑 Premium' },
  { id: 'free', label: '🎁 No Annual Fee' },
  { id: 'dining', label: '🍽️ Dining' },
];

export default function SingaporePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #08080E)' }}>
      <Header />
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px 100px' }}>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, #1B3A5C, #0d2240)', borderRadius: 20, padding: '40px 36px', marginBottom: 32, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, fontSize: 120, opacity: 0.08 }}>🇸🇬</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
            Singapore · {SG_CARDS.length} Cards · Zero affiliate bias
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 900, color: '#fff', margin: '0 0 12px', letterSpacing: -0.5 }}>
            Best Credit Cards in Singapore 2026
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', margin: '0 0 24px', maxWidth: 520, lineHeight: 1.6 }}>
            DBS, OCBC, UOB, Citi, Amex — compared honestly by miles rate, cashback, lounge access. No bank pays us to rank them.
          </p>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { val: `${SG_CARDS.length}`, lbl: 'Cards reviewed' },
              { val: `${SG_CARDS.filter(c => c.isFree).length}`, lbl: 'Lifetime free' },
              { val: '0%', lbl: 'Affiliate bias' },
              { val: 'SGD', lbl: 'Currency' },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{s.val}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Market note */}
        <div style={{ background: 'rgba(201,151,46,0.08)', border: '1px solid rgba(201,151,46,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
          <strong style={{ color: '#C9972E' }}>🇸🇬 Singapore Miles (mpd)</strong> — Singapore cards use miles per dollar (mpd) instead of reward points. 1 mile ≈ SGD 0.015–0.025 when redeemed for business class flights. KrisFlyer (Singapore Airlines) is the dominant program.
        </div>

        {/* Cards grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SG_CARDS.map((card, i) => (
            <div key={card.id} style={{
              background: 'var(--bg-card, #111118)',
              border: i === 0 ? '1px solid rgba(201,151,46,0.3)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16, padding: '20px 24px',
              boxShadow: i === 0 ? '0 4px 20px rgba(201,151,46,0.08)' : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    {i === 0 && <span style={{ fontSize: 9, fontWeight: 700, color: '#C9972E', background: 'rgba(201,151,46,0.15)', border: '1px solid rgba(201,151,46,0.3)', padding: '2px 8px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: 0.5 }}>Top pick</span>}
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{card.bank}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>·</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{card.network}</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text, #f0f0ff)', marginBottom: 6 }}>{card.name}</div>
                  <div style={{ fontSize: 12, color: '#C9972E', fontWeight: 600, marginBottom: 10 }}>{card.highlight}</div>

                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Base rate</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text, #f0f0ff)' }}>{card.baseRate}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Bonus rate</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#C9972E' }}>{card.bonusRate}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Lounge</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: card.lounges === 'None' ? 'rgba(255,255,255,0.3)' : '#22c55e' }}>{card.lounges}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Min income</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text, #f0f0ff)' }}>SGD {card.minIncome.toLocaleString()}/yr</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {card.category.map((cat, j) => (
                      <span key={j} style={{ fontSize: 11, background: 'rgba(27,58,92,0.5)', color: 'rgba(255,255,255,0.5)', padding: '2px 8px', borderRadius: 100, textTransform: 'capitalize', border: '1px solid rgba(27,58,92,0.8)' }}>{cat}</span>
                    ))}
                  </div>
                </div>

                <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: card.isFree ? '#22c55e' : 'var(--text, #f0f0ff)', marginBottom: 2 }}>
                    {card.isFree ? 'FREE' : `SGD ${card.annualFee}`}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>annual fee</div>
                  {card.feeWaiver && <div style={{ fontSize: 11, color: '#22c55e' }}>{card.feeWaiver}</div>}
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8, marginBottom: 12 }}>{card.bestFor}</div>
                  <div style={{
                    padding: '10px 20px', background: 'linear-gradient(135deg, #C9972E, #E8B84B)',
                    color: '#0a0a0a', borderRadius: 10, fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', textAlign: 'center' as const,
                  }}>Apply Now</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* India vs SG comparison */}
        <div style={{ background: 'var(--bg-card, #111118)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '24px', marginTop: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text, #f0f0ff)', marginBottom: 16 }}>🇮🇳 Indian cards vs 🇸🇬 Singapore cards</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'Reward currency', india: 'Points (Rs. value)', sg: 'Miles (mpd)' },
              { label: 'Best for miles', india: 'HDFC Infinia → KrisFlyer', sg: 'UOB PRVI Miles' },
              { label: 'Free cards', india: 'IDFC First, Scapia', sg: 'OCBC 90°N, UOB ONE' },
              { label: 'Top lounge access', india: 'HDFC Infinia (unlimited)', sg: 'Amex Platinum (Centurion)' },
            ].map((row, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{row.label}</div>
                <div style={{ fontSize: 12, color: '#C9972E', marginBottom: 4 }}>🇮🇳 {row.india}</div>
                <div style={{ fontSize: 12, color: '#22c55e' }}>🇸🇬 {row.sg}</div>
              </div>
            ))}
          </div>
        </div>

        {/* India CTA */}
        <div style={{ textAlign: 'center' as const, marginTop: 24 }}>
          <Link href="/cards" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 28px', background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'var(--text, #f0f0ff)',
            textDecoration: 'none',
          }}>Browse all 93 India cards →</Link>
        </div>

      </main>
      <Footer />
    </div>
  );
}
