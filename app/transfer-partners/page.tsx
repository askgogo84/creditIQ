import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import { Reveal } from '@/components/design/Reveal';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Credit Card Transfer Partners India 2026 | CreditIQ',
  description: 'All airline and hotel transfer partners for Indian credit cards — HDFC, Axis, Amex, HSBC. Ratios, timelines, and best-value transfers verified May 2026.',
};

const PARTNERS = [
  {
    bank: 'HDFC Bank',
    bankColor: '#004C8F',
    cards: ['Infinia', 'Diners Black', 'Regalia Gold (select)'],
    currency: 'Reward Points',
    partners: [
      { name: 'Singapore KrisFlyer', type: 'airline', ratio: '1:1', timeline: '24-48 hours', value: 'Rs.1.6-2.0/pt', sweet_spot: 'DEL-SIN business class for 45,000 miles', rating: 5 },
      { name: 'Turkish Miles&Smiles', type: 'airline', ratio: '1:1', timeline: '24-48 hours', value: 'Rs.1.0-1.5/pt', sweet_spot: 'DEL-IST-NRT J class — fixed zone pricing', rating: 5 },
      { name: 'Marriott Bonvoy', type: 'hotel', ratio: '1:1', timeline: '3-5 days', value: 'Rs.0.8-1.2/pt', sweet_spot: 'Cat 1-4 India hotels — 7,500-25,000 pts', rating: 4 },
      { name: 'Air France KLM Flying Blue', type: 'airline', ratio: '1:1', timeline: '24-48 hours', value: 'Rs.0.8-1.2/pt', sweet_spot: 'India-Europe via CDG/AMS promo awards', rating: 3 },
      { name: 'InterMiles', type: 'airline', ratio: '1:1', timeline: '24 hours', value: 'Rs.0.5-0.8/pt', sweet_spot: 'Domestic India routes — check promo awards', rating: 2 },
      { name: 'Taj InnerCircle', type: 'hotel', ratio: '1:1', timeline: '3-5 days', value: 'Rs.0.6-1.0/pt', sweet_spot: 'Taj Safaris and resort properties', rating: 3 },
    ],
  },
  {
    bank: 'Axis Bank',
    bankColor: '#97144D',
    cards: ['Magnus Burgundy', 'Reserve', 'Atlas'],
    currency: 'EDGE Miles',
    partners: [
      { name: 'Singapore KrisFlyer', type: 'airline', ratio: '1.33:1', timeline: '24-48 hours', value: 'Rs.1.2-1.5/pt', sweet_spot: 'DEL-SIN business (less efficient than HDFC due to ratio)', rating: 4 },
      { name: 'Turkish Miles&Smiles', type: 'airline', ratio: '1:1', timeline: '24-48 hours', value: 'Rs.1.0-1.5/pt', sweet_spot: 'DEL-IST zone pricing — same sweet spot as HDFC', rating: 5 },
      { name: 'Air France KLM Flying Blue', type: 'airline', ratio: '1:1', timeline: '24-48 hours', value: 'Rs.0.8-1.2/pt', sweet_spot: 'Paris/Amsterdam routes — check monthly promo awards', rating: 3 },
      { name: 'Air India Flying Returns', type: 'airline', ratio: '1:1', timeline: '24-48 hours', value: 'Rs.0.5-0.8/pt', sweet_spot: 'Post-Vistara merger — Air India domestic and international', rating: 2 },
      { name: 'British Airways Avios', type: 'airline', ratio: '2:1', timeline: '24-48 hours', value: 'Rs.0.6-1.0/pt', sweet_spot: 'Short-haul European hops from London', rating: 3 },
      { name: 'Vietnam Airlines Lotusmiles', type: 'airline', ratio: '2:1', timeline: '3-5 days', value: 'Rs.0.5-0.8/pt', sweet_spot: 'Star Alliance partner awards — niche use', rating: 2 },
    ],
    note: 'Axis removed Accor, Marriott Bonvoy, and Qatar Airways on April 2, 2026.',
  },
  {
    bank: 'American Express',
    bankColor: '#006FCF',
    cards: ['Platinum Travel', 'MRCC', 'Gold Charge'],
    currency: 'Membership Rewards',
    partners: [
      { name: 'British Airways Avios', type: 'airline', ratio: '1:1', timeline: '2-3 days', value: 'Rs.1.2-1.8/pt', sweet_spot: 'India-UK via BA partner awards — strong value', rating: 4 },
      { name: 'Marriott Bonvoy', type: 'hotel', ratio: '1:1', timeline: '3-5 days', value: 'Rs.0.7-1.2/pt', sweet_spot: 'Then transfer Marriott to Air India at 3:1 with 25% bonus', rating: 3 },
      { name: 'Taj InnerCircle', type: 'hotel', ratio: '1:1', timeline: '3-5 days', value: 'Rs.0.6-1.0/pt', sweet_spot: 'Taj luxury properties and Safaris', rating: 3 },
      { name: 'Air Canada Aeroplan', type: 'airline', ratio: '1:1', timeline: '2-3 days', value: 'Rs.1.0-1.5/pt', sweet_spot: 'Star Alliance awards including Singapore Airlines', rating: 4 },
      { name: 'Hilton Honors', type: 'hotel', ratio: '1:3', timeline: '3-5 days', value: 'Rs.0.4-0.6/pt', sweet_spot: 'Cat 1-3 Hilton properties in India + Asia', rating: 2 },
    ],
  },
  {
    bank: 'HSBC',
    bankColor: '#c41e3a',
    cards: ['TravelOne', 'Premier'],
    currency: 'Reward Points',
    partners: [
      { name: 'Singapore KrisFlyer', type: 'airline', ratio: '1:1', timeline: '24-48 hours', value: 'Rs.1.6-2.0/pt', sweet_spot: 'Best value transfer — same as HDFC without ratio penalty', rating: 5 },
      { name: 'British Airways Avios', type: 'airline', ratio: '1:1', timeline: '24-48 hours', value: 'Rs.1.2-1.8/pt', sweet_spot: 'India-UK routing and partner awards', rating: 4 },
      { name: 'Cathay Pacific Asia Miles', type: 'airline', ratio: '1:1', timeline: '24-48 hours', value: 'Rs.1.2-1.6/pt', sweet_spot: 'Hong Kong hub — good for Asia travel', rating: 4 },
      { name: 'Air France KLM Flying Blue', type: 'airline', ratio: '1:1', timeline: '24-48 hours', value: 'Rs.0.8-1.2/pt', sweet_spot: 'Monthly promo awards on Europe routes', rating: 3 },
      { name: 'Malaysia Airlines Enrich', type: 'airline', ratio: '1:1', timeline: '2-3 days', value: 'Rs.0.8-1.2/pt', sweet_spot: 'KL hub — good for Southeast Asia travel', rating: 3 },
      { name: 'Marriott Bonvoy', type: 'hotel', ratio: '1:1', timeline: '3-5 days', value: 'Rs.0.8-1.2/pt', sweet_spot: 'Cat 1-4 India Marriott properties', rating: 4 },
      { name: 'IHG Rewards', type: 'hotel', ratio: '1:1', timeline: '3-5 days', value: 'Rs.0.5-0.8/pt', sweet_spot: 'InterContinental and Holiday Inn properties', rating: 2 },
    ],
  },
];

const TYPE_COLOR = { airline: '#0ea5e9', hotel: '#c9972e' };
const STARS = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

export default function TransferPartnersPage() {
  return (
    <>
      <Header />
      <div className="page-fade">
        <section style={{ position: 'relative', paddingTop: 'clamp(120px,18vw,150px)', paddingBottom: 48 }}>
          <div className="aurora" style={{ top: -80, right: -100, width: 600, height: 500, background: 'radial-gradient(circle,rgba(212,163,115,0.22),transparent 60%)' }} />
          <div className="shell" style={{ position: 'relative', zIndex: 2 }}>
            <Reveal>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '7px 16px', borderRadius: 999, background: 'rgba(212,163,115,0.12)', border: '1px solid rgba(212,163,115,0.28)', marginBottom: 24 }}>
                <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, letterSpacing: '0.18em', color: 'var(--copper,#8C5F12)', textTransform: 'uppercase', fontWeight: 700 }}>Verified May 2026</span>
              </div>
              <h1 style={{ fontSize: 'clamp(32px,5vw,64px)', fontWeight: 800, color: 'var(--ink,#142950)', lineHeight: 1.05, letterSpacing: '-0.03em', margin: '0 0 16px' }}>
                Transfer Partners{' '}
                <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)', fontStyle: 'italic', fontWeight: 400 }}>& Ratios</span>
              </h1>
              <p style={{ fontSize: 'clamp(15px,1.4vw,18px)', color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.65, margin: 0, maxWidth: 560 }}>
                Every airline and hotel transfer partner for Indian credit cards — with actual ratios, timelines, and where to get the best value.
              </p>
            </Reveal>
          </div>
        </section>

        <section style={{ paddingBottom: 80 }}>
          <div className="shell" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {PARTNERS.map((bank, bi) => (
              <Reveal key={bi} style={{ animationDelay: `${bi * 80}ms` }}>
                <div style={{ background: 'var(--paper,#FAF5EB)', borderRadius: 20, border: '1px solid var(--line,rgba(20,41,80,0.08))', overflow: 'hidden' }}>
                  {/* Bank header */}
                  <div style={{ background: 'var(--ink,#142950)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: 'var(--copper-3,#D89B2A)', textTransform: 'uppercase', marginBottom: 4 }}>{bank.currency}</div>
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>{bank.bank}</h2>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {bank.cards.map(c => (
                        <span key={c} style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.10)', fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>{c}</span>
                      ))}
                    </div>
                  </div>

                  {bank.note && (
                    <div style={{ background: 'rgba(184,66,48,0.08)', borderBottom: '1px solid rgba(184,66,48,0.15)', padding: '10px 24px', fontSize: 12, color: '#B84230', fontWeight: 600 }}>
                      ⚠ {bank.note}
                    </div>
                  )}

                  {/* Partners table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--surface,#fff)' }}>
                          {['Partner', 'Type', 'Ratio', 'Timeline', 'Value', 'Sweet Spot', 'Rating'].map(h => (
                            <th key={h} style={{ padding: '10px 16px', fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--ink-3,#5A6A8A)', textTransform: 'uppercase', textAlign: 'left', whiteSpace: 'nowrap', borderBottom: '1px solid var(--line,rgba(20,41,80,0.08))' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bank.partners.map((p, pi) => (
                          <tr key={pi} style={{ borderBottom: pi < bank.partners.length - 1 ? '1px solid var(--line,rgba(20,41,80,0.06))' : 'none', background: pi % 2 === 0 ? 'var(--paper,#FAF5EB)' : 'var(--surface,#fff)' }}>
                            <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: 'var(--ink,#142950)', whiteSpace: 'nowrap' }}>{p.name}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: p.type === 'airline' ? 'rgba(14,165,233,0.12)' : 'rgba(201,151,46,0.12)', color: p.type === 'airline' ? '#0369a1' : 'var(--copper,#8C5F12)' }}>
                                {p.type === 'airline' ? '✈ Airline' : '🏨 Hotel'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono,monospace)', fontSize: 13, fontWeight: 700, color: 'var(--ink,#142950)' }}>{p.ratio}</td>
                            <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono,monospace)', fontSize: 11, color: 'var(--ink-3,#5A6A8A)', whiteSpace: 'nowrap' }}>{p.timeline}</td>
                            <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#2d7a56', whiteSpace: 'nowrap' }}>{p.value}</td>
                            <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--ink-2,#2A3F6B)', maxWidth: 220, lineHeight: 1.5 }}>{p.sweet_spot}</td>
                            <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--copper-3,#D89B2A)', whiteSpace: 'nowrap' }}>{STARS(p.rating)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Reveal>
            ))}

            {/* Key rules */}
            <Reveal>
              <div style={{ background: 'var(--ink,#142950)', borderRadius: 20, padding: 'clamp(24px,4vw,40px)', position: 'relative', overflow: 'hidden' }}>
                <div className="aurora" style={{ top: -40, right: -40, width: 300, height: 300, background: 'radial-gradient(circle,rgba(212,163,115,0.18),transparent 60%)' }} />
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <h2 style={{ fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 700, color: '#fff', margin: '0 0 20px', letterSpacing: '-0.01em' }}>
                    5 rules before you transfer
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {[
                      ['Never transfer speculatively', 'Only transfer when you have confirmed award space. Transfers are one-way and irreversible. Seats disappear — miles don\'t return.'],
                      ['Check award availability first', 'Search the airline\'s website for availability before transferring. For partner awards, call the airline directly.'],
                      ['Wait for transfer bonuses', 'Banks run 20-30% transfer bonus promotions 2-4x per year. Waiting can be worth thousands of extra miles.'],
                      ['HDFC 1:1 to KrisFlyer beats Axis 1.33:1', 'To earn 1 KrisFlyer mile, you need 1 HDFC Reward Point or 1.33 Axis EDGE Miles. HDFC is more efficient for KrisFlyer specifically.'],
                      ['Transfers take 24-96 hours', 'Airlines credit instantly sometimes, sometimes up to 5 days. Factor this in for time-sensitive bookings.'],
                    ].map(([title, desc]) => (
                      <div key={title as string} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--copper-3,#D89B2A)', flexShrink: 0, marginTop: 7 }} />
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{title}: </span>
                          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65 }}>{desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 24 }}>
                    <Link href="/points-optimizer" style={{ display: 'inline-block', background: 'var(--copper-3,#D89B2A)', color: '#fff', padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                      Optimise my points →
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
        <DesignFooter />
      </div>
    </>
  );
}
