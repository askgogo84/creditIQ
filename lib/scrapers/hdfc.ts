import type { BankAdapter, ScrapeResult } from './index';
import { makeGenericAdapter } from './generic';

const HDFC_LIST_URL = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards';

// Known HDFC card slugs (extend as scraper discovers more)
const HDFC_CARDS = [
  'infinia',
  'diners-club-black',
  'regalia-gold',
  'millennia',
  'moneyback-plus',
  'freedom',
  'tata-neu-infinity',
  'tata-neu-plus',
  'marriott-bonvoy',
  'shoppers-stop',
  'swiggy-credit-card',
  'irctc-credit-card',
  'rupay-credit-card',
];

export const hdfcAdapter: BankAdapter = {
  bank: 'HDFC',
  list_url: HDFC_LIST_URL,

  async catalog() {
    return HDFC_CARDS.map((slug) => `${HDFC_LIST_URL}/${slug}`);
  },

  async scrapeCard(url: string): Promise<ScrapeResult> {
    const generic = makeGenericAdapter('HDFC', HDFC_LIST_URL);
    return generic.scrapeCard(url);
  },
};
