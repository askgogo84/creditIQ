import type { CreditCard } from './types';

// Affiliate IDs come from environment variables â€” fill these once approved
const PARTNER_IDS = {
  paisabazaar: process.env.PAISABAZAAR_PARTNER_ID,
  bankbazaar: process.env.BANKBAZAAR_PARTNER_ID,
  cashkaro: process.env.CASHKARO_PARTNER_ID,
  hdfc: process.env.HDFC_AFFILIATE_ID,
  sbi: process.env.SBI_AFFILIATE_ID,
  axis: process.env.AXIS_AFFILIATE_ID,
  icici: process.env.ICICI_AFFILIATE_ID,
};

/**
 * Build affiliate Apply Now URL.
 * Priority: bank-direct affiliate > aggregator (Paisabazaar/BankBazaar) > generic bank URL.
 */
export function getApplyUrl(card: CreditCard): { url: string; type: 'affiliate-direct' | 'affiliate-aggregator' | 'bank-direct' | 'placeholder' } {
  // If card has explicit affiliate URL, use it
  if (card.apply_url_affiliate) {
    return { url: card.apply_url_affiliate, type: 'affiliate-direct' };
  }

  // Bank-specific direct affiliate
  const directBankPatterns: Record<string, string> = {
    HDFC: `https://applyonline.hdfcbank.com/cards/credit-cards/${card.slug}?af_id=${PARTNER_IDS.hdfc || ''}`,
    SBI: `https://www.sbicard.com/en/personal/credit-cards/${card.slug}.page?afid=${PARTNER_IDS.sbi || ''}`,
    Axis: `https://application.axisbank.co.in/webforms/axis-credit-card/${card.slug}?aff=${PARTNER_IDS.axis || ''}`,
    ICICI: `https://www.icicibank.com/personal-banking/cards/credit-card/${card.slug}?utm_source=${PARTNER_IDS.icici || 'CreditIQ'}`,
  };

  if (PARTNER_IDS[card.bank.toLowerCase() as keyof typeof PARTNER_IDS] && directBankPatterns[card.bank]) {
    return { url: directBankPatterns[card.bank], type: 'affiliate-direct' };
  }

  // Aggregator fallback
  if (PARTNER_IDS.paisabazaar) {
    return {
      url: `https://www.paisabazaar.com/credit-card/${card.slug}?utm_source=CreditIQ&partner_id=${PARTNER_IDS.paisabazaar}`,
      type: 'affiliate-aggregator',
    };
  }
  if (PARTNER_IDS.bankbazaar) {
    return {
      url: `https://www.bankbazaar.com/credit-card/${card.slug}.html?aff=${PARTNER_IDS.bankbazaar}`,
      type: 'affiliate-aggregator',
    };
  }

  // Bank direct (no affiliate)
  if (card.apply_url) return { url: card.apply_url, type: 'bank-direct' };

  // Placeholder â€” sends to bank homepage
  const bankHomes: Record<string, string> = {
    HDFC: 'https://www.hdfcbank.com/personal/pay/cards/credit-cards',
    SBI: 'https://www.sbicard.com/en/personal/credit-cards.page',
    ICICI: 'https://www.icicibank.com/personal-banking/cards/credit-card',
    Axis: 'https://www.axisbank.com/retail/cards/credit-card',
    Kotak: 'https://www.kotak.com/en/personal-banking/cards/credit-cards.html',
    AmEx: 'https://www.americanexpress.com/in/credit-cards/',
    IDFC: 'https://www.idfcfirstbank.com/credit-card',
    RBL: 'https://www.rblbank.com/category/credit-cards',
    Yes: 'https://www.yesbank.in/personal-banking/yes-individual/cards/credit-cards',
    IndusInd: 'https://www.indusind.com/in/en/personal/cards/credit-card.html',
    SC: 'https://www.sc.com/in/credit-cards/',
    AU: 'https://www.aubank.in/credit-cards',
  };
  return {
    url: bankHomes[card.bank] || 'https://www.google.com/search?q=' + encodeURIComponent(`${card.name} apply`),
    type: 'placeholder',
  };
}

