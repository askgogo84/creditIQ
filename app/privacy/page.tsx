import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | CreditIQ',
  description: 'CreditIQ privacy policy -- how we collect, use, and protect your data. DPDP Act 2023 compliant.',
};

const LAST_UPDATED = 'May 20, 2026';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen" style={{ overflowX: 'hidden' }}>
      <Header />
      <section className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="divider-rule mb-6 max-w-xs">Legal</div>
          <h1 className="font-display text-4xl sm:text-5xl mb-4" style={{ color: 'var(--text)' }}>Privacy Policy</h1>
          <p className="mb-2" style={{ color: 'var(--text-muted)' }}>Last updated: {LAST_UPDATED}</p>
          <p className="mb-12 text-sm" style={{ color: 'var(--text-dim)' }}>Compliant with India's Digital Personal Data Protection (DPDP) Act 2023 and UAE PDPL.</p>

          <div className="space-y-10" style={{ color: 'var(--text-muted)' }}>

            {[
              {
                title: '1. Who we are',
                content: `CreditIQ ("we", "us", "our") is a product of Nexus AI, operated at creditiq.app. We provide credit card intelligence services including card comparison, points optimization, devaluation tracking, and card portfolio management for users in India, UAE, and Singapore.

Contact us: privacy@creditiq.app | WhatsApp: +91 83104 41698`
              },
              {
                title: '2. What data we collect',
                content: `We collect only the minimum data necessary to provide our services:

Account data: Name, email address, mobile number (when you register).

Card data (if you use card linking or SMS import): Masked card numbers (last 4 digits only), reward points balances, points expiry dates. We never collect card credentials, PINs, CVVs, or full card numbers.

Usage data: Pages visited, cards viewed, features used (anonymous, via Vercel Analytics).

Communications: If you subscribe to devaluation alerts, we store your email for this purpose only.

SMS data (if you use SMS import): Raw SMS content is processed to extract points data and immediately discarded. Only the extracted points balance is retained.`
              },
              {
                title: '3. How we use your data',
                content: `We use your data for the following purposes only:

-- To provide the CreditIQ service (card comparison, points tracking, devaluation alerts)
-- To send devaluation alerts you have explicitly subscribed to
-- To improve our card recommendation algorithms (anonymised, aggregated)
-- To comply with legal obligations

We do not use your data for advertising profiling. We do not sell your data to any third party. We do not share your data with banks or card issuers without your explicit consent.`
              },
              {
                title: '4. Account Aggregator data (Finvu/AA framework)',
                content: `If you use our card linking feature via the RBI Account Aggregator framework:

Your bank sends data directly to CreditIQ via the AA framework. We receive only read-only data (points balances, card identifiers). We never receive card credentials, transaction passwords, or OTPs.

Your consent is explicit and time-limited. You can revoke access at any time from your bank's app or by contacting us. Data received via AA is encrypted at rest and in transit using AES-256 encryption.

We are a Financial Information User (FIU) operating under the RBI AA framework guidelines.`
              },
              {
                title: '5. Data sharing',
                content: `We share data with the following third parties only:

Supabase (database): Your account and card data is stored on Supabase servers located in Singapore. Supabase is SOC 2 Type II certified.

Vercel (hosting): Our platform runs on Vercel infrastructure with edge servers in India, Singapore, and UAE.

Anthropic (AI): When you use our AI features (Smart Match, Points Optimizer), anonymised query data is processed by Anthropic's Claude API. No personally identifiable information is sent.

Finvu (Account Aggregator): Only when you explicitly link a card via AA. See Section 4.

We do not share data with any other party. We do not use Google Analytics, Facebook Pixel, or any advertising technology.`
              },
              {
                title: '6. Your rights (DPDP Act 2023)',
                content: `Under India's Digital Personal Data Protection Act 2023, you have the right to:

-- Access your personal data held by us
-- Correct inaccurate personal data
-- Erase your personal data (right to be forgotten)
-- Withdraw consent for data processing
-- Nominate a person to exercise your rights on your behalf
-- Raise a grievance with the Data Protection Board of India

To exercise any right, email privacy@creditiq.app or WhatsApp +91 83104 41698. We will respond within 72 hours.

UAE users: Rights under UAE Federal Decree-Law No. 45 of 2021 (PDPL) apply. Singapore users: Rights under the Personal Data Protection Act (PDPA) apply.`
              },
              {
                title: '7. Data retention',
                content: `Account data: Retained while your account is active. Deleted within 30 days of account deletion request.

Card points data: Retained for 12 months. Refreshed on each sync.

SMS import data: Raw SMS content deleted immediately after parsing. Extracted points data retained for 12 months.

Devaluation alert subscriptions: Retained until you unsubscribe.

We do not retain data beyond these periods.`
              },
              {
                title: '8. Security',
                content: `We protect your data using:

-- AES-256 encryption at rest for all stored data
-- TLS 1.3 encryption in transit
-- Row-level security (RLS) on all database tables
-- No storage of card credentials, PINs, or sensitive authentication data
-- Regular security audits via Sentry error monitoring
-- Access controls -- only the founding team can access production data

We hold SOC 2 alignment and are working toward full certification.`
              },
              {
                title: '9. Cookies',
                content: `We use only essential cookies required for the platform to function (session management, theme preference). We do not use advertising cookies, tracking pixels, or third-party analytics cookies.

You can disable cookies in your browser settings. This may affect platform functionality.`
              },
              {
                title: '10. Children',
                content: `CreditIQ is not intended for users under 18 years of age. We do not knowingly collect data from minors. If you believe a minor has provided us data, contact privacy@creditiq.app immediately.`
              },
              {
                title: '11. Changes to this policy',
                content: `We will notify you of material changes to this policy via email (if registered) and by updating the "Last updated" date above. Continued use of CreditIQ after changes constitutes acceptance of the updated policy.`
              },
              {
                title: '12. Contact & grievance officer',
                content: `Data Protection Officer / Grievance Officer:
Goverdhan M.D. (Gogo)
CreditIQ by Nexus AI
Bengaluru, Karnataka, India

Email: privacy@creditiq.app
WhatsApp: +91 83104 41698
Response time: 72 hours

For escalations, contact the Data Protection Board of India (once operational under DPDP Act 2023).`
              },
            ].map(({ title, content }) => (
              <div key={title}>
                <h2 className="font-display text-xl mb-3" style={{ color: 'var(--text)' }}>{title}</h2>
                <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-muted)' }}>{content}</div>
              </div>
            ))}

          </div>
        </div>
      </section>
      <DesignFooter />
    </main>
  );
}
