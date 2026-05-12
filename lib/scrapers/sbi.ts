import type { BankAdapter, ScrapeResult } from './index';
import { makeGenericAdapter } from './generic';

const SBI_LIST_URL = 'https://www.sbicard.com/en/personal/credit-cards.page';

const SBI_CARDS = [
  'cashback', 'elite', 'prime', 'simplyclick', 'simplysave', 'air-india-signature',
  'irctc-rupay', 'bpcl-octane', 'club-vistara', 'ola-money', 'apollo',
];

export const sbiAdapter: BankAdapter = {
  bank: 'SBI',
  list_url: SBI_LIST_URL,
  async catalog() {
    return SBI_CARDS.map((s) => `${SBI_LIST_URL.replace('.page', '')}/${s}.page`);
  },
  async scrapeCard(url: string): Promise<ScrapeResult> {
    return makeGenericAdapter('SBI', SBI_LIST_URL).scrapeCard(url);
  },
};
