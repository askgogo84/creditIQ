import type { BankAdapter, ScrapeResult } from './index';
import { makeGenericAdapter } from './generic';

const ICICI_LIST_URL = 'https://www.icicibank.com/personal-banking/cards/credit-card';

const ICICI_CARDS = [
  'amazon-pay', 'sapphiro', 'emeralde', 'rubyx', 'platinum-chip',
  'coral', 'manchester-united', 'mmtblack', 'expressions', 'instant-platinum',
];

export const iciciAdapter: BankAdapter = {
  bank: 'ICICI',
  list_url: ICICI_LIST_URL,
  async catalog() {
    return ICICI_CARDS.map((s) => `${ICICI_LIST_URL}/${s}-credit-card`);
  },
  async scrapeCard(url: string): Promise<ScrapeResult> {
    return makeGenericAdapter('ICICI', ICICI_LIST_URL).scrapeCard(url);
  },
};
