import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | CreditIQ',
  description: 'Terms of Service for CreditIQ - India\'s honest credit card intelligence platform.',
}

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #f8f9fc)' }}>
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 100px' }}>
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted, #64748b)', marginBottom: 12 }}>Legal</p>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 900, color: 'var(--text, #0f172a)', margin: '0 0 12px', letterSpacing: -1 }}>
            Terms of Service
          </h1>
          <p style={{ color: 'var(--text-muted, #64748b)', fontSize: 14 }}>
            Last updated: May 24, 2026 &nbsp;.&nbsp; Effective: May 24, 2026
          </p>
        </div>

        <div style={{ color: 'var(--text, #1e293b)', lineHeight: 1.8, fontSize: 15 }}>

          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text, #0f172a)', marginBottom: 12 }}>1. Acceptance of Terms</h2>
            <p>By accessing or using CreditIQ ("the Platform", "we", "us", or "our") at creditiq.app, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.</p>
            <p style={{ marginTop: 12 }}>CreditIQ is operated by Nexus AI Ventures (Bengaluru, India). These terms apply to all visitors, users, and others who access or use the service.</p>
          </section>

          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text, #0f172a)', marginBottom: 12 }}>2. Description of Service</h2>
            <p>CreditIQ is an independent credit card intelligence and comparison platform. We provide:</p>
            <ul style={{ paddingLeft: 20, marginTop: 8 }}>
              <li style={{ marginBottom: 6 }}>Credit card comparison and analysis tools</li>
              <li style={{ marginBottom: 6 }}>AI-powered card recommendations based on spending patterns</li>
              <li style={{ marginBottom: 6 }}>Points optimization and redemption guidance</li>
              <li style={{ marginBottom: 6 }}>Travel planning with credit card points</li>
              <li style={{ marginBottom: 6 }}>Devaluation tracking and alerts</li>
            </ul>
          </section>

          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text, #0f172a)', marginBottom: 12 }}>3. Not Financial Advice</h2>
            <p style={{ fontWeight: 600, color: '#dc2626' }}>Important: CreditIQ is an information service, not a financial advisor.</p>
            <p style={{ marginTop: 8 }}>All content, recommendations, analyses, and AI outputs on this platform are for informational purposes only. Nothing on CreditIQ constitutes financial advice, investment advice, or a recommendation to apply for any specific credit card.</p>
            <p style={{ marginTop: 12 }}>Credit card terms change frequently. Always verify current terms, fees, and benefits directly with the issuing bank before applying. Reward rates and benefits mentioned may be outdated.</p>
          </section>

          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text, #0f172a)', marginBottom: 12 }}>4. Affiliate Disclosure</h2>
            <p>CreditIQ participates in affiliate programs. When you click "Apply Now" or "Apply & Earn" links, we may earn a commission from the card issuer or affiliate network (such as EarnKaro) if you are approved for the card.</p>
            <p style={{ marginTop: 12 }}>Our rankings and recommendations are based solely on card value for your spending pattern -- not on commission rates. Cards with higher commissions are not ranked higher. All affiliate links are clearly marked.</p>
          </section>

          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text, #0f172a)', marginBottom: 12 }}>5. User Accounts</h2>
            <p>When you create an account, you agree to:</p>
            <ul style={{ paddingLeft: 20, marginTop: 8 }}>
              <li style={{ marginBottom: 6 }}>Provide accurate and complete information</li>
              <li style={{ marginBottom: 6 }}>Maintain the security of your account credentials</li>
              <li style={{ marginBottom: 6 }}>Not share your account with others</li>
              <li style={{ marginBottom: 6 }}>Notify us immediately of any unauthorized access</li>
            </ul>
            <p style={{ marginTop: 12 }}>We reserve the right to terminate accounts that violate these terms.</p>
          </section>

          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text, #0f172a)', marginBottom: 12 }}>6. Prohibited Uses</h2>
            <p>You agree not to:</p>
            <ul style={{ paddingLeft: 20, marginTop: 8 }}>
              <li style={{ marginBottom: 6 }}>Use the platform for any unlawful purpose</li>
              <li style={{ marginBottom: 6 }}>Scrape, crawl, or systematically extract data without permission</li>
              <li style={{ marginBottom: 6 }}>Attempt to reverse engineer or compromise our systems</li>
              <li style={{ marginBottom: 6 }}>Submit false or misleading information</li>
              <li style={{ marginBottom: 6 }}>Use automated systems to access the platform at scale</li>
              <li style={{ marginBottom: 6 }}>Impersonate any person or entity</li>
            </ul>
          </section>

          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text, #0f172a)', marginBottom: 12 }}>7. Intellectual Property</h2>
            <p>All content on CreditIQ -- including our scoring methodology, AI models, card database, visual design, and written content -- is owned by Nexus AI Ventures and protected by applicable intellectual property laws.</p>
            <p style={{ marginTop: 12 }}>You may not reproduce, distribute, or create derivative works from our content without express written permission.</p>
          </section>

          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text, #0f172a)', marginBottom: 12 }}>8. Data and Privacy</h2>
            <p>Your use of CreditIQ is also governed by our <a href="/privacy" style={{ color: '#C9972E', textDecoration: 'underline' }}>Privacy Policy</a>, which is incorporated into these Terms by reference. By using the platform, you consent to the data practices described in our Privacy Policy.</p>
            <p style={{ marginTop: 12 }}>We comply with the Digital Personal Data Protection Act, 2023 (DPDPA) for Indian users.</p>
          </section>

          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text, #0f172a)', marginBottom: 12 }}>9. Disclaimer of Warranties</h2>
            <p>CreditIQ is provided "as is" without warranties of any kind. We do not warrant that:</p>
            <ul style={{ paddingLeft: 20, marginTop: 8 }}>
              <li style={{ marginBottom: 6 }}>The platform will be uninterrupted or error-free</li>
              <li style={{ marginBottom: 6 }}>Card data and reward rates will always be current or accurate</li>
              <li style={{ marginBottom: 6 }}>AI recommendations will result in card approval</li>
              <li style={{ marginBottom: 6 }}>The platform will meet your specific requirements</li>
            </ul>
          </section>

          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text, #0f172a)', marginBottom: 12 }}>10. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, CreditIQ and Nexus AI Ventures shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform, including but not limited to credit decisions, financial losses, or card application outcomes.</p>
          </section>

          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text, #0f172a)', marginBottom: 12 }}>11. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. We will notify users of significant changes via email or a prominent notice on the platform. Continued use after changes constitutes acceptance of the new terms.</p>
          </section>

          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text, #0f172a)', marginBottom: 12 }}>12. Governing Law</h2>
            <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka, India.</p>
          </section>

          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text, #0f172a)', marginBottom: 12 }}>13. Contact</h2>
            <p>For questions about these Terms, contact us:</p>
            <div style={{ marginTop: 12, padding: '16px 20px', background: 'var(--bg-elevated, #f1f5f9)', borderRadius: 12, fontSize: 14 }}>
              <p style={{ margin: 0 }}><strong>CreditIQ / Nexus AI Ventures</strong></p>
              <p style={{ margin: '4px 0 0' }}>Bengaluru, Karnataka, India</p>
              <p style={{ margin: '4px 0 0' }}>Email: <a href="mailto:hello@creditiq.app" style={{ color: '#C9972E' }}>hello@creditiq.app</a></p>
              <p style={{ margin: '4px 0 0' }}>WhatsApp: <a href="https://wa.me/918310441698" style={{ color: '#C9972E' }}>+91 83104 41698</a></p>
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}
