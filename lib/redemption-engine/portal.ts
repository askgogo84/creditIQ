import type { PortalTerms } from './types';

export const SMARTBUY_SOURCE = 'https://offers.smartbuy.hdfcbank.com/';
export const SMARTBUY_AS_OF = '2026-08-31';

// HDFC Infinia SmartBuy, captured 31 Aug 2026:
// ₹1 / point on hotel/flight redemptions, 70% transaction cap, ₹99 + 18% GST.
// Engine units are paise / basis points. Programme eligibility is deliberately
// separate from portal eligibility.
export const INFINIA_PORTAL: PortalTerms = {
  value_paise_per_point: 100,
  cap_bp: 7000,
  fee_minor: 9900,
  fee_tax_bp: 1800,
  eligible_basis: { basis: 'TOTAL', excluded: [] },
  provenance: [
    {
      value: {
        value_paise_per_point: 100,
        cap_bp: 7000,
        fee_minor: 9900,
        fee_tax_bp: 1800,
      },
      state: 'VERIFIED',
      source_url: SMARTBUY_SOURCE,
      as_of: SMARTBUY_AS_OF,
    },
  ],
};

