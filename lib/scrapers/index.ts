// Scraper architecture for CreditIQ
// Each bank has an adapter that:
//  1. Lists the bank's credit card catalog URL(s)
//  2. Scrapes each card detail page
//  3. Returns raw HTML chunks
// A separate parser (parser.ts) uses Claude to convert raw HTML ' CreditCard JSON.

import type { CreditCard } from '../types';

export interface ScrapeTarget {
  bank: string;
  card_slug?: string; // null = list page
  url: string;
  selectors?: {
    name?: string;
    fee?: string;
    rewards?: string;
    benefits?: string;
  };
}

export interface ScrapeResult {
  bank: string;
  url: string;
  html: string;
  scraped_at: string;
  error?: string;
}

export interface BankAdapter {
  bank: string;
  list_url: string;
  card_url_pattern?: (slug: string) => string;
  catalog: () => Promise<string[]>; // Returns list of card detail URLs
  scrapeCard: (url: string) => Promise<ScrapeResult>;
}

// Adapter list " populated from individual bank files
export const ADAPTERS: Record<string, () => Promise<BankAdapter>> = {
  HDFC: () => import('./hdfc').then((m) => m.hdfcAdapter),
  SBI: () => import('./sbi').then((m) => m.sbiAdapter),
  ICICI: () => import('./icici').then((m) => m.iciciAdapter),
  Axis: () => import('./axis').then((m) => m.axisAdapter),
  Kotak: () => import('./generic').then((m) => m.makeGenericAdapter('Kotak', 'https://www.kotak.com/en/personal-banking/cards/credit-cards.html')),
  AmEx: () => import('./generic').then((m) => m.makeGenericAdapter('AmEx', 'https://www.americanexpress.com/in/credit-cards/')),
  IDFC: () => import('./generic').then((m) => m.makeGenericAdapter('IDFC', 'https://www.idfcfirstbank.com/credit-card')),
  RBL: () => import('./generic').then((m) => m.makeGenericAdapter('RBL', 'https://www.rblbank.com/category/credit-cards')),
  Yes: () => import('./generic').then((m) => m.makeGenericAdapter('Yes', 'https://www.yesbank.in/personal-banking/yes-individual/cards/credit-cards')),
  IndusInd: () => import('./generic').then((m) => m.makeGenericAdapter('IndusInd', 'https://www.indusind.com/in/en/personal/cards/credit-card.html')),
  SC: () => import('./generic').then((m) => m.makeGenericAdapter('SC', 'https://www.sc.com/in/credit-cards/')),
  AU: () => import('./generic').then((m) => m.makeGenericAdapter('AU', 'https://www.aubank.in/credit-cards')),
};

/**
 * Run scraper across all (or selected) banks.
 * Returns array of raw HTML results " feed to parser to convert to CreditCard[].
 */
export async function runScrapers(banks: string[] = Object.keys(ADAPTERS)): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];
  for (const bank of banks) {
    const factory = ADAPTERS[bank];
    if (!factory) continue;
    try {
      const adapter = await factory();
      const urls = await adapter.catalog();
      for (const url of urls.slice(0, 25)) {
        // cap per bank for safety
        try {
          const r = await adapter.scrapeCard(url);
          results.push(r);
        } catch (e: any) {
          results.push({ bank, url, html: '', scraped_at: new Date().toISOString(), error: e.message });
        }
      }
    } catch (e: any) {
      results.push({
        bank,
        url: '',
        html: '',
        scraped_at: new Date().toISOString(),
        error: `Adapter failed: ${e.message}`,
      });
    }
  }
  return results;
}

