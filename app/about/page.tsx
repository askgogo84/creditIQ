import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CompareTray } from '@/components/CompareTray';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { TrendingDown, ShieldCheck, Zap, Eye, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  const allDevaluations = SEED_CARDS.flatMap((c) =>
    (c.devaluations ?? []).map((d) => ({ ...d, cardName: c.name, cardBank: c.bank, slug: c.slug }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <main className="min-h-screen">
      <Header />

      <section className="pt-32 pb-12 grain relative">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-copper-500/8 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6">
          <div className="divider-rule mb-6 max-w-xs">— The manifesto</div>
          <h1 className="font-display text-5xl md:text-7xl text-ink-50 leading-[0.95] mb-8">
            Why this site{' '}
            <span className="display-italic text-copper-400">exists</span>.
          </h1>

          <div className="prose prose-invert prose-lg max-w-none font-display text-ink-200 leading-relaxed space-y-6 mt-12">
            <p>
              In India, "credit card comparison" is a business model, not a service. Paisabazaar,
              BankBazaar, CardInsider — every major site earns ₹500 to ₹3,000 per approved
              application. The card that pays more, ranks higher. Period.
            </p>
            <p>
              We've watched friends apply for cards that were objectively wrong for their spending
              pattern because some affiliate site put them at the top. We've seen "Top 10 Travel
              Cards" lists that are really "Top 10 Cards That Pay Us The Most This Quarter."
            </p>
            <p className="text-copper-400 display-italic text-2xl md:text-3xl leading-snug py-4 border-l-2 border-copper-500 pl-6">
              We built CardIQ because the smartest financial decision of your year — which credit
              card to hold — deserves a recommendation that isn't bought.
            </p>
            <p>
              Our rankings are based on one thing: the actual rupee value a card generates for
              your spending pattern, minus its true costs. We track caps, fee waivers, milestone
              spends, redemption haircuts. We log every devaluation. We show our math.
            </p>
            <p>
              When (if) we eventually take affiliate commissions, we'll mark every affiliate link
              with a clear label, and rankings will remain independent of payouts. That's a hard
              promise.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 bg-ink-900/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                Icon: ShieldCheck,
                title: 'No paid rankings',
                detail:
                  'No bank can buy a position. No card can outbid another to appear on top. Rankings are determined by your spend profile and verifiable card data only.',
              },
              {
                Icon: Eye,
                title: 'Open methodology',
                detail:
                  'Our scoring engine is documented. Every recommendation shows its breakdown: gross rewards, fees, milestones, redemption value. No black boxes.',
              },
              {
                Icon: Zap,
                title: 'Live data',
                detail:
                  'Weekly scrapes of bank MITC documents. Crowdsourced devaluation reports. Recent reward rate changes appear in our ticker within days, not months.',
              },
              {
                Icon: TrendingDown,
                title: 'Devaluation tracking',
                detail:
                  "Indian banks devalued every premium card in 2025-26. We're the only platform that systematically tracks and surfaces this so you know when 'your card' stops being worth holding.",
              },
            ].map((p) => (
              <div key={p.title} className="space-y-3">
                <div className="w-10 h-10 rounded bg-copper-500/10 border border-copper-500/20 flex items-center justify-center text-copper-400">
                  <p.Icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-xl text-ink-50">{p.title}</h3>
                <p className="text-sm text-ink-300 leading-relaxed">{p.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24" id="devaluations">
        <div className="max-w-5xl mx-auto px-6">
          <div className="divider-rule mb-4 max-w-xs">— The log</div>
          <h2 className="font-display text-4xl md:text-5xl text-ink-50 leading-[1.05] mb-4">
            Tracked devaluations
          </h2>
          <p className="text-ink-300 font-display mb-12 max-w-2xl leading-relaxed">
            Every documented change we've logged across the catalog. Sorted by date.
          </p>

          <div className="space-y-3">
            {allDevaluations.map((d, i) => (
              <Link
                key={i}
                href={`/card/${d.slug}`}
                className="grid grid-cols-[auto,1fr,auto] gap-4 items-center px-5 py-4 bg-ink-900/40 border border-white/10 rounded hover:border-copper-500/30 transition"
              >
                <div className="font-mono text-sm text-ink-300 tabular w-24">
                  {new Date(d.date).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                  })}
                </div>
                <div>
                  <div className="text-sm text-ink-100">
                    <span className="font-medium">{d.cardName}</span>
                    {' · '}
                    <span className="text-ink-300">{d.description}</span>
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-ink-500 mt-1">
                    {d.category.replace('-', ' ')}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded ${
                      d.impact === 'high'
                        ? 'bg-crimson-500/15 text-crimson-300'
                        : d.impact === 'medium'
                        ? 'bg-copper-500/15 text-copper-300'
                        : 'bg-white/5 text-ink-300'
                    }`}
                  >
                    {d.impact}
                  </div>
                  <ArrowRight className="w-4 h-4 text-ink-500" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <CompareTray />
    </main>
  );
}
