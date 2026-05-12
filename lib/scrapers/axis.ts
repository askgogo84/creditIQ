import type { BankAdapter, ScrapeResult } from './index';
import { makeGenericAdapter } from './generic';

const AXIS_LIST_URL = 'https://www.axisbank.com/retail/cards/credit-card';

const AXIS_CARDS = [
  'magnus', 'reserve', 'atlas', 'select', 'flipkart',
  'vistara-infinite', 'vistara-signature', 'horizon', 'pride', 'samman', 'ace',
];

export const axisAdapter: BankAdapter = {
  bank: 'Axis',
  list_url: AXIS_LIST_URL,
  async catalog() {
    return AXIS_CARDS.map((s) => `${AXIS_LIST_URL}/${s}-credit-card`);
  },
  async scrapeCard(url: string): Promise<ScrapeResult> {
    return makeGenericAdapter('Axis', AXIS_LIST_URL).scrapeCard(url);
  },
};
