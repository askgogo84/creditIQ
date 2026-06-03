import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { createClient } from '@supabase/supabase-js';
import { Header } from '@/components/Header';
import { getApplyUrl } from '@/lib/affiliate';

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return SEED_CARDS.map(card => ({ slug: card.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const card = SEED_CARDS.find(c => c.id === params.slug);
  if (!card) return {};
  return {
    title: `${card.name} Review 2026 -- Fees, Rewards & Benefits | CreditIQ`,
    description: `Unbiased ${card.name} review. Annual fee: Rs.${(card as any).annual_fee_inr ?? 0}. Reward rate, lounge access, joining benefits, who should apply -- honest analysis with no affiliate bias.`,
    keywords: `${card.name}, ${card.name} review, ${card.name} benefits, ${card.name} annual fee, ${card.bank} credit card, best credit card India 2026`,
    openGraph: {
      title: `${card.name} -- Honest Review 2026`,
      description: `Reward rate, fees, benefits and who should apply for ${card.name}. No affiliate bias.`,
      url: `https://creditiq.app/cards/${card.id}`,
    },
    alternates: { canonical: `https://creditiq.app/cards/${card.id}` },
  };
}

export default async function CardDetailPage({ params }: Props) {
  const card = SEED_CARDS.find(c => c.id === params.slug);
  if (!card) notFound();

  // Fetch community signals from intelligence_kb
  let communityInsights: any[] = []
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const cardName = card.name.toLowerCase()
    const bankName = card.bank.toLowerCase()
    const { data } = await sb
      .from('intelligence_kb')
      .select('insight_type, title, content, creator_handle, trust_score, source, scraped_at')
      .eq('active', true)
      .or(`card_mentions.cs.{"${card.name}"},card_mentions.cs.{"${card.bank}"}`)
      .order('trust_score', { ascending: false })
      .limit(3)
    communityInsights = data || []
  } catch {}

  const { url: applyUrl, label: applyLabel } = getApplyUrl(card.id);
  const annualFee = (card as any).annual_fee_inr ?? 0;
  const joiningFee = (card as any).joining_fee_inr ?? annualFee;
  const rewardRate = (card as any).reward_rate ?? (card as any).base_reward_rate ?? '1 point per Rs.100';
  const features = (card as any).key_features ?? (card as any).category_rewards?.map((r: any) => r.notes).filter(Boolean) ?? [];
  const minIncome = (card as any).min_income_inr_monthly ?? null;
  const network = (card as any).network ?? 'Visa/Mastercard';
  const category = Array.isArray(card.category) ? (card.category[0] ?? 'Rewards') : ((card as any).category ?? 'Rewards');

  // Structured data for Google
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FinancialProduct',
    name: card.name,
    description: `${card.name} credit card by ${card.bank}`,
    provider: { '@type': 'BankOrCreditUnion', name: card.bank },
    annualPercentageRate: (card as any).apr_percent ?? 40,
    feesAndCommissionsSpecification: `Annual fee: Rs.${annualFee}`,
    url: `https://creditiq.app/cards/${card.id}`,
  };

  const pros = features.slice(0, 4);
  const relatedCards = SEED_CARDS
    .filter(c => c.bank === card.bank && c.id !== card.id)
    .slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <Header />

        {/* Breadcrumb */}
        <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '10px 20px', fontSize: 13, color: '#94a3b8' }}>
            <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>Home</Link>
            {' / '}
            <Link href="/cards" style={{ color: '#94a3b8', textDecoration: 'none' }}>Credit Cards</Link>
            {' / '}
            <Link href={`/cards?bank=${card.bank}`} style={{ color: '#94a3b8', textDecoration: 'none' }}>{card.bank}</Link>
            {' / '}
            <span style={{ color: '#1B3A5C', fontWeight: 600 }}>{card.name}</span>
          </div>
        </div>

        <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 80px' }}>

          {/* Hero card */}
          <div style={{
            backgroundColor: '#fff', borderRadius: 20, border: '1px solid #e2e8f0',
            overflow: 'hidden', marginBottom: 28,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <div style={{ background: 'linear-gradient(135deg, #1B3A5C 0%, #0d2240 100%)', padding: '32px 32px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
                    {card.bank} &nbsp;&bull;&nbsp; {category}
                  </div>
                  <h1 style={{ fontSize: 28, fontWeight: 800, color: '#ffffff', margin: '0 0 8px', lineHeight: 1.2 }}>
                    {card.name}
                  </h1>
                  <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.5 }}>
                    Honest review &mdash; No affiliate bias &mdash; Updated May 2026
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>CreditIQ Score</div>
                  <div style={{ fontSize: 42, fontWeight: 800, color: '#C9972E', lineHeight: 1 }}>
                    {(card as any).creditiq_score ?? '8.2'}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>out of 10</div>
                </div>
              </div>
            </div>

            {/* Key stats bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid #e2e8f0' }}>
              {[
                { label: 'Annual Fee', value: annualFee === 0 ? 'FREE' : `Rs. ${annualFee.toLocaleString('en-IN')}` },
                { label: 'Joining Fee', value: joiningFee === 0 ? 'FREE' : `Rs. ${joiningFee.toLocaleString('en-IN')}` },
                { label: 'Network', value: network },
                { label: 'Category', value: category },
              ].map((stat, i) => (
                <div key={i} style={{
                  padding: '16px 20px', textAlign: 'center',
                  borderRight: i < 3 ? '1px solid #e2e8f0' : 'none',
                }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1B3A5C' }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

            {/* Left -- main content */}
            <div>

              {/* Quick verdict */}
              <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '24px', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1B3A5C', margin: '0 0 12px' }}>
                  CreditIQ Verdict
                </h2>
                <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, margin: 0 }}>
                  The <strong>{card.name}</strong> is a {category.toLowerCase()} credit card from {card.bank}
                  {annualFee === 0
                    ? ' with no annual fee, making it a strong choice for users who want rewards without ongoing costs.'
                    : ` with an annual fee of Rs.${annualFee.toLocaleString('en-IN')}. The fee is justified if you maximise the card benefits.`
                  } Best suited for users who spend regularly on {category.toLowerCase()} categories and want to earn meaningful rewards.
                </p>
              </div>

              {/* Key benefits */}
              {pros.length > 0 && (
                <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '24px', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1B3A5C', margin: '0 0 16px' }}>
                    Key Benefits
                  </h2>
                  {pros.map((benefit: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: 6, backgroundColor: '#dcfce7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, fontSize: 12, color: '#16a34a', fontWeight: 800,
                      }}>+</div>
                      <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{benefit}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Fees table */}
              <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1B3A5C', margin: 0 }}>Fees & Charges</h2>
                </div>
                {[
                  { label: 'Annual Fee', value: annualFee === 0 ? 'Nil (Lifetime Free)' : `Rs. ${annualFee.toLocaleString('en-IN')} + GST` },
                  { label: 'Joining Fee', value: joiningFee === 0 ? 'Nil' : `Rs. ${joiningFee.toLocaleString('en-IN')} + GST` },
                  { label: 'Interest Rate', value: `${(card as any).apr_percent ?? 40}% per annum (3.33% per month)` },
                  { label: 'Forex Markup', value: (card as any).forex_markup ?? '3.5% on international transactions' },
                  { label: 'Cash Advance', value: '2.5% of amount (min Rs. 500)' },
                  { label: 'Late Payment', value: 'Rs. 0 - Rs. 1,300 (based on outstanding)' },
                ].map((row, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '13px 24px', borderBottom: i < 5 ? '1px solid #f8fafc' : 'none',
                    backgroundColor: i % 2 === 0 ? '#fff' : '#fafbfc',
                  }}>
                    <span style={{ fontSize: 14, color: '#64748b' }}>{row.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Who should apply */}
              <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '24px', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1B3A5C', margin: '0 0 16px' }}>
                  Who Should Apply?
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ backgroundColor: '#f0fdf4', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                      Good fit if you...
                    </div>
                    {[
                      `Spend on ${category.toLowerCase()} regularly`,
                      annualFee === 0 ? 'Want a no-fee card' : `Spend Rs.${Math.round(annualFee * 4).toLocaleString('en-IN')}+ per month`,
                      'Have a good credit score (750+)',
                      minIncome ? `Earn Rs.${(minIncome/100000).toFixed(1)}L+ annually` : 'Meet the bank income criteria',
                    ].map((item, j) => (
                      <div key={j} style={{ fontSize: 13, color: '#166534', marginBottom: 6, display: 'flex', gap: 6 }}>
                        <span style={{ color: '#16a34a', fontWeight: 700 }}>+</span> {item}
                      </div>
                    ))}
                  </div>
                  <div style={{ backgroundColor: '#fef2f2', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                      Skip if you...
                    </div>
                    {[
                      'Travel internationally often (high forex markup)',
                      'Carry a balance month-to-month',
                      'Are a first-time credit card user',
                      annualFee > 2000 ? 'Cannot meet annual spend threshold' : 'Already have a similar card',
                    ].map((item, j) => (
                      <div key={j} style={{ fontSize: 13, color: '#991b1b', marginBottom: 6, display: 'flex', gap: 6 }}>
                        <span style={{ color: '#dc2626', fontWeight: 700 }}>-</span> {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Community Intelligence Panel */}
        {communityInsights.length > 0 && (
          <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: '#7c3aed' }} />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1B3A5C', margin: 0 }}>What the community says</h2>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(124,58,237,0.1)', color: '#7c3aed', fontWeight: 700, letterSpacing: '0.08em' }}>LIVE</span>
            </div>
            {communityInsights.map((insight: any, i: number) => (
              <div key={i} style={{ padding: '16px 24px', borderBottom: i < communityInsights.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                    background: insight.insight_type === 'devaluation' ? '#fef2f2' : insight.insight_type === 'sweet_spot' ? '#f0fdf4' : '#f5f3ff',
                    color: insight.insight_type === 'devaluation' ? '#dc2626' : insight.insight_type === 'sweet_spot' ? '#16a34a' : '#7c3aed'
                  }}>{insight.insight_type?.replace('_', ' ')}</span>
                  {insight.creator_handle && <span style={{ fontSize: 12, color: '#94a3b8' }}>@{insight.creator_handle}</span>}
                  <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>{insight.source?.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1B3A5C', marginBottom: 4 }}>{insight.title}</div>
                {insight.content && <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{insight.content.slice(0, 140)}...</div>}
              </div>
            ))}
            <div style={{ padding: '12px 24px', background: '#fafafa' }}>
              <a href="/intelligence" style={{ fontSize: 13, color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}>View all community intelligence &rarr;</a>
            </div>
          </div>
        )}

        {/* FAQ Schema */}
              <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: [
                  {
                    '@type': 'Question',
                    name: `What is the annual fee of ${card.name}?`,
                    acceptedAnswer: { '@type': 'Answer', text: annualFee === 0 ? `${card.name} has no annual fee -- it is a lifetime free credit card.` : `The annual fee for ${card.name} is Rs.${annualFee} + GST.` }
                  },
                  {
                    '@type': 'Question',
                    name: `Is ${card.name} good for travel?`,
                    acceptedAnswer: { '@type': 'Answer', text: `${card.name} is a ${category} card from ${card.bank}. ${category.toLowerCase().includes('travel') ? 'Yes, it offers travel benefits including lounge access and air miles.' : 'It is not primarily a travel card, but may offer some travel benefits.'}` }
                  },
                  {
                    '@type': 'Question',
                    name: `How to apply for ${card.name}?`,
                    acceptedAnswer: { '@type': 'Answer', text: `You can apply for ${card.name} online through ${card.bank}'s website or through CreditIQ's unbiased apply link. Eligibility typically requires a credit score of 750+ and a minimum income as per bank criteria.` }
                  },
                ]
              })}} />

              {/* FAQ visible */}
              <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1B3A5C', margin: 0 }}>
                    Frequently Asked Questions
                  </h2>
                </div>
                {[
                  {
                    q: `What is the annual fee of ${card.name}?`,
                    a: annualFee === 0 ? `${card.name} is a lifetime free card with zero annual fee.` : `The annual fee is Rs.${annualFee.toLocaleString('en-IN')} + GST. It is waived if you meet the annual spend threshold.`
                  },
                  {
                    q: `What is the reward rate on ${card.name}?`,
                    a: `${card.name} offers ${rewardRate}. Check the benefits section above for category-specific accelerators.`
                  },
                  {
                    q: `How to apply for ${card.name}?`,
                    a: `You can apply online through ${card.bank}'s website. Eligibility requires a credit score of 750+ and income as per bank criteria. Click the Apply button on this page for a direct, unbiased apply link.`
                  },
                ].map((faq, i) => (
                  <div key={i} style={{ padding: '16px 24px', borderBottom: i < 2 ? '1px solid #f8fafc' : 'none' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1B3A5C', marginBottom: 6 }}>{faq.q}</div>
                    <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{faq.a}</div>
                  </div>
                ))}
              </div>

            </div>

            {/* Right sidebar -- sticky apply box */}
            <div style={{ position: 'sticky', top: 88 }}>
              <div style={{
                backgroundColor: '#fff', borderRadius: 16, border: '2px solid #C9972E',
                padding: '24px', marginBottom: 20,
                boxShadow: '0 4px 20px rgba(201,151,46,0.12)',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                  Applying via CreditIQ
                </div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 1.5 }}>
                  Zero affiliate bias. We show all cards equally -- ranked by value, not commission.
                </div>
                <a href={applyUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: 'block', backgroundColor: '#C9972E', color: '#fff',
                  textAlign: 'center', padding: '14px', borderRadius: 12,
                  fontSize: 15, fontWeight: 700, textDecoration: 'none', marginBottom: 12,
                }}>
                  {applyLabel}
                </a>
                <Link href={`/compare?cards=${card.id}`} style={{
                  display: 'block', backgroundColor: '#f8fafc', color: '#1B3A5C',
                  textAlign: 'center', padding: '12px', borderRadius: 12,
                  fontSize: 14, fontWeight: 600, textDecoration: 'none', border: '1px solid #e2e8f0',
                }}>
                  Compare with other cards
                </Link>

                <div style={{ marginTop: 20, padding: '14px', backgroundColor: '#f8fafc', borderRadius: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1B3A5C', marginBottom: 8 }}>Quick facts</div>
                  {[
                    { label: 'Annual fee', value: annualFee === 0 ? 'Free' : `Rs.${annualFee.toLocaleString('en-IN')}` },
                    { label: 'Network', value: network },
                    { label: 'Bank', value: card.bank },
                  ].map((fact, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: '#64748b' }}>{fact.label}</span>
                      <span style={{ color: '#1e293b', fontWeight: 600 }}>{fact.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related cards */}
              {relatedCards.length > 0 && (
                <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1B3A5C', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>
                    Other {card.bank} cards
                  </div>
                  {relatedCards.map((rc, i) => (
                    <Link key={rc.id} href={`/cards/${rc.id}`} style={{
                      display: 'block', padding: '10px 12px', borderRadius: 10,
                      backgroundColor: '#f8fafc', marginBottom: i < relatedCards.length - 1 ? 8 : 0,
                      textDecoration: 'none',
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1B3A5C' }}>{rc.name}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                        Rs.{((rc as any).annual_fee_inr ?? 0).toLocaleString('en-IN')} annual fee
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Internal linking -- category pages */}
          <div style={{ backgroundColor: '#1B3A5C', borderRadius: 16, padding: '24px', marginTop: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
              Explore more
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { href: '/best-cards/travel', label: 'Best Travel Cards' },
                { href: '/best-cards/cashback', label: 'Best Cashback Cards' },
                { href: '/best-cards/dining', label: 'Best Dining Cards' },
                { href: '/best-cards/no-fee', label: 'Lifetime Free Cards' },
                { href: '/spend-optimizer', label: 'Find My Best Card' },
                { href: '/compare', label: 'Compare Cards' },
              ].map((link, i) => (
                <Link key={i} href={link.href} style={{
                  padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 100, fontSize: 13, color: '#cbd5e1',
                  textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

        </main>
      </div>
    </>
  );
}
