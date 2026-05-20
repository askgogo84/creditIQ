import type { CreditCard } from './types';

// Real affiliate URLs — update these once you have partner IDs
// Priority: EarnKaro > Paisabazaar > Bank direct page

const EARNKARO_BASE = 'https://earnkaro.com/redirect';
const PB_BASE = 'https://www.paisabazaar.com/credit-card';

// Bank direct application URLs (no affiliate ID yet — use these as fallback)
const BANK_DIRECT: Record<string, string> = {
  HDFC: 'https://applyonline.hdfcbank.com/cards/credit-cards.html',
  SBI: 'https://www.sbicard.com/en/personal/credit-cards.page',
  ICICI: 'https://www.icicibank.com/personal-banking/cards/credit-card',
  Axis: 'https://www.axisbank.com/retail/credit-cards',
  Kotak: 'https://www.kotak.com/en/credit-cards.html',
  AmEx: 'https://www.americanexpress.com/en-in/credit-cards/',
  IDFC: 'https://www.idfcfirstbank.com/credit-card',
  RBL: 'https://www.rblbank.com/cards/credit-card',
  Yes: 'https://www.yesbank.in/personal-banking/yes-individual/cards/credit-card',
  IndusInd: 'https://www.indusind.com/in/en/personal/cards/credit-card.html',
  SC: 'https://www.sc.com/in/credit-cards/',
  AU: 'https://www.aubank.in/credit-cards',
  Federal: 'https://www.federalbank.co.in/credit-cards',
  HSBC: 'https://www.hsbc.co.in/credit-cards/',
  OneCard: 'https://www.getonecard.app/',
  BOB: 'https://www.bankofbaroda.in/personal-banking/cards/credit-cards',
  IDBI: 'https://www.idbibank.in/credit-card.aspx',
};

// Paisabazaar card-specific URLs (high commission aggregator)
const PB_CARD_URLS: Record<string, string> = {
  'hdfc-infinia': 'https://www.paisabazaar.com/credit-card/hdfc-infinia-credit-card/',
  'hdfc-regalia-gold': 'https://www.paisabazaar.com/credit-card/hdfc-regalia-gold-credit-card/',
  'hdfc-millennia': 'https://www.paisabazaar.com/credit-card/hdfc-millennia-credit-card/',
  'hdfc-diners-black': 'https://www.paisabazaar.com/credit-card/hdfc-diners-club-black-credit-card/',
  'axis-magnus-burgundy': 'https://www.paisabazaar.com/credit-card/axis-bank-magnus-credit-card/',
  'axis-atlas': 'https://www.paisabazaar.com/credit-card/axis-bank-atlas-credit-card/',
  'axis-ace': 'https://www.paisabazaar.com/credit-card/axis-bank-ace-credit-card/',
  'amex-platinum-travel': 'https://www.paisabazaar.com/credit-card/american-express-platinum-travel-credit-card/',
  'amex-gold': 'https://www.paisabazaar.com/credit-card/american-express-gold-credit-card/',
  'amex-mrcc': 'https://www.paisabazaar.com/credit-card/american-express-membership-rewards-credit-card/',
  'sbi-cashback': 'https://www.paisabazaar.com/credit-card/sbi-cashback-credit-card/',
  'sbi-elite': 'https://www.paisabazaar.com/credit-card/sbi-card-elite/',
  'icici-amazon-pay': 'https://www.paisabazaar.com/credit-card/amazon-pay-icici-bank-credit-card/',
  'icici-coral': 'https://www.paisabazaar.com/credit-card/icici-bank-coral-credit-card/',
  'idfc-first-wealth': 'https://www.paisabazaar.com/credit-card/idfc-first-wealth-credit-card/',
  'idfc-first-select': 'https://www.paisabazaar.com/credit-card/idfc-first-select-credit-card/',
  'onecard': 'https://www.paisabazaar.com/credit-card/onecard-credit-card/',
};

export type AffiliateType = 'paisabazaar' | 'bank-direct' | 'earnkaro';

export function getApplyUrl(card: CreditCard): { url: string; type: AffiliateType; label: string } {
  // 1. Paisabazaar — highest commission, use where available
  if (PB_CARD_URLS[card.slug]) {
    return {
      url: PB_CARD_URLS[card.slug],
      type: 'paisabazaar',
      label: 'Apply via Paisabazaar',
    };
  }

  // 2. Bank direct page — always works, no commission yet
  const bankUrl = BANK_DIRECT[card.bank];
  if (bankUrl) {
    return {
      url: bankUrl,
      type: 'bank-direct',
      label: 'Apply on bank website',
    };
  }

  // 3. Fallback
  return {
    url: `https://www.paisabazaar.com/credit-card/${card.slug}/`,
    type: 'paisabazaar',
    label: 'Apply now',
  };
}

// UAE affiliate URLs
export function getUAEApplyUrl(cardId: string, bank: string): string {
  const UAE_URLS: Record<string, string> = {
    'enbd-beyond': 'https://www.emiratesnbd.com/en/personal-banking/cards/credit-cards/beyond-credit-card/',
    'enbd-skywards-signature': 'https://www.emiratesnbd.com/en/personal-banking/cards/credit-cards/skywards-signature/',
    'fab-infinite': 'https://www.bankfab.com/en-ae/personal/cards/credit-cards/fab-infinite',
    'fab-cashback': 'https://www.bankfab.com/en-ae/personal/cards/credit-cards/cashback',
    'mashreq-cashback': 'https://www.mashreq.com/en/uae/personal/cards/credit-cards/',
    'citibank-uae-prestige': 'https://www.citibank.com.ae/en/credit-cards/',
  };
  return UAE_URLS[cardId] || `https://yallacompare.com/credit-cards/`;
}
