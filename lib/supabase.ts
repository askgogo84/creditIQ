import { SEED_CARDS } from './data/seed-cards';
import type { CreditCard } from './types';

export const supabaseEnabled = false;
export const supabase = null;

export async function getAllCards(): Promise<CreditCard[]> {
  return SEED_CARDS;
}

export async function getCardBySlug(slug: string): Promise<CreditCard | null> {
  return SEED_CARDS.find(c => c.slug === slug) ?? null;
}
