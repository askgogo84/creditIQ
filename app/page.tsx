import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { DevaluationTicker } from '@/components/DevaluationTicker';
import { Features } from '@/components/Features';
import { Manifesto } from '@/components/Manifesto';
import { CardCatalog } from '@/components/CardCatalog';
import { Footer } from '@/components/Footer';
import { CompareTray } from '@/components/CompareTray';
import { DevaluationAlerts } from '@/components/DevaluationAlerts';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <DevaluationTicker />
      <Features />
      <Manifesto />
      <CardCatalog />
      <section className="py-16 bg-ink-900/40 border-t border-white/5"><div className="max-w-2xl mx-auto px-4 sm:px-6"><DevaluationAlerts /></div></section>
      <Footer />
      <CompareTray />
    </main>
  );
}
