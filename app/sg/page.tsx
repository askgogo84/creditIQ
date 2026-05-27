import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Best Credit Cards Singapore 2026 | CreditIQ - Coming Soon',
  description: 'CreditIQ Singapore -- honest credit card comparison for DBS, OCBC, UOB, Citi Singapore. Coming in Q3 2026.',
};

export default function SGPage() {
  return (
    <main className="min-h-screen" style={{ overflowX: 'hidden' }}>
      <Header />
      <div className="pt-20 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2">
          <span className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>Market:</span>
          {[{ label: '🇮🇳 India', href: '/' }, { label: '🇦🇪 UAE', href: '/uae' }, { label: '🇸🇬 Singapore', href: '/sg', active: true }].map(m => (
            <Link key={m.href} href={m.href} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: (m as any).active ? 'var(--accent)' : 'transparent', color: (m as any).active ? 'var(--accent-text)' : 'var(--text-dim)', border: (m as any).active ? 'none' : '1px solid var(--border)' }}>
              {m.label}
            </Link>
          ))}
        </div>
      </div>
      <section className="pt-32 pb-20 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <div className="text-6xl mb-6">🇸🇬</div>
          <h1 className="font-display text-4xl mb-4" style={{ color: 'var(--text)' }}>Singapore is coming soon</h1>
          <p className="text-lg mb-8 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            We're building CreditIQ for Singapore -- DBS, OCBC, UOB, Citi, HSBC and more. Launching Q3 2026. Be the first to know.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <input type="email" placeholder="your@email.com" style={{ flex: 1, maxWidth: 280, padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, color: 'var(--text)', outline: 'none' }} />
            <button className="btn-primary">Notify me →</button>
          </div>
          <Link href="/uae" style={{ color: 'var(--accent)', fontSize: 14 }}>Browse UAE cards instead →</Link>
        </div>
      </section>
      <DesignFooter />
    </main>
  );
}
