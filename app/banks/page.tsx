import { SEED_CARDS } from '@/lib/data/seed-cards';
import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import Link from 'next/link';

const BANKS = [
  { slug: 'HDFC', name: 'HDFC Bank', color: '#004C8F' },
  { slug: 'SBI', name: 'State Bank of India', color: '#2C4C9C' },
  { slug: 'ICICI', name: 'ICICI Bank', color: '#F58220' },
  { slug: 'Axis', name: 'Axis Bank', color: '#97144D' },
  { slug: 'Kotak', name: 'Kotak Mahindra', color: '#EF3E23' },
  { slug: 'AmEx', name: 'American Express', color: '#006FCF' },
  { slug: 'IDFC', name: 'IDFC FIRST Bank', color: '#9B0C2C' },
  { slug: 'RBL', name: 'RBL Bank', color: '#1D4ED8' },
  { slug: 'Yes', name: 'YES Bank', color: '#0C2461' },
  { slug: 'IndusInd', name: 'IndusInd Bank', color: '#312E81' },
  { slug: 'SC', name: 'Standard Chartered', color: '#0473EA' },
  { slug: 'AU', name: 'AU Small Finance Bank', color: '#7C2D12' },
];

export default function BanksPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="pt-28 pb-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="divider-rule mb-6 max-w-xs">Card issuers</div>
          <h1 className="font-display text-4xl sm:text-5xl text-ink-50 mb-4">All banks and issuers</h1>
          <p className="text-ink-300 mb-12 max-w-2xl">Browse credit cards by issuing bank. We track {SEED_CARDS.length} cards across {BANKS.length} issuers.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {BANKS.map(bank => {
              const count = SEED_CARDS.filter(c => c.bank === bank.slug && c.active).length;
              return (
                <Link key={bank.slug} href={`/bank/${bank.slug}`} className="group bg-ink-900/40 border border-white/10 hover:border-copper-500/30 rounded-xl p-5 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: bank.color }}>
                      {bank.slug.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium text-ink-50 group-hover:text-copper-300 transition-colors">{bank.name}</div>
                      <div className="text-xs text-ink-400 font-mono">{count} card{count !== 1 ? 's' : ''} tracked</div>
                    </div>
                  </div>
                  <div className="text-xs text-copper-400 font-mono">View all cards →</div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      <DesignFooter />
      
    </main>
  );
}
