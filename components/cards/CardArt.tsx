'use client';

import Image from 'next/image';
import type { CreditCard } from '@/lib/types';
import { hasCardArt, cardArtSrc } from '@/lib/data/card-art-manifest';

interface CardArtProps {
  /** The card to depict — only slug (lookup) and name (alt text) are used. */
  card: Pick<CreditCard, 'slug' | 'name'>;
  /** Intrinsic size hint for next/image. Rendered responsive (width:100%). */
  width?: number;
  height?: number;
  className?: string;
  /**
   * The surface's existing CSS card tile (CardMockup / CreditCard3D). Rendered
   * verbatim whenever no self-hosted image exists for this slug — which is
   * ALWAYS today, since the manifest ships empty. This is what guarantees every
   * surface looks byte-for-byte identical until real art is added.
   */
  children: React.ReactNode;
}

/**
 * CardArt — one place that decides "real image vs CSS fallback" for a card face.
 *
 * If public/cards/<slug>.webp exists (per card-art-manifest), it renders that
 * self-hosted image. Otherwise it renders `children` unchanged. It never
 * hotlinks and never shows a broken image: an absent slug simply falls back.
 */
export function CardArt({ card, width = 1000, height = 630, className, children }: CardArtProps) {
  if (!card?.slug || !hasCardArt(card.slug)) return <>{children}</>;
  return (
    <Image
      src={cardArtSrc(card.slug)}
      alt={card.name || 'Credit card'}
      width={width}
      height={height}
      className={className}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    />
  );
}
