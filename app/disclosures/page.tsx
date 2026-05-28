import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import { Reveal } from '@/components/design/Reveal';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disclosures | CreditIQ',
  description: 'How CreditIQ earns money, our affiliate relationships, and our editorial independence policy.',
};

export default function DisclosuresPage() {
  return (
    <>
      <Header />
      <div className="page-fade">
        <section style={{ position: 'relative', paddingTop: 'clamp(120px,18vw,150px)', paddingBottom: 48 }}>
          <div className="aurora" style={{ top: -80, right: -100, width: 600, height: 500, background: 'radial-gradient(circle,rgba(212,163,115,0.18),transparent 60%)' }} />
          <div className="shell" style={{ position: 'relative', zIndex: 2 }}>
            <Reveal>
              <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', fontWeight: 700, marginBottom: 16 }}>Full transparency</div>
              <h1 style={{ fontSize: 'clamp(36px,6vw,72px)', fontWeight: 800, color: 'var(--ink,#142950)', lineHeight: 1.05, letterSpacing: '-0.03em', margin: '0 0 16px' }}>
                Disclosures
              </h1>
              <p style={{ fontSize: 16, color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.7, margin: 0, maxWidth: 560 }}>
                We think you deserve to know exactly how we make money and how it does — and does not — influence our recommendations.
              </p>
            </Reveal>
          </div>
        </section>

        <section style={{ paddingBottom: 80 }}>
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* How we earn — highlighted */}
            <Reveal>
              <div style={{ background: 'var(--ink,#142950)', borderRadius: 20, padding: 'clamp(24px,4vw,40px)', position: 'relative', overflow: 'hidden' }}>
                <div className="aurora" style={{ top: -40, right: -40, width: 300, height: 300, background: 'radial-gradient(circle,rgba(212,163,115,0.18),transparent 60%)' }} />
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--copper-3,#D89B2A)', marginBottom: 16 }}>The short version</div>
                  <p style={{ fontSize: 'clamp(15px,1.8vw,18px)', color: '#fff', lineHeight: 1.75, margin: 0 }}>
                    CreditIQ earns affiliate commissions when you apply for a card through our links. <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', fontStyle: 'italic', color: 'var(--copper-3,#D89B2A)' }}>This commission comes from the bank, not from you.</span> It does not change the card&apos;s terms, fees, or rewards in any way.
                  </p>
                  <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: '16px 0 0' }}>
                    Our editorial decisions — what cards we rank, how we score them, what we write about them — are made independently of our commercial relationships.
                  </p>
                </div>
              </div>
            </Reveal>

            {[
              {
                title: 'Affiliate commission disclosure',
                body: `When you click "Apply" or "Apply & Earn" on a card page and complete a card application, CreditIQ may receive a commission from the issuing bank. These commissions typically range from Rs.300 to Rs.2,500 per approved application depending on the card.

Commissions are earned through:
— EarnKaro affiliate network (primary)
— Direct bank affiliate programmes (HDFC, Axis, SBI, ICICI, Amex, and others)
— Travelpayouts for travel-related card clicks

Not all cards on CreditIQ have affiliate links. Cards without affiliate relationships appear in our rankings and tools exactly the same as those with them.`,
              },
              {
                title: 'Editorial independence',
                body: `CreditIQ's card scores, rankings, and written reviews are produced by our editorial team independently of our commercial relationships. The following rules govern our editorial process:

— No bank or card issuer pays to appear in our recommendations
— No card issuer can pay to improve their score or ranking
— Our AI tools recommend based on value for the user — not commission rates
— We highlight devaluations and negative card changes even when they affect our affiliate partners
— Cards with higher commission rates do not appear higher in our results

If we ever change any of these policies, we will disclose the change prominently.`,
              },
              {
                title: 'AI tool disclosures',
                body: `Our AI-powered tools (Card Roast, Spend Optimizer, Points Optimizer, Statement Truth, Travel AI) use the Anthropic Claude API to generate personalised analysis.

AI-generated content may contain errors. Our tools are designed to give you useful starting points — not definitive financial advice. Always verify specific card terms, rates, and benefits directly with the issuing bank before making a decision.

We do not use your data from AI tool sessions to train AI models. Sessions are processed in real time and not stored beyond what is necessary for the feature to function.`,
              },
              {
                title: 'Data sources and accuracy',
                body: `Card data on CreditIQ (fees, reward rates, benefits, transfer partners) is sourced from:

— Publicly available bank websites and MITC documents
— Official card applications and welcome kits
— RBI and bank regulatory filings
— Direct verification with bank communications teams where possible

We update card data when devaluations or benefit changes are announced. Despite our best efforts, card terms change frequently. Always verify current terms directly with the issuing bank before applying.

Our CreditIQ Score (out of 10) is a proprietary rating based on reward rate, fee value, redemption flexibility, partner quality, and historical reliability. It is our editorial opinion, not a financial rating.`,
              },
              {
                title: 'No guaranteed approvals',
                body: `Clicking our affiliate links and applying for a card does not guarantee approval. Card approval depends on your credit score, income, existing relationship with the bank, and their internal criteria — none of which CreditIQ has any influence over.

We show credit score guidance on our Credit Score page, but this is general guidance only. If your application is declined, the bank will provide their reasons.`,
              },
              {
                title: 'Regulatory status',
                body: `CreditIQ Intelligence Pvt Ltd is incorporated in India. We are a technology and information platform — not a bank, NBFC, or registered investment advisor under SEBI regulations.

We do not provide regulated financial advice. Our tools and content are for informational purposes only. For personal financial advice, consult a SEBI-registered investment advisor or a certified financial planner.`,
              },
            ].map((s, i) => (
              <Reveal key={i} style={{ animationDelay: `${(i + 1) * 40}ms` }}>
                <div style={{ background: 'var(--paper,#FAF5EB)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 18, padding: 'clamp(20px,3vw,32px)' }}>
                  <h2 style={{ fontSize: 'clamp(16px,2vw,19px)', fontWeight: 700, color: 'var(--ink,#142950)', margin: '0 0 14px', letterSpacing: '-0.01em' }}>{s.title}</h2>
                  <div>
                    {s.body.split('\n\n').map((para, j) => (
                      <p key={j} style={{ fontSize: 14.5, color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.85, margin: j > 0 ? '12px 0 0' : 0 }}>
                        {para.split('\n').map((line, k, arr) => (
                          <span key={k}>{line}{k < arr.length - 1 && <br />}</span>
                        ))}
                      </p>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}

            <Reveal>
              <div style={{ background: 'var(--paper,#FAF5EB)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 18, padding: 'clamp(20px,3vw,32px)', textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: 'var(--ink-3,#5A6A8A)', margin: '0 0 16px' }}>Questions about our disclosures?</p>
                <a href="mailto:legal@creditiq.app" style={{ display: 'inline-block', background: 'var(--copper-3,#D89B2A)', color: '#fff', padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                  Email legal@creditiq.app
                </a>
              </div>
            </Reveal>
          </div>
        </section>
        <DesignFooter />
      </div>
    </>
  );
}
