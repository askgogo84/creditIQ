import type { Metadata } from 'next';
import { CARD_COUNT, BANK_COUNT } from '@/lib/catalogue-stats';
export const metadata: Metadata = {
  title: 'Credit Cards by Bank - All Indian Banks and Issuers',
  // "and N more" = total issuers minus the six named above, derived from BANK_COUNT.
  description: `Browse ${CARD_COUNT} credit cards by issuing bank. Compare HDFC, SBI, ICICI, Axis, Amex, IDFC and ${BANK_COUNT - 6} more. Real annual value, devaluation history, honest rankings.`,
};
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
