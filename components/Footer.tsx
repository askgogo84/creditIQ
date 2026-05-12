import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-white/5 mt-20 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-copper-300 via-copper-500 to-copper-700 flex items-center justify-center">
                <span className="font-display font-bold text-ink-950 text-sm">C</span>
              </div>
              <span className="font-display text-xl text-ink-50">CardIQ</span>
            </div>
            <p className="text-sm text-ink-300 max-w-md font-display leading-relaxed">
              India's first affiliate-bias-free credit card intelligence platform. Built by{' '}
              <a href="https://askgogo.in" className="text-copper-400 link-underline">
                AskGogo
              </a>
              .
            </p>
            <div className="text-xs text-ink-500 mt-6 font-mono uppercase tracking-widest">
              © {new Date().getFullYear()} CardIQ · Made in Bengaluru
            </div>
          </div>

          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-ink-400 mb-4">
              Product
            </div>
            <ul className="space-y-2.5 text-sm text-ink-200">
              <li>
                <Link href="/smart-match" className="hover:text-copper-300">
                  Smart Match
                </Link>
              </li>
              <li>
                <Link href="/optimize" className="hover:text-copper-300">
                  Points Optimizer
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-copper-300">
                  Compare
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-copper-300">
                  Manifesto
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-ink-400 mb-4">
              Resources
            </div>
            <ul className="space-y-2.5 text-sm text-ink-200">
              <li>
                <a href="#" className="hover:text-copper-300">
                  Devaluation log
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-copper-300">
                  Methodology
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-copper-300">
                  API (coming)
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-copper-300">
                  Press kit
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 text-xs text-ink-500 leading-relaxed max-w-3xl">
          Disclaimer: CardIQ is an information service. We are not a financial advisor. Card terms,
          fees, and benefits change frequently — verify with the issuing bank before applying.
          Where we earn affiliate commissions (clearly labeled), it does not affect rankings.
        </div>
      </div>
    </footer>
  );
}
