import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import { Reveal } from '@/components/design/Reveal';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | CreditIQ',
  description: 'Terms of service for CreditIQ — India\'s unbiased credit card intelligence platform.',
};

const SECTIONS = [
  {
    title: 'Acceptance of terms',
    body: `By using CreditIQ (creditiq.app), you agree to these terms. If you do not agree, please do not use the platform. These terms apply to all visitors, registered users, and anyone who accesses our tools or content.

CreditIQ Intelligence Pvt Ltd ("CreditIQ", "we", "us") operates this platform from Bengaluru, Karnataka, India.`,
  },
  {
    title: 'What CreditIQ is — and is not',
    body: `CreditIQ is an information and comparison platform. We help you understand, compare, and choose credit cards using data and AI tools. We are not a financial advisor, bank, or credit intermediary.

Nothing on CreditIQ constitutes financial advice. Our recommendations are based on publicly available card data and the information you provide. You should independently verify any card terms before applying.

We are not responsible for the accuracy of information provided by banks on their own products. Card terms, fees, and rewards can change without notice — always check with the issuer before applying.`,
  },
  {
    title: 'User accounts',
    body: `You may use some features without an account. For personalised features (wallet, saved cards, alerts), you need to register with a valid email address.

You are responsible for maintaining the confidentiality of your login credentials. You agree to notify us immediately at support@creditiq.app if you suspect unauthorised access to your account.

We reserve the right to suspend or terminate accounts that violate these terms or engage in abusive behaviour.`,
  },
  {
    title: 'Prohibited uses',
    body: `You agree not to:

— Scrape, crawl, or systematically extract data from CreditIQ without written permission
— Use CreditIQ to build competing products or services
— Attempt to access systems or data you are not authorised to access
— Upload malicious content or attempt to compromise our infrastructure
— Misrepresent your identity or impersonate others
— Use the platform for any unlawful purpose under Indian law`,
  },
  {
    title: 'Affiliate links and how we earn',
    body: `CreditIQ earns commission when you apply for a credit card through our affiliate links. These commissions come from banks and card issuers — not from you. The commission does not affect the card terms, annual fee, or rewards you receive.

We show all cards in our database regardless of whether they have affiliate links. Our rankings and recommendations are based on value for the user — not commission rates. Cards without affiliate links appear alongside those with them.

Affiliate relationships are disclosed on our "How we earn" page.`,
  },
  {
    title: 'Intellectual property',
    body: `All content on CreditIQ — including our scoring methodology, card data, written articles, tools, and design — is owned by CreditIQ Intelligence Pvt Ltd or licensed to us. You may not reproduce, distribute, or create derivative works without explicit written permission.

You may share links to our pages. You may quote brief excerpts (under 50 words) with attribution and a link back to the source.`,
  },
  {
    title: 'Disclaimers and limitation of liability',
    body: `CreditIQ is provided "as is" without warranty of any kind. We do not guarantee that our card data is complete, accurate, or current at all times.

To the maximum extent permitted under Indian law, CreditIQ is not liable for any indirect, incidental, or consequential damages arising from your use of the platform — including but not limited to losses from card application decisions made based on our content.

Our total liability to you for any claim arising from your use of CreditIQ shall not exceed Rs.1,000 or the amount you paid us in the preceding 12 months, whichever is greater.`,
  },
  {
    title: 'Governing law',
    body: `These terms are governed by the laws of India. Any disputes arising from these terms or your use of CreditIQ shall be subject to the exclusive jurisdiction of the courts of Bengaluru, Karnataka.`,
  },
  {
    title: 'Changes to these terms',
    body: `We may update these terms as the product evolves. We will notify registered users of material changes via email at least 14 days before they take effect. Continued use of the platform after that date constitutes acceptance of the updated terms.

Last updated: May 2026.`,
  },
  {
    title: 'Contact',
    body: `For terms-related questions: legal@creditiq.app

CreditIQ Intelligence Pvt Ltd
Bengaluru, Karnataka, India`,
  },
];

export default function TermsPage() {
  return (
    <>
      <Header />
      <div className="page-fade">
        <section style={{ position: 'relative', paddingTop: 'clamp(120px,18vw,150px)', paddingBottom: 48 }}>
          <div className="aurora" style={{ top: -80, right: -100, width: 600, height: 500, background: 'radial-gradient(circle,rgba(212,163,115,0.18),transparent 60%)' }} />
          <div className="shell" style={{ position: 'relative', zIndex: 2 }}>
            <Reveal>
              <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', fontWeight: 700, marginBottom: 16 }}>Last updated May 2026</div>
              <h1 style={{ fontSize: 'clamp(36px,6vw,72px)', fontWeight: 800, color: 'var(--ink,#142950)', lineHeight: 1.05, letterSpacing: '-0.03em', margin: '0 0 16px' }}>
                Terms of{' '}
                <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)', fontStyle: 'italic', fontWeight: 400 }}>Service</span>
              </h1>
              <p style={{ fontSize: 16, color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.7, margin: 0, maxWidth: 520 }}>
                Plain English. No legalese where we can avoid it. If something is unclear, email us.
              </p>
            </Reveal>
          </div>
        </section>

        <section style={{ paddingBottom: 80 }}>
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {SECTIONS.map((s, i) => (
              <Reveal key={i} style={{ animationDelay: `${i * 40}ms` }}>
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
          </div>
        </section>
        <DesignFooter />
      </div>
    </>
  );
}
