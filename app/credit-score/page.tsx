'use client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CompareTray } from '@/components/CompareTray';
import { ExternalLink, ShieldCheck, TrendingUp, AlertCircle } from 'lucide-react';

const SCORE_RANGES = [
  { range: '300-549', label: 'Poor', color: '#e11d48', desc: 'Very difficult to get approved. Work on improving before applying.', cards: 'Secured/FD-backed cards only' },
  { range: '550-649', label: 'Fair', color: '#f97316', desc: 'Limited options. Entry-level cards with lower credit limits.', cards: 'Kotak 811, IDFC Classic' },
  { range: '650-699', label: 'Good', color: '#eab308', desc: 'Most entry-level and mid-tier cards available to you.', cards: 'Amazon Pay ICICI, SBI Cashback, HDFC Millennia' },
  { range: '700-749', label: 'Very Good', color: '#84cc16', desc: 'Wide range of cards including premium options.', cards: 'Axis ACE, Flipkart Axis, IDFC Wealth' },
  { range: '750-799', label: 'Excellent', color: '#22c55e', desc: 'Almost all cards available. Premium cards within reach.', cards: 'HDFC Regalia, Axis Atlas, SC Ultimate' },
  { range: '800-900', label: 'Exceptional', color: '#10b981', desc: 'Best rates, highest limits, super-premium cards.', cards: 'HDFC Infinia, Axis Magnus, IndusInd Pinnacle' },
];

const FREE_SERVICES = [
  { name: 'CIBIL Free Score', url: 'https://www.cibil.com/freecibil', desc: 'Official CIBIL score — free once a year', org: 'TransUnion CIBIL' },
  { name: 'Paisabazaar Free Score', url: 'https://www.paisabazaar.com/cibil-score/', desc: 'Free CIBIL score with monthly updates', org: 'Paisabazaar' },
  { name: 'BankBazaar Free Score', url: 'https://www.bankbazaar.com/cibil-score.html', desc: 'Free Experian score + CIBIL', org: 'BankBazaar' },
  { name: 'OneScore App', url: 'https://www.onescore.app/', desc: 'Free CIBIL score with detailed analysis', org: 'OneScore' },
];

export default function CreditScorePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="pt-28 pb-12 px-4 sm:px-6 grain relative">
        <div className="max-w-4xl mx-auto">
          <div className="divider-rule mb-6 max-w-xs">Credit score guide</div>
          <h1 className="font-display text-4xl sm:text-5xl text-ink-50 mb-4 leading-tight">
            Check your CIBIL score.{' '}
            <span className="display-italic text-copper-400">Free.</span>
          </h1>
          <p className="text-ink-300 text-lg font-display leading-relaxed mb-8">
            Your credit score determines which cards you can get approved for. Check it free — no hard inquiry, no effect on your score.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-12">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-300">Checking your score does NOT affect it (soft inquiry only)</span>
          </div>
        </div>
      </section>

      <section className="pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-12">

          <div>
            <h2 className="font-display text-2xl text-ink-50 mb-6">Free places to check your score</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {FREE_SERVICES.map(s => (
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                  className="group bg-ink-900/40 border border-white/10 hover:border-copper-500/30 rounded-xl p-5 transition-all block">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-ink-50 group-hover:text-copper-300 transition-colors">{s.name}</div>
                    <ExternalLink className="w-4 h-4 text-ink-400 group-hover:text-copper-400 shrink-0" />
                  </div>
                  <div className="text-sm text-ink-300 mb-2">{s.desc}</div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-ink-500">{s.org}</div>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl text-ink-50 mb-6">What your score means for credit cards</h2>
            <div className="space-y-3">
              {SCORE_RANGES.map(r => (
                <div key={r.range} className="bg-ink-900/40 border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="font-display text-xl tabular font-bold" style={{ color: r.color, minWidth: 90 }}>{r.range}</div>
                    <div className="text-sm font-bold" style={{ color: r.color }}>{r.label}</div>
                    <div className="text-sm text-ink-300 flex-1">{r.desc}</div>
                  </div>
                  <div className="mt-2 text-xs text-ink-400">
                    <span className="text-ink-500 font-mono uppercase tracking-widest">Cards available: </span>
                    {r.cards}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-copper-500/10 border border-copper-500/30 rounded-xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-copper-400 shrink-0 mt-0.5" />
              <h2 className="font-display text-xl text-ink-50">How to improve your score fast</h2>
            </div>
            <div className="space-y-3 text-sm text-ink-200">
              {[
                ['Pay on time, every time', 'Payment history is 35% of your score. Set auto-pay for the minimum at least.'],
                ['Keep utilisation below 30%', 'If your limit is ₹1L, keep outstanding below ₹30K. Ideally below 10%.'],
                ['Don\'t apply for multiple cards at once', 'Each application is a hard inquiry and drops your score by 5-10 points.'],
                ['Keep old cards open', 'Length of credit history matters. Don\'t close your oldest card.'],
                ['Check for errors', 'Dispute any incorrect entries on your CIBIL report — they take them seriously.'],
              ].map(([title, desc]) => (
                <div key={title} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-copper-400 shrink-0 mt-2" />
                  <div><span className="font-medium text-ink-100">{title}:</span> {desc}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>
      <Footer />
      <CompareTray />
    </main>
  );
}
