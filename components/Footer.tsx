import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-white/5 mt-20 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10">
          <div className="sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-copper-300 via-copper-500 to-copper-700 flex items-center justify-center">
                <span className="font-display font-bold text-white text-sm">C</span>
              </div>
              <span className="font-display text-xl" style={{ color: 'var(--text)' }}>CreditIQ</span>
            </div>
            <p className="text-sm font-display leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              India's first affiliate-bias-free credit card intelligence platform. {' '}
              <span style={{ color: 'var(--text-dim)' }}>93 cards tracked.</span>
            </p>
            <div className="text-xs font-mono uppercase tracking-widest mt-4" style={{ color: 'var(--text-dim)' }}>
              © {new Date().getFullYear()} CreditIQ · Bengaluru
            </div>
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--text-dim)' }}>Product</div>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: '/smart-match', label: 'Smart Match' },
                { href: '/optimize', label: 'Points Optimizer' },
                { href: '/compare', label: 'Compare Cards' },
                { href: '/about', label: 'Manifesto' },
              ].map(l => (
                <li key={l.href}><Link href={l.href} className="hover:text-copper-400 transition-colors" style={{ color: 'var(--text-muted)' }}>{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--text-dim)' }}>Resources</div>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: '/banks', label: 'Card Issuers' },
                { href: '/calculators', label: 'Calculators' },
                { href: '/credit-score', label: 'Credit Score Guide' },
                { href: '/glossary', label: 'Glossary' },
                { href: '/application-status', label: 'Application Status' },
              ].map(l => (
                <li key={l.href}><Link href={l.href} className="hover:text-copper-400 transition-colors" style={{ color: 'var(--text-muted)' }}>{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--text-dim)' }}>Legal</div>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/about#devaluations', label: 'Devaluation Log' },
                { href: '/about', label: 'Methodology' },
              ].map(l => (
                <li key={l.href}><Link href={l.href} className="hover:text-copper-400 transition-colors" style={{ color: 'var(--text-muted)' }}>{l.label}</Link></li>
              ))}
            </ul>
            <div className="mt-6 text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
              Affiliate links are clearly marked. Rankings are never paid for.
            </div>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t text-xs leading-relaxed max-w-3xl" style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
          Disclaimer: CreditIQ is an information service. We are not a financial advisor. Card terms change frequently — verify with the issuing bank before applying.
        </div>
      </div>
    </footer>
  );
}
