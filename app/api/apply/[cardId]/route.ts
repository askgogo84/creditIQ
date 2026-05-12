import { NextRequest, NextResponse } from 'next/server';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { getApplyUrl } from '@/lib/affiliate';

export const runtime = 'edge';

export async function GET(req: NextRequest, { params }: { params: { cardId: string } }) {
  const card = SEED_CARDS.find((c) => c.id === params.cardId);
  if (!card) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const { url, type } = getApplyUrl(card);

  // TODO: Log click to analytics (Supabase applications table)
  // For now we just redirect

  // Add UTM tracking
  const separator = url.includes('?') ? '&' : '?';
  const tracked = `${url}${separator}utm_source=cardiq&utm_medium=apply_button&utm_campaign=card_detail`;

  return NextResponse.redirect(tracked);
}
