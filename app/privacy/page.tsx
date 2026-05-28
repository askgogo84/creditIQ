import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import { Reveal } from '@/components/design/Reveal';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | CreditIQ',
  description: 'How CreditIQ collects, uses, and protects your personal information.',
};

const SECTIONS = [
  {
    title: 'What we collect',
    body: `When you use CreditIQ, we collect information you provide directly — such as your email address when you create an account, and card details you enter to use our tools. We also collect usage data automatically: pages visited, features used, and general device/browser information.

We do not collect your credit card numbers, CVV, or bank account credentials. Our tools are designed to work with the information you choose to share about your spending patterns and card preferences — not with sensitive financial credentials.`,
  },
  {
    title: 'How we use it',
    body: `We use your information to:

— Provide and improve our card recommendation tools
— Send you account-related emails (receipts, alerts you subscribe to)
— Analyse usage patterns to improve the product
— Comply with applicable Indian law (DPDP Act 2023)

We do not sell your personal information to third parties. We do not share your data with banks or card issuers. The affiliate commissions we earn are based on your click activity — not your personal profile.`,
  },
  {
    title: 'Cookies and tracking',
    body: `We use cookies for authentication (keeping you logged in), analytics (understanding how people use the product), and performance. We use Vercel Analytics and Sentry for error tracking.

We do not use cross-site advertising cookies. We do not use your data for retargeting on other platforms. You can disable cookies in your browser, though some features may not function correctly.`,
  },
  {
    title: 'Data storage and security',
    body: `Your data is stored on Supabase infrastructure hosted in AWS regions. We use row-level security (RLS) to ensure users can only access their own data. All data in transit is encrypted via TLS 1.2+.

We retain account data for as long as your account is active. If you delete your account, we remove your personal data within 30 days, except where retention is required by law.`,
  },
  {
    title: 'Your rights (DPDP Act 2023)',
    body: `Under India's Digital Personal Data Protection Act 2023, you have the right to:

— Access the personal data we hold about you
— Correct inaccurate personal data
— Request erasure of your personal data
— Withdraw consent at any time
— Nominate a representative for data decisions

To exercise any of these rights, email us at privacy@creditiq.app. We will respond within 30 days.`,
  },
  {
    title: 'Third-party links',
    body: `CreditIQ contains links to third-party sites (card application pages, bank websites, affiliate partners). Once you click those links, you are subject to those sites' privacy policies. We are not responsible for their data practices.

Our affiliate links use EarnKaro and direct bank partnerships. We earn a commission when you apply for a card through our links — this does not affect the price you pay or the terms you receive.`,
  },
  {
    title: 'Changes to this policy',
    body: `We may update this policy as our product evolves or as legal requirements change. We will notify registered users of material changes via email at least 14 days before they take effect.

Last updated: May 2026.`,
  },
  {
    title: 'Contact',
    body: `For privacy questions, contact us at privacy@creditiq.app or write to:

CreditIQ Intelligence Pvt Ltd
Bengaluru, Karnataka, India`,
  },
];

export default function PrivacyPage() {
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
                Privacy{' '}
                <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)', fontStyle: 'italic', fontWeight: 400 }}>Policy</span>
              </h1>
              <p style={{ fontSize: 16, color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.7, margin: 0, maxWidth: 560 }}>
                We built CreditIQ because banks hide things from you. We think you deserve the same transparency from us.
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
