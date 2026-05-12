import { notFound } from 'next/navigation';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CompareTray } from '@/components/CompareTray';
import { CardMockup } from '@/components/cards/CardMockup';
import { CardDetailClient } from './CardDetailClient';

export async function generateStaticParams() {
  return SEED_CARDS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const card = SEED_CARDS.find((c) => c.slug === params.slug);
  if (!card) return { title: 'Card not found · CardIQ' };
  return {
    title: `${card.name} · CardIQ`,
    description: card.best_for,
  };
}

export default function CardDetailPage({ params }: { params: { slug: string } }) {
  const card = SEED_CARDS.find((c) => c.slug === params.slug);
  if (!card) notFound();

  return (
    <main className="min-h-screen">
      <Header />
      <CardDetailClient card={card} />
      <Footer />
      <CompareTray />
    </main>
  );
}
