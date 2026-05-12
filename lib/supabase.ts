import { createClient } from '@supabase/supabase-js';
import { SEED_CARDS } from './data/seed-cards';
import type { CreditCard } from './types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = supabaseEnabled
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/**
 * Fetch all cards — Supabase if configured, seed otherwise.
 * This is the canonical data access pattern across the app.
 */
export async function getAllCards(): Promise<CreditCard[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('active', true);
      if (error) throw error;
      if (data && data.length > 0) return data as CreditCard[];
    } catch (e) {
      console.warn('Supabase fetch failed, using seed:', e);
    }
  }
  return SEED_CARDS;
}

export async function getCardBySlug(slug: string): Promise<CreditCard | null> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('slug', slug)
        .single();
      if (!error && data) return data as CreditCard;
    } catch {}
  }
  return SEED_CARDS.find(c => c.slug === slug) ?? null;
}
