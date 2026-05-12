import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { DevaluationTicker } from '@/components/DevaluationTicker';
import { Features } from '@/components/Features';
import { Manifesto } from '@/components/Manifesto';
import { CardCatalog } from '@/components/CardCatalog';
import { Footer } from '@/components/Footer';
import { CompareTray } from '@/components/CompareTray';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <DevaluationTicker />
      <Features />
      <Manifesto />
      <CardCatalog />
      <Footer />
      <CompareTray />
    </main>
  );
}
