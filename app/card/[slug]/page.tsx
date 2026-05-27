import { notFound } from 'next/navigation';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import { CompareTray } from '@/components/CompareTray';
import { CardMockup } from '@/components/cards/CardMockup';
import { CardDetailClient } from './CardDetailClient';

export async function generateStaticParams() {
  return SEED_CARDS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const card = SEED_CARDS.find((c) => c.slug === params.slug);
  if (!card) return { title: 'Card not found | CardIQ' };
  const fee = card.annual_fee_inr === 0 ? 'zero annual fee' : `Rs.${card.annual_fee_inr} annual fee`;
  const desc = `${card.name} review -- ${card.best_for}. ${fee}, ${card.base_reward_rate}% base reward rate. Compare with other ${card.bank} credit cards on CardIQ.`;
  return {
    title: `${card.name} Review 2026 | CardIQ`,
    description: desc,
    keywords: [`${card.name}`, `${card.bank} credit card`, `${card.name} review`, `${card.name} benefits`, `best ${card.bank} credit card india`],
    openGraph: {
      title: `${card.name} - Honest Review | CardIQ`,
      description: desc,
      url: `https://creditiq.app/card/${card.slug}`,
      images: [`https://creditiq.app/og?title=${encodeURIComponent(card.name)}&subtitle=${encodeURIComponent(card.best_for)}&badge=${encodeURIComponent(card.bank)}`],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${card.name} Review | CardIQ`,
      description: desc,
    },
    alternates: { canonical: `https://creditiq.app/card/${card.slug}` },
  };
}

export default function CardDetailPage({ params }: { params: { slug: string } }) {
  const card = SEED_CARDS.find((c) => c.slug === params.slug);
  if (!card) notFound();

  return (
    <main className="page-fade">
      <Header />
      <CardDetailClient card={card} />
      <DesignFooter />
      <CompareTray />
    </main>
  );
}
