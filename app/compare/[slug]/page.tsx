import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { Header } from '@/components/Header';
import { getApplyUrl } from '@/lib/affiliate';

interface Props {
  params: { slug: string };
}

function parseSlug(slug: string) {
  const parts = slug.split('-vs-');
  if (parts.length !== 2) return null;
  return { card1Id: parts[0], card2Id: parts[1] };
}

export async function generateStaticParams() {
  const topCards = ['hdfc-infinia', 'axis-magnus', 'hdfc-regalia-gold', 'sbi-cashback', 'idfc-first', 'scapia', 'axis-flipkart', 'hdfc-millenia', 'icici-amazon-pay', 'au-zenith'];
  const pairs: { slug: string }[] = [];
  for (let i = 0; i < topCards.length; i++) {
    for (let j = i + 1; j < topCards.length; j++) {
      pairs.push({ slug: `${topCards[i]}-vs-${topCards[j]}` });
    }
  }
  return pairs;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const parsed = parseSlug(params.slug);
  if (!parsed) return {};
  const c1 = SEED_CARDS.find(c => c.id === parsed.card1Id) as any;
  const c2 = SEED_CARDS.find(c => c.id === parsed.card2Id) as any;
  if (!c1 || !c2) return {};
  return {
    title: `${c1.name} vs ${c2.name} — Honest Comparison 2026 | CreditIQ`,
    description: `${c1.name} vs ${c2.name}: fees, rewards, lounge access, forex markup compared honestly. No affiliate bias. Which card is better for your spend pattern?`,
    keywords: `${c1.name} vs ${c2.name}, ${c1.name} comparison, ${c2.name} vs ${c1.name}, best credit card India 2026`,
    alternates: { canonical: `https://creditiq.app/compare/${params.slug}` },
    openGraph: {
      title: `${c1.name} vs ${c2.name} — Which is Better?`,
      description: `Honest comparison — fees, rewards, lounge access. No affiliate bias.`,
    },
  };
}

export default function CompareSlugPage({ params }: Props) {
  const parsed = parseSlug(params.slug);
  if (!parsed) notFound();

  const c1 = SEED_CARDS.find(c => c.id === parsed!.card1Id) as any;
  const c2 = SEED_CARDS.find(c => c.id === parsed!.card2Id) as any;
  if (!c1 || !c2) notFound();

  const { url: url1, label: label1 } = getApplyUrl(c1.id);
  const { url: url2, label: label2 } = getApplyUrl(c2.id);

  const rows = [
    { label: 'Annual fee', v1: c1.annual_fee_inr === 0 ? 'Free' : `Rs.${(c1.annual_fee_inr ?? 0).toLocaleString('en-IN')}`, v2: c2.annual_fee_inr === 0 ? 'Free' : `Rs.${(c2.annual_fee_inr ?? 0).toLocaleString('en-IN')}`, winner: (c1.annual_fee_inr ?? 0) <= (c2.annual_fee_inr ?? 0) ? 1 : 2 },
    { label: 'Joining fee', v1: c1.joining_fee_inr === 0 ? 'Free' : `Rs.${(c1.joining_fee_inr ?? 0).toLocaleString('en-IN')}`, v2: c2.joining_fee_inr === 0 ? 'Free' : `Rs.${(c2.joining_fee_inr ?? 0).toLocaleString('en-IN')}`, winner: (c1.joining_fee_inr ?? 0) <= (c2.joining_fee_inr ?? 0) ? 1 : 2 },
    { label: 'Base reward rate', v1: `${c1.base_reward_rate ?? 1}%`, v2: `${c2.base_reward_rate ?? 1}%`, winner: (c1.base_reward_rate ?? 1) >= (c2.base_reward_rate ?? 1) ? 1 : 2 },
    { label: 'Forex markup', v1: `${c1.forex_markup_percent ?? 3.5}%`, v2: `${c2.forex_markup_percent ?? 3.5}%`, winner: (c1.forex_markup_percent ?? 3.5) <= (c2.forex_markup_percent ?? 3.5) ? 1 : 2 },
    { label: 'Lounge access', v1: c1.lounges?.length > 0 ? (c1.lounges[0]?.notes || 'Yes') : 'None', v2: c2.lounges?.length > 0 ? (c2.lounges[0]?.notes || 'Yes') : 'None', winner: (c1.lounges?.length ?? 0) >= (c2.lounges?.length ?? 0) ? 1 : 2 },
    { label: 'Fuel surcharge waiver', v1: c1.fuel_surcharge_waiver ? 'Yes' : 'No', v2: c2.fuel_surcharge_waiver ? 'Yes' : 'No', winner: c1.fuel_surcharge_waiver ? 1 : 2 },
    { label: 'Min income (monthly)', v1: c1.min_income_inr_monthly ? `Rs.${(c1.min_income_inr_monthly/1000).toFixed(0)}K` : 'Not specified', v2: c2.min_income_inr_monthly ? `Rs.${(c2.min_income_inr_monthly/1000).toFixed(0)}K` : 'Not specified', winner: (c1.min_income_inr_monthly ?? 999999) <= (c2.min_income_inr_monthly ?? 999999) ? 1 : 2 },
  ];

  const c1Wins = rows.filter(r => r.winner === 1).length;
  const c2Wins = rows.filter(r => r.winner === 2).length;
  const overallWinner = c1Wins > c2Wins ? c1 : c2;

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: `Which is better: ${c1.name} or ${c2.name}?`, acceptedAnswer: { '@type': 'Answer', text: `${overallWinner.name} wins on ${Math.max(c1Wins, c2Wins)} out of ${rows.length} comparison points. However, the best card depends on your specific spend pattern. Use CreditIQ's spend optimizer to find the best card for your exact monthly spends.` } },
      { '@type': 'Question', name: `What is the annual fee of ${c1.name} vs ${c2.name}?`, acceptedAnswer: { '@type': 'Answer', text: `${c1.name} has an annual fee of Rs.${c1.annual_fee_inr ?? 0} while ${c2.name} charges Rs.${c2.annual_fee_inr ?? 0} per year.` } },
      { '@type': 'Question', name: `Which gives better rewards: ${c1.name} or ${c2.name}?`, acceptedAnswer: { '@type': 'Answer', text: `${c1.name} offers a base reward rate of ${c1.base_reward_rate ?? 1}% while ${c2.name} offers ${c2.base_reward_rate ?? 1}%. However, actual rewards depend heavily on which categories you spend most on and whether you meet any minimum spend requirements.` } },
    ],
  };

  const relatedComparisons = SEED_CARDS
    .filter(c => c.id !== c1.id && c.id !== c2.id && (c.bank === c1.bank || c.bank === c2.bank))
    .slice(0, 4);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <Header />

        {/* Breadcrumb */}
        <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '10px 20px', fontSize: 13, color: '#94a3b8' }}>
            <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>Home</Link>
            {' / '}
            <Link href="/compare" style={{ color: '#94a3b8', textDecoration: 'none' }}>Compare</Link>
            {' / '}
            <span style={{ color: '#1B3A5C', fontWeight: 600 }}>{c1.name} vs {c2.name}</span>
          </div>
        </div>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, #1B3A5C 0%, #0d2240 100%)', padding: '40px 20px 36px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' as const }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 12 }}>
              Honest comparison &nbsp;&bull;&nbsp; No affiliate bias &nbsp;&bull;&nbsp; May 2026
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: '#ffffff', margin: '0 0 8px', lineHeight: 1.2 }}>
              {c1.name} vs {c2.name}
            </h1>
            <p style={{ fontSize: 15, color: '#94a3b8', margin: 0 }}>
              {c1.bank} vs {c2.bank} &nbsp;&bull;&nbsp; Which card wins for your spend pattern?
            </p>
          </div>
        </div>

        <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 80px' }}>

          {/* Winner banner */}
          <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '2px solid #C9972E', padding: '20px 28px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase' as const, letterSpacing: 1.2, marginBottom: 4 }}>Overall winner</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1B3A5C' }}>{overallWinner.name}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Wins {Math.max(c1Wins, c2Wins)} out of {rows.length} categories</div>
            </div>
            <Link href="/spend-optimizer" style={{
              padding: '12px 22px', backgroundColor: '#C9972E', color: '#fff',
              borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none',
              whiteSpace: 'nowrap' as const,
            }}>
              Which is better for me? &rarr;
            </Link>
          </div>

          {/* Side by side cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
            {[{ card: c1, url: url1, label: label1, wins: c1Wins }, { card: c2, url: url2, label: label2, wins: c2Wins }].map((item, i) => (
              <div key={i} style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '20px', textAlign: 'center' as const }}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{item.card.bank}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#1B3A5C', marginBottom: 12, lineHeight: 1.3 }}>{item.card.name}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: item.card.annual_fee_inr === 0 ? '#16a34a' : '#1e293b', marginBottom: 4 }}>
                  {item.card.annual_fee_inr === 0 ? 'FREE' : `Rs.${(item.card.annual_fee_inr ?? 0).toLocaleString('en-IN')}`}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 16 }}>annual fee</div>
                <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 700, marginBottom: 16 }}>
                  Wins {item.wins}/{rows.length} categories
                </div>
                <a href={item.url} target="_blank" rel="noopener noreferrer" style={{
                  display: 'block', backgroundColor: '#1B3A5C', color: '#fff',
                  padding: '11px', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none', marginBottom: 8,
                }}>{item.label}</a>
                <Link href={`/cards/${item.card.id}`} style={{
                  display: 'block', backgroundColor: '#f8fafc', color: '#1B3A5C',
                  padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                  border: '1px solid #e2e8f0',
                }}>Full review</Link>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', backgroundColor: '#1B3A5C' }}>
              <div style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>Feature</div>
              <div style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase' as const, letterSpacing: 0.8, textAlign: 'center' as const }}>{c1.name.split(' ').slice(-1)[0]}</div>
              <div style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase' as const, letterSpacing: 0.8, textAlign: 'center' as const }}>{c2.name.split(' ').slice(-1)[0]}</div>
            </div>
            {rows.map((row, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                borderBottom: i < rows.length - 1 ? '1px solid #f8fafc' : 'none',
                backgroundColor: i % 2 === 0 ? '#fff' : '#fafbfc',
              }}>
                <div style={{ padding: '14px 20px', fontSize: 13, color: '#64748b', fontWeight: 500 }}>{row.label}</div>
                <div style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, textAlign: 'center' as const, color: row.winner === 1 ? '#16a34a' : '#1e293b' }}>
                  {row.v1} {row.winner === 1 && <span style={{ color: '#16a34a', fontSize: 11 }}>&#10003;</span>}
                </div>
                <div style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, textAlign: 'center' as const, color: row.winner === 2 ? '#16a34a' : '#1e293b' }}>
                  {row.v2} {row.winner === 2 && <span style={{ color: '#16a34a', fontSize: 11 }}>&#10003;</span>}
                </div>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1B3A5C', margin: 0 }}>Common questions</h2>
            </div>
            {faqSchema.mainEntity.map((faq: any, i: number) => (
              <div key={i} style={{ padding: '16px 24px', borderBottom: i < 2 ? '1px solid #f8fafc' : 'none' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1B3A5C', margin: '0 0 6px' }}>{faq.name}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 }}>{faq.acceptedAnswer.text}</p>
              </div>
            ))}
          </div>

          {/* Related comparisons */}
          {relatedComparisons.length > 0 && (
            <div style={{ backgroundColor: '#1B3A5C', borderRadius: 16, padding: '24px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 14 }}>
                More comparisons
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                {relatedComparisons.map(rc => (
                  <Link key={rc.id} href={`/compare/${c1.id}-vs-${rc.id}`} style={{
                    padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 100, fontSize: 13, color: '#cbd5e1',
                    textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    {c1.name.split(' ').slice(-2).join(' ')} vs {rc.name.split(' ').slice(-2).join(' ')}
                  </Link>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </>
  );
}
